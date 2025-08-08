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

/**
 * Get the browser's language
 */
export function getBrowserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en';
  
  // Try to get the most specific language first
  const lang = navigator.language || 
                (navigator as any).userLanguage || 
                (navigator.languages && navigator.languages[0]) || 
                'en';
  
  // Return the language code (e.g., 'en-US' -> 'en')
  return lang.split('-')[0].toLowerCase();
}