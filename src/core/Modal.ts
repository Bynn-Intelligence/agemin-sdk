import { 
  createElement, 
  removeElement, 
  addStyles
} from '../utils/dom';
import { 
  MODAL_STYLES,
  MOBILE_MODAL_STYLES, 
  ANIMATIONS,
  SPINNER_STYLES
} from '../utils/constants';
import { isSmallScreen } from '../utils/device';

export class Modal {
  private verificationWindow: HTMLIFrameElement | null = null;
  private escKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private loadingSpinner: HTMLDivElement | null = null;
  
  constructor() {
    this.setupStyles();
  }
  
  private setupStyles(): void {
    addStyles('agemin-styles', ANIMATIONS);
  }
  
  openIframe(url: string, onClose?: () => void): void {
    // Determine if we should use mobile styles (fullscreen)
    const isMobileView = isSmallScreen();
    const styles = isMobileView ? MOBILE_MODAL_STYLES : MODAL_STYLES;
    
    // Create overlay
    const overlay = createElement('div', { id: 'agemin-overlay' }, styles.overlay);
    
    // Create loading spinner
    this.loadingSpinner = createElement('div', { id: 'agemin-spinner-container' }, SPINNER_STYLES.container) as HTMLDivElement;
    const spinner = createElement('div', { id: 'agemin-spinner' }, 
      isMobileView ? SPINNER_STYLES.spinnerMobile : SPINNER_STYLES.spinner);
    this.loadingSpinner.appendChild(spinner);
    
    if (isMobileView) {
      // Mobile: fullscreen mode - overlay is the container
      // Create close button
      const closeBtn = createElement('button', { id: 'agemin-close-btn' }, styles.closeButton) as HTMLButtonElement;
      closeBtn.innerHTML = '✕';
      closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(0, 0, 0, 0.1)';
      closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(0, 0, 0, 0.05)';
      closeBtn.onclick = () => {
        this.close();
        if (onClose) onClose();
      };
      
      // Create iframe (initially hidden)
      const iframe = createElement('iframe', {
        id: 'agemin-iframe',
        src: url,
        allow: 'camera; microphone'
      }, styles.iframe + 'opacity: 0; transition: opacity 0.3s ease-out;') as HTMLIFrameElement;
      
      this.verificationWindow = iframe;
      
      // Append directly to overlay for fullscreen
      overlay.appendChild(iframe);
      overlay.appendChild(this.loadingSpinner); // Add spinner
      overlay.appendChild(closeBtn); // Close button on top
      document.body.appendChild(overlay);
      
      // Prevent body scroll on mobile
      document.body.style.overflow = 'hidden';
    } else {
      // Desktop: modal in center with overlay background
      const modal = createElement('div', { id: 'agemin-modal' }, styles.modal);
      
      // Create close button
      const closeBtn = createElement('button', {}, styles.closeButton) as HTMLButtonElement;
      closeBtn.innerHTML = '✕';
      closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(0, 0, 0, 0.2)';
      closeBtn.onmouseout = () => closeBtn.style.background = 'rgba(0, 0, 0, 0.1)';
      closeBtn.onclick = () => {
        this.close();
        if (onClose) onClose();
      };
      
      // Create iframe (initially hidden)
      const iframe = createElement('iframe', {
        id: 'agemin-iframe',
        src: url,
        allow: 'camera; microphone'
      }, styles.iframe + 'opacity: 0; transition: opacity 0.3s ease-out;') as HTMLIFrameElement;
      
      this.verificationWindow = iframe;
      
      // Assemble modal
      modal.appendChild(closeBtn);
      modal.appendChild(iframe);
      modal.appendChild(this.loadingSpinner); // Add spinner
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
    }
    
    // NO overlay click handler - only close via X button or explicit actions
    // This prevents accidental closures
    
    // Close on escape key (desktop only - mobile users can't press escape)
    if (!isMobileView) {
      this.escKeyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.close();
          if (onClose) onClose();
        }
      };
      document.addEventListener('keydown', this.escKeyHandler);
    }
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
    
    // Restore body scroll (was disabled on mobile)
    document.body.style.overflow = '';
    
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
  
  updateHeight(height: number): void {
    // Skip height updates on mobile since it's always fullscreen
    if (isSmallScreen()) {
      return;
    }
    
    const modal = document.getElementById('agemin-modal');
    if (modal) {
      // Clamp height between min and max
      const minHeight = 400;
      const maxHeight = window.innerHeight * 0.9; // 90vh
      const clampedHeight = Math.min(Math.max(height, minHeight), maxHeight);
      
      // Apply the new height with smooth transition
      modal.style.height = `${clampedHeight}px`;
    }
  }
  
  hideLoading(): void {
    // Hide spinner with fade out
    if (this.loadingSpinner) {
      this.loadingSpinner.style.opacity = '0';
      this.loadingSpinner.style.transition = 'opacity 0.3s ease-out';
      
      // Remove spinner after animation
      setTimeout(() => {
        if (this.loadingSpinner && this.loadingSpinner.parentNode) {
          this.loadingSpinner.parentNode.removeChild(this.loadingSpinner);
          this.loadingSpinner = null;
        }
      }, 300);
    }
    
    // Show iframe with fade in
    const iframe = document.getElementById('agemin-iframe');
    if (iframe) {
      iframe.style.opacity = '1';
    }
  }
}