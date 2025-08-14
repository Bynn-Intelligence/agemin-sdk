import { Modal } from './Modal';
import {
  AgeminConfig,
  VerifyOptions,
  VerificationResult,
  VerificationError,
  MessageType
} from '../types';
import { DEFAULT_CONFIG, SDK_VERSION } from '../utils/constants';
import {
  buildUrl,
  parseMessage,
  isTrustedOrigin
} from '../utils/dom';
import { getDefaultMode, isSupported, getBrowserLanguage } from '../utils/device';

export class Agemin {
  private config: Required<AgeminConfig>;
  private modal: Modal;
  private callbacks: {
    onSuccess?: (data: VerificationResult) => void;
    onError?: (error: VerificationError) => void;
    onCancel?: () => void;
    onClose?: () => void;
  } = {};

  constructor(config: AgeminConfig) {
    if (!config || !config.assetId) {
      throw new Error('Agemin SDK: assetId is required');
    }

    if (!config.referenceId) {
      throw new Error('Agemin SDK: Unique referenceId is required. Generally use the id your webserver sets for the session.');
    }

    // Validate referenceId size (max 50 bytes)
    const referenceIdBytes = new TextEncoder().encode(config.referenceId).length;
    if (referenceIdBytes > 50) {
      throw new Error(`Agemin SDK: referenceId exceeds 50 bytes limit (current: ${referenceIdBytes} bytes)`);
    }

    // Validate metadata size if provided (max 256 bytes when stringified)
    if (config.metadata) {
      const metadataString = JSON.stringify(config.metadata);
      const metadataBytes = new TextEncoder().encode(metadataString).length;
      if (metadataBytes > 256) {
        throw new Error(`Agemin SDK: metadata exceeds 256 bytes limit when stringified (current: ${metadataBytes} bytes)`);
      }
    }

    if (!isSupported()) {
      throw new Error('Agemin SDK: Browser not supported');
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      errorUrl: config.errorUrl || null,
      successUrl: config.successUrl || null,
      cancelUrl: config.cancelUrl || null,
      verificationURL: config.verificationURL || null
    } as Required<AgeminConfig>;

    this.modal = new Modal();

    if (this.config.debug) {
      console.log('Agemin SDK initialized', {
        version: SDK_VERSION,
        config: this.config
      });
    }

    this.setupMessageListener();
  }

  /**
   * Start the verification process
   */
  verify(options: VerifyOptions = {}): string {
    // Store callbacks
    this.callbacks = {
      onSuccess: options.onSuccess,
      onError: options.onError,
      onCancel: options.onCancel,
      onClose: options.onClose
    };

    // Use the referenceId from config
    const referenceId = this.config.referenceId;

    // Build verification URL
    const url = this.buildVerificationUrl(referenceId, options);

    // Handle verification based on mode
    const mode = options.mode || getDefaultMode();

    if (this.config.debug) {
      console.log('Starting verification', {
        referenceId,
        mode,
        url
      });
    }

    try {
      switch (mode) {
        case 'redirect':
          window.location.href = url;
          break;

        case 'modal':
        default:
          this.modal.openIframe(url, () => this.handleCancel());
          break;
      }
    } catch (error) {
      this.handleError({
        code: 'LAUNCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to launch verification'
      });
    }

    return referenceId;
  }

  /**
   * Close the verification modal/popup
   */
  close(): void {
    this.modal.close();
    this.cleanup();
  }

  /**
   * Get the reference ID
   */
  getReferenceId(): string {
    return this.config.referenceId;
  }

  /**
   * Check if verification is currently open
   */
  isOpen(): boolean {
    return this.modal.isOpen();
  }

  /**
   * Get SDK version
   */
  static get version(): string {
    return SDK_VERSION;
  }

  /**
   * Check if browser is supported
   */
  static isSupported(): boolean {
    return isSupported();
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      // Verify origin
      if (!isTrustedOrigin(event.origin)) {
        if (this.config.debug) {
          console.warn('Agemin SDK: Untrusted origin', event.origin);
        }
        return;
      }

      const message = parseMessage(event);
      if (!message) return;

      if (this.config.debug) {
        console.log('Agemin SDK: Received message', message);
      }

      switch (message.type) {
        case MessageType.SUCCESS:
          this.handleSuccess(message.data);
          break;

        case MessageType.ERROR:
          this.handleError(message.data);
          break;

        case MessageType.CANCEL:
          this.handleCancel();
          break;

        case MessageType.CLOSE:
          this.close();
          break;

        case MessageType.READY:
          this.handleReady();
          break;

        case MessageType.RESIZE:
          this.handleResize(message.data);
          break;

        // New app message types
        case MessageType.APP_READY:
          this.handleAppReady();
          break;

        case MessageType.PROGRESS:
          this.handleProgress(message.data);
          break;

        case MessageType.STATE_CHANGE:
          this.handleStateChange(message.data);
          break;

        case MessageType.USER_ACTION:
          this.handleUserAction(message.data);
          break;

        case MessageType.CONFIG_RECEIVED:
          if (this.config.debug) {
            console.log('Agemin SDK: App confirmed config receipt');
          }
          break;
      }
    });
  }

  private buildVerificationUrl(referenceId: string, options: VerifyOptions): string {
    // Use verificationURL template if provided, otherwise construct from baseUrl
    let baseUrl: string;

    if (this.config.verificationURL) {
      // Check if verificationURL contains {assetId} placeholder
      if (this.config.verificationURL.includes('{assetId}')) {
        // Replace placeholder with actual assetId
        baseUrl = this.config.verificationURL.replace('{assetId}', this.config.assetId);
      } else {
        // No placeholder, append /start/assetId to the URL
        const separator = this.config.verificationURL.endsWith('/') ? '' : '/';
        baseUrl = `${this.config.verificationURL}${separator}start/${this.config.assetId}`;
      }
    } else {
      // Default: baseUrl/start/assetId
      baseUrl = `${this.config.baseUrl}/start/${this.config.assetId}`;
    }

    // Resolve locale - if 'auto', detect browser language
    let locale = options.locale || this.config.locale;
    if (locale === 'auto') {
      locale = getBrowserLanguage();
    }

    const params: Record<string, any> = {
      reference_id: referenceId,
      theme: options.theme || this.config.theme,
      locale: locale,
      mode: 'embedded',
      sdk_version: SDK_VERSION
    };

    if (this.config.errorUrl) params.error_url = this.config.errorUrl;
    if (this.config.successUrl) params.success_url = this.config.successUrl;
    if (this.config.cancelUrl) params.cancel_url = this.config.cancelUrl;

    // Include metadata from config (already validated in constructor)
    if (this.config.metadata) {
      params.metadata = this.config.metadata;
    }

    // Options metadata can override config metadata
    if (options.metadata) {
      params.metadata = options.metadata;
    }

    return buildUrl(baseUrl, params);
  }

  private handleSuccess(data: any): void {
    if (this.config.debug) {
      console.log('Agemin SDK: Verification process completed', data);
    }

    // Create result with only referenceId and completed status
    const result: VerificationResult = {
      referenceId: this.config.referenceId,
      completed: true,
      timestamp: Date.now()
    };

    this.close();

    if (this.callbacks.onSuccess) {
      this.callbacks.onSuccess(result);
    }

    if (this.config.successUrl) {
      window.location.href = this.config.successUrl;
    }
  }

  private handleError(error: VerificationError): void {
    if (this.config.debug) {
      console.error('Agemin SDK: Technical error occurred - consider showing fallback age confirmation', error);
    }

    this.close();

    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }

    if (this.config.errorUrl) {
      window.location.href = this.config.errorUrl;
    }
  }

  private handleCancel(): void {
    if (this.config.debug) {
      console.log('Agemin SDK: Verification cancelled');
    }

    this.cleanup();

    if (this.callbacks.onCancel) {
      this.callbacks.onCancel();
    }

    if (this.callbacks.onClose) {
      this.callbacks.onClose();
    }

    if (this.config.cancelUrl) {
      window.location.href = this.config.cancelUrl;
    }
  }

  private handleReady(): void {
    if (this.config.debug) {
      console.log('Agemin SDK: Verification interface ready');
    }

    // Hide loading spinner and show iframe
    this.modal.hideLoading();

    // Send configuration to iframe if needed
    const iframe = this.modal.getWindow();
    if (iframe && iframe instanceof HTMLIFrameElement && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'agemin:config',
        data: {
          theme: this.config.theme,
          locale: this.config.locale
        }
      }, this.config.baseUrl);
    }
  }

  private handleResize(data: { width: number; height: number }): void {
    if (this.config.debug) {
      console.log('Agemin SDK: Resize request', data);
    }

    // Use the modal's updateHeight method for smooth transitions
    if (data.height && this.modal) {
      this.modal.updateHeight(data.height);
    }
  }

  private cleanup(): void {
    this.callbacks = {};
  }

  // Handlers for new app messages
  private handleAppReady(): void {
    if (this.config.debug) {
      console.log('Agemin SDK: App is ready');
    }

    // Send initial configuration to app
    this.handleReady();

    // Emit event if listener is registered
    if (this.appEventListeners.onAppReady) {
      this.appEventListeners.onAppReady();
    }
  }

  private handleProgress(data: { percentage: number; stage?: string; message?: string }): void {
    if (this.config.debug) {
      console.log('Agemin SDK: Progress update', data);
    }

    // Emit progress event if listener is registered
    if (this.appEventListeners.onProgress) {
      this.appEventListeners.onProgress(data);
    }
  }

  private handleStateChange(data: { from: string; to: string; data?: any }): void {
    if (this.config.debug) {
      console.log('Agemin SDK: State change', data);
    }

    // Emit state change event if listener is registered
    if (this.appEventListeners.onStateChange) {
      this.appEventListeners.onStateChange(data);
    }
  }

  private handleUserAction(data: { type: string; target?: string; data?: any }): void {
    if (this.config.debug) {
      console.log('Agemin SDK: User action', data);
    }

    // Emit user action event if listener is registered
    if (this.appEventListeners.onUserAction) {
      this.appEventListeners.onUserAction(data);
    }
  }

  // Event listeners for app events
  private appEventListeners: {
    onAppReady?: () => void;
    onProgress?: (data: { percentage: number; stage?: string; message?: string }) => void;
    onStateChange?: (data: { from: string; to: string; data?: any }) => void;
    onUserAction?: (data: { type: string; target?: string; data?: any }) => void;
  } = {};

  /**
   * Register a callback for when the app is ready
   */
  onAppReady(callback: () => void): void {
    this.appEventListeners.onAppReady = callback;
  }

  /**
   * Register a callback for progress updates
   */
  onProgress(callback: (data: { percentage: number; stage?: string; message?: string }) => void): void {
    this.appEventListeners.onProgress = callback;
  }

  /**
   * Register a callback for state changes
   */
  onStateChange(callback: (data: { from: string; to: string; data?: any }) => void): void {
    this.appEventListeners.onStateChange = callback;
  }

  /**
   * Register a callback for user actions
   */
  onUserAction(callback: (data: { type: string; target?: string; data?: any }) => void): void {
    this.appEventListeners.onUserAction = callback;
  }
}
