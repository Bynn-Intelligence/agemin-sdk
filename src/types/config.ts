export type Theme = 'light' | 'dark' | 'auto';
export type VerificationMode = 'modal' | 'redirect';

export interface AgeminConfig {
  /**
   * Your unique asset ID provided by Agemin
   */
  assetId: string;
  
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
   * Callback when visitor successfully meets age requirement
   */
  onSuccess?: (data: VerificationResult) => void;
  
  /**
   * Callback when visitor fails to meet age requirement
   */
  onFail?: (data: VerificationResult) => void;
  
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
   */
  sessionId: string;
  
  /**
   * Verification token
   */
  token: string;
  
  /**
   * Timestamp of verification
   */
  timestamp: number;
  
  /**
   * Age verification status
   * - 'verified': Visitor meets age requirement
   * - 'underage': Visitor does not meet age requirement
   */
  status: 'verified' | 'underage';
  
  /**
   * Additional data from the verification
   */
  data?: Record<string, any>;
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