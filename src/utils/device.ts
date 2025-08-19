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
 * Check if the current user agent is a search engine bot/crawler
 * Used to allow search engines to bypass age verification for SEO purposes
 */
export function isSearchEngineBot(): boolean {
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