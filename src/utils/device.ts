/**
 * Check if the current device is mobile
 */
export function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Check if the screen is small (mobile-sized)
 */
export function isSmallScreen(): boolean {
  // Multiple checks for better mobile detection
  
  // Check viewport width
  const isNarrowViewport = window.innerWidth < 768;
  
  // Check for touch capability
  const hasTouch = 'ontouchstart' in window || 
                   navigator.maxTouchPoints > 0 || 
                   (navigator as any).msMaxTouchPoints > 0;
  
  // Check for mobile user agent as fallback
  const isMobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Check for tablet (wider viewport but still touch)
  const isTablet = window.innerWidth < 1024 && hasTouch;
  
  // Return true if any mobile condition is met
  return isNarrowViewport || (hasTouch && isMobileUA) || isTablet;
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

/**
 * Check if browser has zero plugins (common in headless browsers)
 */
function isHeadlessPlugins(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.plugins.length === 0;
}

/**
 * Check if browser languages is empty (common in headless browsers)
 */
function isHeadlessLanguages(): boolean {
  if (typeof navigator === 'undefined') return false;
  // Check if languages is undefined, empty array, or empty string (for compatibility)
  return !navigator.languages || 
         (Array.isArray(navigator.languages) && navigator.languages.length === 0) ||
         (navigator.languages as any) === '';
}

/**
 * Check for headless WebGL vendor/renderer signatures
 */
function isHeadlessWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl || !(gl instanceof WebGLRenderingContext)) return false;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return false;
    
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    // Common headless browser signatures
    return (vendor === 'Brian Paul' && renderer === 'Mesa OffScreen') ||
           (vendor === 'Google Inc.' && renderer === 'Google SwiftShader');
  } catch (e) {
    // If WebGL check fails, assume not headless
    return false;
  }
}

/**
 * Combined headless browser detection
 */
function isHeadlessBrowser(): boolean {
  // Use lazy evaluation - stop checking after first positive
  return isHeadlessPlugins() || isHeadlessLanguages() || isHeadlessWebGL();
}

/**
 * Check if browser supports cookies
 */
export function supportsCookies(): boolean {
  if (typeof document === 'undefined') return true; // Assume support if not in browser
  
  try {
    // Try to set a test cookie
    document.cookie = 'agemin_test=1; path=/';
    const enabled = document.cookie.indexOf('agemin_test=') !== -1;
    
    // Clean up test cookie
    if (enabled) {
      document.cookie = 'agemin_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
    
    return enabled;
  } catch (e) {
    // If cookie check fails, assume support
    return true;
  }
}

/**
 * User agent based bot detection
 */
function isUserAgentBot(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false;
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Comprehensive list of search engine bot patterns
  const searchEnginePatterns = [
    // Google
    'googlebot',
    'adsbot-google',
    'mediapartners-google',
    'google-inspectiontool',
    'googlesecurityscanner',
    
    // Bing/Microsoft
    'bingbot',
    'bingpreview',
    'msnbot',
    'adidxbot',
    
    // Baidu
    'baiduspider',
    'baidu',
    
    // Yandex
    'yandexbot',
    'yandex',
    
    // DuckDuckGo
    'duckduckbot',
    'duckduckgo',
    
    // Yahoo/Verizon
    'slurp',
    
    // Social Media
    'facebookexternalhit',
    'facebookcatalog',
    'twitterbot',
    'linkedinbot',
    'whatsapp',
    'telegrambot',
    'discordbot',
    'slackbot',
    
    // Other Major Crawlers
    'applebot',        // Apple
    'ahrefsbot',       // Ahrefs SEO
    'semrushbot',      // SEMrush SEO
    'dotbot',          // Moz
    'rogerbot',        // Moz
    'seznambot',       // Seznam
    'petalbot',        // Huawei
    'mj12bot',         // Majestic
    'blexbot',         // webmeup
    'serpstatbot',     // Serpstat
    'screaming frog',  // Screaming Frog SEO
    
    // Generic patterns
    'bot',
    'crawler',
    'spider',
    'scraper'
  ];
  
  // Check if user agent contains any of the patterns
  return searchEnginePatterns.some(pattern => userAgent.includes(pattern));
}

// Cache detection results to avoid repeated expensive operations
let cachedDetectionResult: { mode: string; result: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // Cache for 1 minute

/**
 * Check if the current user agent is a search engine bot/crawler
 * Used to allow search engines to bypass age verification for SEO purposes
 * 
 * @param mode - Detection mode: 'ua' | 'headless' | 'cookies' | 'combined' | 'strict'
 */
export function isSearchEngineBot(mode: string = 'ua'): boolean {
  // Check cache first
  if (cachedDetectionResult && 
      cachedDetectionResult.mode === mode &&
      Date.now() - cachedDetectionResult.timestamp < CACHE_DURATION) {
    return cachedDetectionResult.result;
  }
  
  let result = false;
  
  switch (mode) {
    case 'ua':
      // User agent only (fastest, default)
      result = isUserAgentBot();
      break;
      
    case 'headless':
      // Headless browser detection only
      result = isHeadlessBrowser();
      break;
      
    case 'cookies':
      // Cookie support check only (crawlers typically don't support cookies)
      result = !supportsCookies();
      break;
      
    case 'combined':
      // Any detection method triggers (most inclusive)
      result = isUserAgentBot() || isHeadlessBrowser() || !supportsCookies();
      break;
      
    case 'strict':
      // Requires multiple signals (reduces false positives)
      // Must have bot UA AND (headless OR no cookies)
      result = isUserAgentBot() && (isHeadlessBrowser() || !supportsCookies());
      break;
      
    default:
      // Default to UA detection for backward compatibility
      result = isUserAgentBot();
  }
  
  // Cache the result
  cachedDetectionResult = { mode, result, timestamp: Date.now() };
  
  return result;
}