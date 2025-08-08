# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2024-01-08

### Changed
- Increased metadata size limit from 50 bytes to 256 bytes
- Updated Asset ID documentation to reference correct location (agemin.com/app/websites)

## [3.0.0] - 2024-01-08

### Breaking Changes
- **Security-First Architecture**: Complete redesign for enhanced security
- Removed `onFail` callback - age verification results are now only available server-side
- `sessionId` is now required in constructor (must be generated server-side)
- `onSuccess` now only indicates completion, not the actual verification result
- Removed Session class and automatic session generation
- Removed popup verification mode

### Added
- Required `sessionId` parameter in constructor for secure session tracking
- Optional `metadata` parameter in constructor (max 256 bytes when stringified)
- Server-side verification requirement using Private Key
- Comprehensive security documentation
- Size validation for sessionId (max 50 bytes) and metadata (max 256 bytes)

### Changed
- Verification results must now be fetched server-side using Private Key
- `VerificationResult` now only contains `sessionId`, `completed`, and `timestamp`
- Updated all examples to demonstrate server-side verification
- Enhanced documentation with security best practices

### Security
- Prevents billing fraud by requiring server-side result verification
- Private keys never exposed in frontend code
- Session IDs must be generated server-side
- Results cannot be tampered with client-side

### Documentation
- Added detailed security architecture explanation
- Added backend implementation examples
- Clear instructions on getting API keys from agemin.com/app/api-keys
- Added mermaid sequence diagram for verification flow

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