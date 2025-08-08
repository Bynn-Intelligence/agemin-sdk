/**
 * Create a DOM element with specified attributes and styles
 */
export function createElement(
  tag: string,
  attributes?: Record<string, string>,
  styles?: string
): HTMLElement {
  const element = document.createElement(tag);
  
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  if (styles) {
    element.style.cssText = styles;
  }
  
  return element;
}

/**
 * Remove an element from the DOM
 */
export function removeElement(elementOrId: HTMLElement | string): void {
  const element = typeof elementOrId === 'string' 
    ? document.getElementById(elementOrId)
    : elementOrId;
    
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Add styles to the document head
 */
export function addStyles(id: string, styles: string): void {
  if (!document.getElementById(id)) {
    const styleElement = createElement('style', { id }) as HTMLStyleElement;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'agemin'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Build URL with query parameters
 */
export function buildUrl(baseUrl: string, params: Record<string, any>): string {
  const url = new URL(baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        url.searchParams.append(key, JSON.stringify(value));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  });
  
  return url.toString();
}

/**
 * Parse message from postMessage event
 */
export function parseMessage(event: MessageEvent): { type: string; data?: any } | null {
  try {
    if (typeof event.data === 'object' && event.data.type) {
      return event.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if origin is trusted
 */
export function isTrustedOrigin(origin: string): boolean {
  const trustedDomains = ['agemin.com', 'verify.agemin.com', 'localhost'];
  return trustedDomains.some(domain => origin.includes(domain));
}