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
import { setCookie, getCookie, deleteCookie } from '../utils/cookies';
import { validateJWT, decodeJWT } from '../utils/jwt';

// Global state interface
interface AgeminGlobalState {
  isInitializing: boolean;
  isVerifying: boolean;
  referenceId: string | null;
  verificationPromise: Promise<boolean> | null;
  verificationResolve: ((value: boolean) => void) | null;
  verificationReject: ((error: any) => void) | null;
  validationQueue: Promise<any>;
  instances: { [assetId: string]: Agemin };  // Store instances keyed by assetId
  instanceCreationInProgress: { [assetId: string]: boolean };  // Track instance creation
}

// Initialize global state on window object
// This persists across module re-evaluations and React remounts
declare global {
  interface Window {
    __AGEMIN__: AgeminGlobalState;
  }
}

// Initialize state if not already present
if (typeof window !== 'undefined' && !window.__AGEMIN__) {
  window.__AGEMIN__ = {
    isInitializing: false,
    isVerifying: false,
    referenceId: null,
    verificationPromise: null,
    verificationResolve: null,
    verificationReject: null,
    validationQueue: Promise.resolve(),
    instances: {},  // Initialize empty instances map
    instanceCreationInProgress: {}  // Track ongoing instance creation
  };
}

export class Agemin {
  // Static property for verification state only
  private static isVerificationActive: boolean = false;
  
  // Instance properties
  private config: Required<AgeminConfig>;
  private modal: Modal;
  private callbacks: {
    onSuccess?: (data: VerificationResult) => void;
    onAgePass?: (data: VerificationResult) => void;
    onAgeFail?: (data: VerificationResult) => void;
    onError?: (error: VerificationError) => void;
    onCancel?: () => void;
    onClose?: () => void;
  } = {};

  constructor(config: AgeminConfig) {
    if (!config || !config.assetId) {
      throw new Error('Agemin SDK: assetId is required');
    }
    
    // Check if instance already exists for this assetId
    if (typeof window !== 'undefined' && window.__AGEMIN__?.instances[config.assetId]) {
      if (config.debug) {
        console.warn(`Agemin SDK: Instance already exists for assetId ${config.assetId}. Returning existing instance with updated referenceId.`);
      }
      
      // Update the referenceId (and other request-specific config) on the existing instance
      // This allows React StrictMode to work correctly with different referenceIds
      const instance = window.__AGEMIN__.instances[config.assetId];
      instance.config.referenceId = config.referenceId;
      
      // Also update metadata if provided
      if (config.metadata !== undefined) {
        instance.config.metadata = config.metadata;
      }
      
      return instance;
    }
    
    // Check if instance creation is already in progress for this assetId (race condition prevention)
    if (typeof window !== 'undefined' && window.__AGEMIN__?.instanceCreationInProgress[config.assetId]) {
      if (config.debug) {
        console.warn(`Agemin SDK: Instance creation already in progress for assetId ${config.assetId}. Waiting for completion...`);
      }
      
      // Wait a bit and try to get the instance
      const waitForInstance = () => {
        const instance = window.__AGEMIN__.instances[config.assetId];
        if (instance) {
          // Update config on the instance that was created
          instance.config.referenceId = config.referenceId;
          if (config.metadata !== undefined) {
            instance.config.metadata = config.metadata;
          }
          return instance;
        }
        // If still not ready, return a temporary instance that will be replaced
        return this;
      };
      
      // Try to get the instance after a short delay
      setTimeout(waitForInstance, 10);
      return waitForInstance();
    }
    
    // Mark that we're creating an instance for this assetId (prevents race conditions)
    if (typeof window !== 'undefined' && window.__AGEMIN__) {
      window.__AGEMIN__.instanceCreationInProgress[config.assetId] = true;
      // IMMEDIATELY store this instance to prevent other parallel calls from creating duplicates
      window.__AGEMIN__.instances[config.assetId] = this;
    }

    if (!config.referenceId) {
      throw new Error('Agemin SDK: Unique referenceId is required. Generally use the id your webserver sets for the session.');
    }
    
    // Log instance creation
    if (config.debug) {
      console.log(`Agemin SDK: Creating first instance with referenceId: ${config.referenceId}`);
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
    
    // Clear the creation flag now that instance is fully initialized
    if (typeof window !== 'undefined' && window.__AGEMIN__) {
      delete window.__AGEMIN__.instanceCreationInProgress[this.config.assetId];
    }
  }

  /**
   * Start the verification process and return a promise that resolves when complete
   */
  private verifyAndWait(options: VerifyOptions = {}): Promise<boolean> {
    // Check if modal already exists in DOM
    if (document.getElementById('agemin-iframe')) {
      if (this.config.debug) {
        console.log('Agemin SDK: Modal already exists, returning existing promise');
      }
      // Return the existing promise if available
      if (window.__AGEMIN__.verificationPromise) {
        return window.__AGEMIN__.verificationPromise;
      }
      // Otherwise create a rejected promise (shouldn't happen)
      return Promise.reject(new Error('Modal exists but no promise found'));
    }

    // Check if verification is already in progress globally
    if (window.__AGEMIN__.verificationPromise) {
      if (this.config.debug) {
        console.log('Agemin SDK: Verification already in progress globally, returning existing promise');
      }
      return window.__AGEMIN__.verificationPromise;
    }
    
    // Check if another instance is already verifying
    if (window.__AGEMIN__.isVerifying) {
      if (this.config.debug) {
        console.log('Agemin SDK: Another instance is verifying, but no promise found. Creating new verification.');
      }
    }

    // Create a new promise for this verification
    const verificationPromise = new Promise<boolean>((resolve, reject) => {
      // Store the resolve and reject functions globally
      window.__AGEMIN__.verificationResolve = resolve;
      window.__AGEMIN__.verificationReject = reject;
      
      // Mark verification as in progress globally
      window.__AGEMIN__.isVerifying = true;

      // Store callbacks
      this.callbacks = {
        onSuccess: options.onSuccess,
        onAgePass: options.onAgePass,
        onAgeFail: options.onAgeFail,
        onError: options.onError,
        onCancel: options.onCancel,
        onClose: options.onClose
      };

      // Use the referenceId from this instance's config
      const referenceId = this.config.referenceId;
      
      // Store the referenceId globally so other instances know which one is active
      window.__AGEMIN__.referenceId = referenceId;

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
            // For redirect mode, we can't track completion
            resolve(false);
            break;

          case 'modal':
          default:
            // Open the modal
            this.modal.openIframe(url, () => this.handleCancel());
            // Promise will be resolved in handleSuccess/handleError/handleCancel
            break;
        }
      } catch (error) {
        // Reset global state on error
        window.__AGEMIN__.isVerifying = false;
        window.__AGEMIN__.referenceId = null;
        window.__AGEMIN__.isInitializing = false;
        window.__AGEMIN__.verificationResolve = null;
        window.__AGEMIN__.verificationReject = null;
        
        this.handleError({
          code: 'LAUNCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to launch verification'
        });
        
        reject(error);
      }
    });
    
    // Store the promise globally
    window.__AGEMIN__.verificationPromise = verificationPromise;
    
    return verificationPromise;
  }

  /**
   * Start the verification process (legacy method that returns referenceId)
   */
  verify(options: VerifyOptions = {}): string {
    // Start verification asynchronously
    this.verifyAndWait(options).catch(error => {
      if (this.config.debug) {
        console.error('Agemin SDK: Verification failed', error);
      }
    });
    
    // Return the referenceId for backward compatibility
    return window.__AGEMIN__.referenceId || this.config.referenceId;
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
   * Validate existing session and launch verification if needed
   * @returns true if valid session exists, false if verification was launched
   */
  async validateSession(options?: VerifyOptions): Promise<boolean> {
    // Check if verification is already active (singleton pattern)
    if (Agemin.isVerificationActive) {
      if (this.config.debug) {
        console.log('Agemin SDK: Verification already active, skipping this request');
      }
      // Return existing promise if available
      if (window.__AGEMIN__.verificationPromise) {
        return window.__AGEMIN__.verificationPromise;
      }
      return false;
    }
    
    // Check if modal already exists in DOM
    if (document.getElementById('agemin-iframe')) {
      if (this.config.debug) {
        console.log('Agemin SDK: Modal already exists in DOM');
      }
      // Return existing promise if available
      if (window.__AGEMIN__.verificationPromise) {
        return window.__AGEMIN__.verificationPromise;
      }
      return false;
    }
    
    // Mark verification as active
    Agemin.isVerificationActive = true;
    
    if (this.config.debug) {
      console.log(`Agemin SDK: Starting validation for singleton instance`);
    }
    
    try {
      // Create and store the promise
      window.__AGEMIN__.verificationPromise = this.doValidateSession(options);
      const result = await window.__AGEMIN__.verificationPromise;
      return result;
    } catch (error) {
      // Reset state on error
      window.__AGEMIN__.verificationPromise = null;
      if (this.config.debug) {
        console.error('Agemin SDK: Validation failed', error);
      }
      throw error;
    } finally {
      // Always clear the active flag when done
      Agemin.isVerificationActive = false;
    }
  }

  /**
   * Internal method that performs the actual validation
   */
  private async doValidateSession(options?: VerifyOptions): Promise<boolean> {
    try {
      // Check for existing JWT cookie
      const cookieName = 'agemin_verification';
      const existingJWT = getCookie(cookieName);
      
      if (this.config.debug) {
        console.log('Agemin SDK: Checking for existing session', { hasJWT: !!existingJWT });
      }
      
      // If no JWT exists, launch verification
      if (!existingJWT) {
        if (this.config.debug) {
          console.log('Agemin SDK: No existing JWT, launching verification');
        }
        // Use verifyAndWait to get a promise that resolves when verification completes
        return this.verifyAndWait(options);
      }
      
      // Validate the JWT
      const validationResult = await validateJWT(existingJWT);
      
      if (this.config.debug) {
        console.log('Agemin SDK: JWT validation result', {
          isValid: validationResult.isValid,
          isOfAge: validationResult.isOfAge,
          error: validationResult.error
        });
      }
      
      // If JWT is valid and user is of age, return true
      if (validationResult.isValid && validationResult.isOfAge) {
        if (this.config.debug) {
          console.log('Agemin SDK: Valid session exists, user is of age');
        }
        // Don't clear isInitializing here - let completion handlers do it
        return true;
      }
      
      // If JWT is invalid, expired, or user is not of age, delete cookie and launch verification
      if (this.config.debug) {
        console.log('Agemin SDK: Invalid or expired JWT, or user not of age, launching verification');
      }
      
      // Delete the invalid/expired cookie
      deleteCookie(cookieName);
      
      // Launch verification and wait for completion
      return this.verifyAndWait(options);
      
    } catch (error) {
      if (this.config.debug) {
        console.error('Agemin SDK: Error validating session', error);
      }
      
      // On any error, launch verification as fallback
      return this.verifyAndWait(options);
    }
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
  
  /**
   * Check if verification is currently active
   */
  static isVerificationInProgress(): boolean {
    if (typeof window !== 'undefined' && window.__AGEMIN__) {
      return window.__AGEMIN__.isVerifying || !!window.__AGEMIN__.verificationPromise;
    }
    return false;
  }
  
  /**
   * Get the active verification promise if one exists
   */
  static getActiveVerificationPromise(): Promise<boolean> | null {
    if (typeof window !== 'undefined' && window.__AGEMIN__) {
      return window.__AGEMIN__.verificationPromise;
    }
    return null;
  }
  
  /**
   * Get the instance for a specific assetId (create if needed)
   */
  static getInstance(config?: AgeminConfig): Agemin {
    if (!config?.assetId) {
      throw new Error('Agemin SDK: assetId is required in config.');
    }
    
    // Check window storage for existing instance with this assetId
    if (typeof window !== 'undefined' && window.__AGEMIN__?.instances[config.assetId]) {
      return window.__AGEMIN__.instances[config.assetId];
    }
    
    // Create new instance (constructor will store it on window)
    return new Agemin(config);
  }
  
  /**
   * Reset instances (useful for testing)
   * @param assetId - Optional: reset only a specific assetId's instance. If not provided, resets all.
   */
  static reset(assetId?: string): void {
    if (typeof window !== 'undefined' && window.__AGEMIN__) {
      if (assetId) {
        // Reset specific instance
        const instance = window.__AGEMIN__.instances[assetId];
        if (instance) {
          // Close any open modal
          if (instance.modal) {
            instance.modal.close();
          }
          delete window.__AGEMIN__.instances[assetId];
        }
        delete window.__AGEMIN__.instanceCreationInProgress[assetId];
      } else {
        // Reset all instances
        for (const id in window.__AGEMIN__.instances) {
          const instance = window.__AGEMIN__.instances[id];
          if (instance?.modal) {
            instance.modal.close();
          }
        }
        window.__AGEMIN__.instances = {};
        window.__AGEMIN__.instanceCreationInProgress = {};
      }
    }
    
    Agemin.isVerificationActive = false;
    
    // Clear global state
    if (typeof window !== 'undefined' && window.__AGEMIN__) {
      window.__AGEMIN__.isInitializing = false;
      window.__AGEMIN__.isVerifying = false;
      window.__AGEMIN__.referenceId = null;
      window.__AGEMIN__.verificationPromise = null;
      window.__AGEMIN__.verificationResolve = null;
      window.__AGEMIN__.verificationReject = null;
      window.__AGEMIN__.validationQueue = Promise.resolve();
    }
    
    // Remove any lingering modal from DOM
    const existingModal = document.getElementById('agemin-modal');
    if (existingModal) {
      existingModal.remove();
    }
    const existingIframe = document.getElementById('agemin-iframe');
    if (existingIframe && existingIframe.parentElement) {
      existingIframe.parentElement.remove();
    }
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
          if (this.config.debug) {
            console.log('Agemin SDK: Success message received with data:', message.data);
          }
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

  private async handleSuccess(data: any): Promise<void> {
    if (this.config.debug) {
      console.log('Agemin SDK: Verification process completed', data);
    }

    let isOfAge: boolean | null = null; // null means no JWT to determine age

    if (this.config.debug) {
      console.log('Agemin SDK: Checking for JWT in data:', { hasJWT: !!data?.jwt, dataKeys: Object.keys(data || {}) });
    }

    // Store JWT as cookie if provided and decode it
    if (data?.jwt) {
      const cookieName = 'agemin_verification';
      
      if (this.config.debug) {
        console.log('Agemin SDK: JWT present, attempting to decode');
      }
      
      // Decode the JWT to check if user passed
      try {
        const decoded = decodeJWT(data.jwt);
        if (this.config.debug) {
          console.log('Agemin SDK: JWT decode result:', decoded);
        }
        if (decoded) {
          isOfAge = decoded.data?.is_of_age === true;
          
          if (this.config.debug) {
            console.log('Agemin SDK: JWT decoded, is_of_age:', isOfAge);
          }
        }
      } catch (error) {
        console.error('Agemin SDK: Failed to decode JWT', error);
      }
      
      // Store the cookie
      if (data?.exp !== undefined && data?.jwt) {
        const now = Math.floor(Date.now() / 1000);
        const secondsUntilExpiration = data.exp - now;
        
        if (this.config.debug) {
          console.log(`Agemin SDK: Cookie storage - exp: ${data.exp}, now: ${now}, seconds until exp: ${secondsUntilExpiration}`);
        }
        
        if (data.exp === null || data.exp === 0 || secondsUntilExpiration <= 0) {
          // Session cookie - no expiration or already expired means session-only
          setCookie(cookieName, data.jwt, null);
          if (this.config.debug) {
            console.log('Agemin SDK: Stored session JWT cookie (session-only)');
          }
        } else {
          // Set cookie with expiration
          setCookie(cookieName, data.jwt, secondsUntilExpiration);
          if (this.config.debug) {
            console.log(`Agemin SDK: Stored JWT cookie, expires in ${secondsUntilExpiration} seconds`);
          }
        }
      } else {
        if (this.config.debug) {
          console.log('Agemin SDK: Not storing cookie - missing exp or jwt');
        }
      }
    } else {
      if (this.config.debug) {
        console.log('Agemin SDK: No JWT found in data');
      }
    }

    // Create result with only referenceId and completed status
    const result: VerificationResult = {
      referenceId: this.config.referenceId,
      completed: true,
      timestamp: Date.now()
    };

    this.close();

    // Always call onSuccess first (verification process completed)
    if (this.callbacks.onSuccess) {
      if (this.config.debug) {
        console.log('Agemin SDK: Calling onSuccess (verification completed)');
      }
      this.callbacks.onSuccess(result);
    }

    // If JWT was present and decoded, call age-specific callbacks
    if (isOfAge !== null) {
      if (isOfAge === true) {
        if (this.config.debug) {
          console.log('Agemin SDK: User is of age, calling onAgePass');
        }
        if (this.callbacks.onAgePass) {
          this.callbacks.onAgePass(result);
        }
      } else {
        if (this.config.debug) {
          console.log('Agemin SDK: User is not of age, calling onAgeFail');
        }
        if (this.callbacks.onAgeFail) {
          this.callbacks.onAgeFail(result);
        }
      }
    } else {
      if (this.config.debug) {
        console.log('Agemin SDK: No JWT present (strong API security mode) - age result must be checked server-side');
      }
    }

    // Navigate if URLs are configured (only if we know the age result)
    if (isOfAge === true && this.config.successUrl) {
      window.location.href = this.config.successUrl;
    } else if (isOfAge === false && this.config.errorUrl) {
      window.location.href = this.config.errorUrl;
    }
    
    // Resolve the promise (true if age verified and of age, false otherwise)
    const verificationPassed = isOfAge === true;
    if (window.__AGEMIN__.verificationResolve) {
      window.__AGEMIN__.verificationResolve(verificationPassed);
    }
    
    // Reset global verification state
    window.__AGEMIN__.isVerifying = false;
    window.__AGEMIN__.verificationPromise = null;
    window.__AGEMIN__.referenceId = null;
    window.__AGEMIN__.isInitializing = false;
    window.__AGEMIN__.verificationResolve = null;
    window.__AGEMIN__.verificationReject = null;
    
    // Clear singleton verification flag
    Agemin.isVerificationActive = false;
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
    
    // Reject the promise
    if (window.__AGEMIN__.verificationReject) {
      window.__AGEMIN__.verificationReject(error);
    }
    
    // Reset global verification state
    window.__AGEMIN__.isVerifying = false;
    window.__AGEMIN__.verificationPromise = null;
    window.__AGEMIN__.referenceId = null;
    window.__AGEMIN__.isInitializing = false;
    window.__AGEMIN__.verificationResolve = null;
    window.__AGEMIN__.verificationReject = null;
    
    // Clear singleton verification flag
    Agemin.isVerificationActive = false;
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
    
    // Reject the promise with cancellation
    if (window.__AGEMIN__.verificationReject) {
      window.__AGEMIN__.verificationReject(new Error('Verification cancelled by user'));
    }
    
    // Reset global verification state
    window.__AGEMIN__.isVerifying = false;
    window.__AGEMIN__.verificationPromise = null;
    window.__AGEMIN__.referenceId = null;
    window.__AGEMIN__.isInitializing = false;
    window.__AGEMIN__.verificationResolve = null;
    window.__AGEMIN__.verificationReject = null;
    
    // Clear singleton verification flag
    Agemin.isVerificationActive = false;
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
