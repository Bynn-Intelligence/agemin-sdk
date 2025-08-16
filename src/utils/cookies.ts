/**
 * Cookie utility functions for managing age verification cookies
 */

/**
 * Set a cookie with the given name, value, and expiration
 */
export function setCookie(name: string, value: string, expiresSeconds: number | null): void {
  let expires = '';
  
  if (expiresSeconds === null || expiresSeconds === 0) {
    // Session cookie - no expires attribute means it expires when browser closes
    expires = '';
  } else if (expiresSeconds > 0) {
    // Convert seconds to milliseconds and create date
    const date = new Date();
    date.setTime(date.getTime() + (expiresSeconds * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  
  // Get the current domain (without subdomain for broader compatibility)
  const domain = window.location.hostname;
  const domainParts = domain.split('.');
  let cookieDomain = '';
  
  // For localhost or IP addresses, don't set domain
  if (domain === 'localhost' || /^[\d.]+$/.test(domain)) {
    cookieDomain = '';
  } else if (domainParts.length >= 2) {
    // Set cookie for parent domain to work across subdomains
    cookieDomain = '; domain=.' + domainParts.slice(-2).join('.');
  }
  
  // Build cookie string with security flags
  // SameSite=Lax allows the cookie to be sent with top-level navigations
  // which is needed for the redirect flow
  const cookieString = name + '=' + encodeURIComponent(value) + expires + cookieDomain + '; path=/; SameSite=Lax';
  
  // Only add Secure flag if on HTTPS (not localhost)
  if (window.location.protocol === 'https:') {
    document.cookie = cookieString + '; Secure';
  } else {
    document.cookie = cookieString;
  }
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }
  
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string): void {
  // Delete cookie by setting expiration to past date
  setCookie(name, '', -1);
  
  // Also try to delete with current domain and parent domain
  const domain = window.location.hostname;
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + domain + ';';
  
  // Try parent domain as well
  const domainParts = domain.split('.');
  if (domainParts.length >= 2) {
    const parentDomain = '.' + domainParts.slice(-2).join('.');
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + parentDomain + ';';
  }
}

/**
 * Check if cookies are enabled in the browser
 */
export function areCookiesEnabled(): boolean {
  try {
    // Try to set a test cookie
    document.cookie = 'agemin_test=1';
    const cookieEnabled = document.cookie.indexOf('agemin_test') !== -1;
    
    // Clean up test cookie
    if (cookieEnabled) {
      deleteCookie('agemin_test');
    }
    
    return cookieEnabled;
  } catch {
    return false;
  }
}