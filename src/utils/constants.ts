export const SDK_VERSION = '__VERSION__';

export const DEFAULT_CONFIG = {
  baseUrl: 'https://verify.agemin.com',
  theme: 'auto' as const,
  locale: 'auto',
  debug: false,
  allowSearchEngineBypass: false,
  searchEngineDetection: 'ua' as const
};

export const MODAL_STYLES = {
  overlay: `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999998;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(20px);
    animation: agemin-fade-in 0.3s ease-out;
  `,
  modal: `
    position: relative;
    width: 90%;
    max-width: 500px;
    height: auto;
    min-height: 400px;
    max-height: 90vh;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    z-index: 999999;
    animation: agemin-slide-up 0.3s ease-out;
    transition: height 0.3s ease-out;
  `,
  closeButton: `
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    font-size: 20px;
    cursor: pointer;
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `,
  iframe: `
    width: 100%;
    height: 100%;
    border: none;
  `
};

// Mobile-specific styles (fullscreen)
export const MOBILE_MODAL_STYLES = {
  overlay: `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: white;
    z-index: 999998;
  `,
  modal: `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: white;
    overflow: hidden;
    z-index: 999999;
  `,
  closeButton: `
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    font-size: 20px;
    cursor: pointer;
    z-index: 1000001;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `,
  iframe: `
    width: 100%;
    height: 100%;
    border: none;
  `
};

export const SPINNER_STYLES = {
  container: `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000002;
  `,
  spinner: `
    width: 48px;
    height: 48px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: agemin-spin 1s linear infinite;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  `,
  spinnerMobile: `
    width: 56px;
    height: 56px;
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: agemin-spin 1s linear infinite;
  `
};

export const ANIMATIONS = `
  @keyframes agemin-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes agemin-slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes agemin-fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes agemin-slide-down {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(20px); opacity: 0; }
  }
  @keyframes agemin-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;