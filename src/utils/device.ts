/**
 * Check if the current device is mobile
 */
export function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Check if the browser supports required features
 */
export function isSupported(): boolean {
  return typeof window !== 'undefined' && 
         typeof window.postMessage === 'function' &&
         typeof window.addEventListener === 'function';
}

/**
 * Get the appropriate verification mode based on device
 */
export function getDefaultMode(): 'modal' {
  // Always use modal for consistency across devices
  return 'modal';
}