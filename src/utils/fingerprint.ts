/**
 * Device fingerprinting utilities using FingerprintJS
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Cache for the FingerprintJS agent promise
let fpAgentPromise: Promise<any> | null = null;

// Cache for the generated fingerprint
let cachedFingerprint: string | null = null;

/**
 * Initialize the FingerprintJS agent (singleton pattern)
 * This is called once and the agent is cached for subsequent calls
 */
function initializeFingerprintAgent(): Promise<any> {
  if (!fpAgentPromise) {
    fpAgentPromise = FingerprintJS.load();
  }
  return fpAgentPromise;
}

/**
 * Get the device fingerprint
 * Returns a unique visitor ID that remains consistent across sessions
 * Returns empty string if fingerprinting fails (graceful degradation)
 */
export async function getDeviceFingerprint(forceRefresh: boolean = false): Promise<string> {
  try {
    // Return cached fingerprint if available and not forcing refresh
    if (cachedFingerprint && !forceRefresh) {
      return cachedFingerprint;
    }

    // Initialize the agent if not already done
    const fpAgent = await initializeFingerprintAgent();
    
    // Get the visitor data
    const result = await fpAgent.get();
    
    // Cache the fingerprint
    cachedFingerprint = result.visitorId;
    
    return cachedFingerprint || '';
  } catch (error) {
    // Log error in debug mode but don't fail the verification process
    if (typeof console !== 'undefined' && console.error) {
      console.error('Agemin SDK: Failed to generate device fingerprint', error);
    }
    
    // Return empty string on failure (graceful degradation)
    return '';
  }
}

/**
 * Clear the cached fingerprint
 * Useful for testing or when a new fingerprint is needed
 */
export function clearFingerprintCache(): void {
  cachedFingerprint = null;
}

/**
 * Check if FingerprintJS is supported in the current environment
 */
export function isFingerprintSupported(): boolean {
  return typeof window !== 'undefined' && typeof Promise !== 'undefined';
}