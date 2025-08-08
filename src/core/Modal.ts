import { 
  createElement, 
  removeElement, 
  addStyles
} from '../utils/dom';
import { 
  MODAL_STYLES, 
  ANIMATIONS, 
  POPUP_FEATURES 
} from '../utils/constants';

export class Modal {
  private verificationWindow: Window | HTMLIFrameElement | null = null;
  private checkInterval: number | null = null;
  private escKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  
  constructor() {
    this.setupStyles();
  }
  
  private setupStyles(): void {
    addStyles('agemin-styles', ANIMATIONS);
  }
  
  openPopup(url: string, onClose?: () => void): void {
    const { width, height } = POPUP_FEATURES;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const features = `width=${width},height=${height},left=${left},top=${top},resizable=${POPUP_FEATURES.resizable},scrollbars=${POPUP_FEATURES.scrollbars}`;
    
    this.verificationWindow = window.open(url, 'agemin-verification', features);
    
    if (!this.verificationWindow) {
      throw new Error('Popup blocked. Please allow popups for age verification.');
    }
    
    // Monitor popup status
    this.checkInterval = window.setInterval(() => {
      if (this.verificationWindow && (this.verificationWindow as Window).closed) {
        this.cleanup();
        if (onClose) onClose();
      }
    }, 1000);
  }
  
  openIframe(url: string, onClose?: () => void): void {
    // Create overlay
    const overlay = createElement('div', { id: 'agemin-overlay' }, MODAL_STYLES.overlay);
    
    // Create modal container
    const modal = createElement('div', { id: 'agemin-modal' }, MODAL_STYLES.modal);
    
    // Create close button
    const closeBtn = createElement('button', {}, MODAL_STYLES.closeButton) as HTMLButtonElement;
    closeBtn.innerHTML = '✕';
    closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(0, 0, 0, 0.2)';
    closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(0, 0, 0, 0.1)';
    closeBtn.onclick = () => {
      this.close();
      if (onClose) onClose();
    };
    
    // Create iframe
    const iframe = createElement('iframe', {
      id: 'agemin-iframe',
      src: url,
      allow: 'camera; microphone'
    }, MODAL_STYLES.iframe) as HTMLIFrameElement;
    
    this.verificationWindow = iframe;
    
    // Assemble and add to DOM
    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.close();
        if (onClose) onClose();
      }
    };
    
    // Close on escape key
    this.escKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        if (onClose) onClose();
      }
    };
    document.addEventListener('keydown', this.escKeyHandler);
  }
  
  close(): void {
    // Add closing animations
    const overlay = document.getElementById('agemin-overlay');
    const modal = document.getElementById('agemin-modal');
    
    if (overlay && modal) {
      overlay.style.animation = 'agemin-fade-out 0.3s ease-out';
      modal.style.animation = 'agemin-slide-down 0.3s ease-out';
      
      // Remove after animation
      setTimeout(() => {
        this.cleanup();
      }, 300);
    } else {
      this.cleanup();
    }
  }
  
  private cleanup(): void {
    // Close popup if open
    if (this.verificationWindow && typeof (this.verificationWindow as Window).close === 'function') {
      (this.verificationWindow as Window).close();
    }
    
    // Remove iframe overlay
    removeElement('agemin-overlay');
    
    // Clear interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Remove event listener
    if (this.escKeyHandler) {
      document.removeEventListener('keydown', this.escKeyHandler);
      this.escKeyHandler = null;
    }
    
    this.verificationWindow = null;
  }
  
  getWindow(): Window | HTMLIFrameElement | null {
    return this.verificationWindow;
  }
  
  isOpen(): boolean {
    if (this.verificationWindow) {
      if (typeof (this.verificationWindow as Window).closed !== 'undefined') {
        return !(this.verificationWindow as Window).closed;
      }
      return document.getElementById('agemin-iframe') !== null;
    }
    return false;
  }
}