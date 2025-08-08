import { 
  createElement, 
  removeElement, 
  addStyles
} from '../utils/dom';
import { 
  MODAL_STYLES, 
  ANIMATIONS
} from '../utils/constants';

export class Modal {
  private verificationWindow: HTMLIFrameElement | null = null;
  private escKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  
  constructor() {
    this.setupStyles();
  }
  
  private setupStyles(): void {
    addStyles('agemin-styles', ANIMATIONS);
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
    // Remove iframe overlay
    removeElement('agemin-overlay');
    
    // Remove event listener
    if (this.escKeyHandler) {
      document.removeEventListener('keydown', this.escKeyHandler);
      this.escKeyHandler = null;
    }
    
    this.verificationWindow = null;
  }
  
  getWindow(): HTMLIFrameElement | null {
    return this.verificationWindow;
  }
  
  isOpen(): boolean {
    return document.getElementById('agemin-iframe') !== null;
  }
}