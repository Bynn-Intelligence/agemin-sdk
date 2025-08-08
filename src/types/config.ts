export type Theme = 'light' | 'dark' | 'auto';
export type VerificationMode = 'modal' | 'redirect';

export interface AgeminConfig {
  /**
   * Your unique asset ID from agemin.com/app/websites
   * Format: asset_5b08b274353b92f4
   */
  assetId: string;
  
  /**
   * Unique session ID for this verification request
   * Should be generated server-side for security
   * Maximum 50 bytes
   */
  sessionId: string;
  
  /**
   * Optional metadata to attach to the verification
   * Maximum 50 bytes (will be JSON stringified)
   */
  metadata?: Record<string, any>;
  
  /**
   * Base URL for the Agemin verification service
   * @default 'https://verify.agemin.com'
   */
  baseUrl?: string;
  
  /**
   * URL to redirect to on error
   */
  errorUrl?: string | null;
  
  /**
   * URL to redirect to on success
   */
  successUrl?: string | null;
  
  /**
   * URL to redirect to on cancellation
   */
  cancelUrl?: string | null;
  
  /**
   * Theme for the verification interface
   * @default 'auto'
   */
  theme?: Theme;
  
  /**
   * Locale for the verification interface
   * @default 'en'
   */
  locale?: string;
  
  /**
   * Enable debug mode for verbose logging
   * @default false
   */
  debug?: boolean;
}

export interface VerifyOptions {
  /**
   * How to display the verification interface
   * @default 'modal'
   */
  mode?: VerificationMode;
  
  /**
   * Override the theme for this verification
   */
  theme?: Theme;
  
  /**
   * Override the locale for this verification
   */
  locale?: string;
  
  /**
   * Custom metadata to attach to the verification
   */
  metadata?: Record<string, any>;
  
  /**
   * Callback when verification process completes successfully
   * Note: This does NOT indicate if age requirement was met
   * You must verify the result server-side using your private key
   */
  onSuccess?: (data: VerificationResult) => void;
  
  /**
   * Callback when technical error occurs (API, network, model errors)
   * Recommended: Show fallback age confirmation modal
   */
  onError?: (error: VerificationError) => void;
  
  /**
   * Callback when verification is cancelled by user
   */
  onCancel?: () => void;
  
  /**
   * Callback when verification modal/popup is closed
   */
  onClose?: () => void;
}

export interface VerificationResult {
  /**
   * Unique session ID for this verification
   * Use this to fetch actual results server-side
   */
  sessionId: string;
  
  /**
   * Indicates verification process completed successfully
   * Does NOT indicate if age requirement was met
   */
  completed: boolean;
  
  /**
   * Timestamp when verification completed
   */
  timestamp: number;
}

export interface VerificationError {
  /**
   * Error code
   */
  code: string;
  
  /**
   * Human-readable error message
   */
  message: string;
  
  /**
   * Additional error details
   */
  details?: Record<string, any>;
}