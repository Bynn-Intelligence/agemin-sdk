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
import { getDefaultMode, isSupported } from '../utils/device';

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
    
    if (!config.sessionId) {
      throw new Error('Agemin SDK: sessionId is required for security. Generate this server-side.');
    }
    
    // Validate sessionId size (max 50 bytes)
    const sessionIdBytes = new TextEncoder().encode(config.sessionId).length;
    if (sessionIdBytes > 50) {
      throw new Error(`Agemin SDK: sessionId exceeds 50 bytes limit (current: ${sessionIdBytes} bytes)`);
    }
    
    // Validate metadata size if provided (max 50 bytes when stringified)
    if (config.metadata) {
      const metadataString = JSON.stringify(config.metadata);
      const metadataBytes = new TextEncoder().encode(metadataString).length;
      if (metadataBytes > 50) {
        throw new Error(`Agemin SDK: metadata exceeds 50 bytes limit when stringified (current: ${metadataBytes} bytes)`);
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
      cancelUrl: config.cancelUrl || null
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
    
    // Use the sessionId from config
    const sessionId = this.config.sessionId;
    
    // Build verification URL
    const url = this.buildVerificationUrl(sessionId, options);
    
    // Handle verification based on mode
    const mode = options.mode || getDefaultMode();
    
    if (this.config.debug) {
      console.log('Starting verification', {
        sessionId,
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
    
    return sessionId;
  }
  
  /**
   * Close the verification modal/popup
   */
  close(): void {
    this.modal.close();
    this.cleanup();
  }
  
  /**
   * Get the session ID
   */
  getSessionId(): string {
    return this.config.sessionId;
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
      }
    });
  }
  
  private buildVerificationUrl(sessionId: string, options: VerifyOptions): string {
    const params: Record<string, any> = {
      asset_id: this.config.assetId,
      session_id: sessionId,
      theme: options.theme || this.config.theme,
      locale: options.locale || this.config.locale,
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
    
    return buildUrl(this.config.baseUrl, params);
  }
  
  private handleSuccess(data: any): void {
    if (this.config.debug) {
      console.log('Agemin SDK: Verification process completed', data);
    }
    
    // Create result with only sessionId and completed status
    const result: VerificationResult = {
      sessionId: this.config.sessionId,
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
    
    // Handle dynamic resizing if needed
    const modal = document.getElementById('agemin-modal');
    if (modal && data.height) {
      modal.style.height = `${Math.min(data.height, 700)}px`;
    }
  }
  
  private cleanup(): void {
    this.callbacks = {};
  }
}