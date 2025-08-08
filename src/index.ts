import { Agemin } from './core/Agemin';
import { Session } from './core/Session';

// Export main class as default
export default Agemin;

// Named exports
export { Agemin, Session };

// Export all types
export * from './types';

// Auto-initialization from script attributes
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const script = document.querySelector('script[data-agemin-asset-id]') as HTMLScriptElement;
    
    if (script) {
      const config = {
        assetId: script.getAttribute('data-agemin-asset-id')!,
        errorUrl: script.getAttribute('data-agemin-error-url') || undefined,
        successUrl: script.getAttribute('data-agemin-success-url') || undefined,
        cancelUrl: script.getAttribute('data-agemin-cancel-url') || undefined,
        theme: script.getAttribute('data-agemin-theme') as any || undefined,
        locale: script.getAttribute('data-agemin-locale') || undefined,
        debug: script.getAttribute('data-agemin-debug') === 'true'
      };
      
      // Remove undefined values
      Object.keys(config).forEach(key => {
        if ((config as any)[key] === undefined) {
          delete (config as any)[key];
        }
      });
      
      // Initialize globally
      (window as any).agemin = new Agemin(config);
      
      // Auto-bind to buttons with data-agemin-trigger
      const triggers = document.querySelectorAll('[data-agemin-trigger]');
      triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          (window as any).agemin.verify();
        });
      });
      
      if (config.debug) {
        console.log('Agemin SDK: Auto-initialized from script attributes');
      }
    }
  });
}

// For UMD build compatibility
if (typeof window !== 'undefined') {
  (window as any).Agemin = Agemin;
}