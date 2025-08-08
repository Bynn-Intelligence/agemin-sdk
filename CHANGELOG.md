# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2024-01-08

### Added
- New `onFail` callback to handle visitors who don't meet age requirements
- Clear distinction between verification failures (underage) and technical errors
- Fallback age gate recommendations for technical errors
- Enhanced error handling documentation and examples

### Changed
- `onError` now specifically handles technical errors (API, network, model errors)
- Updated all examples to demonstrate proper error vs fail handling
- Clarified documentation about when to show fallback age gates

### Removed
- Removed popup verification mode for consistency (modal works on all devices)
- Simplified verification modes to just modal and redirect

## [2.0.1] - 2024-01-08

### Added
- Initial public release of Agemin SDK
- TypeScript-based implementation with full type definitions
- Support for three verification modes: modal, popup, and redirect
- Auto-initialization from HTML data attributes
- Cross-origin secure communication via postMessage API
- Session management with unique session IDs
- Comprehensive event callbacks (onSuccess, onError, onCancel, onClose)
- Theme support (light, dark, auto)
- Localization support
- Custom metadata attachment to verification sessions
- Zero runtime dependencies
- Multiple build outputs (UMD, ESM, CJS)
- Comprehensive documentation and examples
- Browser support detection
- Device-optimized defaults (popup for mobile, modal for desktop)

### Security
- Domain validation for trusted origins
- Secure cross-origin communication
- Input sanitization and validation

### Documentation
- Complete README with API reference
- Three example implementations (basic, advanced, auto-init)
- TypeScript integration examples
- React and Vue.js integration guides