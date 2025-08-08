# Agemin SDK

[![npm version](https://img.shields.io/npm/v/@bynn-intelligence/agemin-sdk.svg)](https://www.npmjs.com/package/@bynn-intelligence/agemin-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, type-safe JavaScript/TypeScript SDK for integrating Agemin age verification into your web applications.

## Features

- 🚀 **Easy Integration** - Simple API with automatic initialization support
- 📱 **Cross-Platform** - Works on desktop and mobile browsers
- 🎨 **Customizable** - Theme support (light/dark/auto) and localization
- 🔒 **Secure** - Cross-origin communication with trusted domain validation
- 📦 **Lightweight** - Zero runtime dependencies
- 💪 **TypeScript** - Full TypeScript support with comprehensive type definitions
- 🎯 **Flexible** - Multiple verification modes (modal, popup, redirect)

## Installation

### NPM
```bash
npm install @bynn-intelligence/agemin-sdk
```

### Yarn
```bash
yarn add @bynn-intelligence/agemin-sdk
```

### CDN
```html
<script src="https://unpkg.com/@bynn-intelligence/agemin-sdk/dist/agemin-sdk.umd.js"></script>
```

## Quick Start

### Basic Usage

```javascript
import Agemin from '@bynn-intelligence/agemin-sdk';

// Initialize the SDK
const agemin = new Agemin({
  assetId: 'your-asset-id', // Required: Your Agemin asset ID
  debug: true // Optional: Enable debug logging
});

// Start verification
agemin.verify({
  onSuccess: (result) => {
    console.log('Verification successful:', result);
  },
  onError: (error) => {
    console.error('Verification failed:', error);
  },
  onCancel: () => {
    console.log('User cancelled verification');
  }
});
```

### Auto-Initialization

You can configure the SDK directly in HTML using data attributes:

```html
<script src="https://unpkg.com/@bynn-intelligence/agemin-sdk/dist/agemin-sdk.umd.js"
  data-agemin-asset-id="your-asset-id"
  data-agemin-theme="auto"
  data-agemin-locale="en"
  data-agemin-debug="true">
</script>

<!-- Any button with data-agemin-trigger will automatically start verification -->
<button data-agemin-trigger>Verify My Age</button>
```

## Configuration Options

### SDK Initialization

```typescript
const agemin = new Agemin({
  // Required
  assetId: string;           // Your unique Agemin asset ID
  
  // Optional
  baseUrl?: string;           // Custom verification URL (default: 'https://verify.agemin.com')
  theme?: 'light' | 'dark' | 'auto';  // UI theme (default: 'auto')
  locale?: string;            // Language locale (default: 'en')
  errorUrl?: string;          // URL to redirect on error
  successUrl?: string;        // URL to redirect on success
  cancelUrl?: string;         // URL to redirect on cancellation
  debug?: boolean;            // Enable debug logging (default: false)
});
```

### Verification Options

```typescript
agemin.verify({
  // Display mode
  mode?: 'modal' | 'popup' | 'redirect';  // How to show verification (default: auto-detect)
  
  // Callbacks
  onSuccess?: (result: VerificationResult) => void;
  onError?: (error: VerificationError) => void;
  onCancel?: () => void;
  onClose?: () => void;
  
  // Customization
  theme?: 'light' | 'dark' | 'auto';  // Override default theme
  locale?: string;                     // Override default locale
  metadata?: Record<string, any>;      // Custom metadata to attach
});
```

## API Reference

### Methods

#### `verify(options?: VerifyOptions): string`
Starts the verification process. Returns a unique session ID.

#### `close(): void`
Programmatically closes the verification modal/popup.

#### `isOpen(): boolean`
Checks if a verification session is currently active.

#### `getSession(): Session | null`
Returns the current verification session object.

### Static Methods

#### `Agemin.version: string`
Returns the SDK version.

#### `Agemin.isSupported(): boolean`
Checks if the current browser is supported.

## TypeScript Support

The SDK includes comprehensive TypeScript definitions:

```typescript
import Agemin, { 
  AgeminConfig, 
  VerifyOptions, 
  VerificationResult,
  VerificationError 
} from '@bynn-intelligence/agemin-sdk';

// Full type safety and IntelliSense support
const config: AgeminConfig = {
  assetId: 'your-asset-id',
  theme: 'dark'
};

const agemin = new Agemin(config);
```

## Verification Modes

### Modal (Default on Desktop)
Opens verification in an iframe overlay within the current page.

```javascript
agemin.verify({ mode: 'modal' });
```

### Popup (Default on Mobile)
Opens verification in a new browser window.

```javascript
agemin.verify({ mode: 'popup' });
```

### Redirect
Redirects the entire page to the verification URL.

```javascript
agemin.verify({ mode: 'redirect' });
```

## Event Handling

The SDK provides comprehensive event callbacks:

```javascript
agemin.verify({
  onSuccess: (result) => {
    // Called when verification is successful
    console.log('Session ID:', result.sessionId);
    console.log('Verification token:', result.token);
    console.log('Status:', result.status); // 'verified'
  },
  
  onError: (error) => {
    // Called when verification fails
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  },
  
  onCancel: () => {
    // Called when user cancels verification
    console.log('User cancelled');
  },
  
  onClose: () => {
    // Called when modal/popup is closed
    console.log('Verification window closed');
  }
});
```

## Examples

### React Integration

```jsx
import React, { useEffect, useState } from 'react';
import Agemin from '@bynn-intelligence/agemin-sdk';

function AgeVerification() {
  const [agemin, setAgemin] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  
  useEffect(() => {
    const sdk = new Agemin({
      assetId: process.env.REACT_APP_AGEMIN_ASSET_ID
    });
    setAgemin(sdk);
  }, []);
  
  const handleVerify = () => {
    agemin?.verify({
      onSuccess: (result) => {
        setIsVerified(true);
        // Store verification token
        localStorage.setItem('agemin_token', result.token);
      },
      onError: (error) => {
        alert(`Verification failed: ${error.message}`);
      }
    });
  };
  
  return (
    <div>
      {!isVerified ? (
        <button onClick={handleVerify}>Verify Age</button>
      ) : (
        <p>✅ Age verified!</p>
      )}
    </div>
  );
}
```

### Vue.js Integration

```vue
<template>
  <div>
    <button @click="verifyAge" v-if="!isVerified">
      Verify Age
    </button>
    <p v-else>✅ Age verified!</p>
  </div>
</template>

<script>
import Agemin from '@bynn-intelligence/agemin-sdk';

export default {
  data() {
    return {
      agemin: null,
      isVerified: false
    };
  },
  
  mounted() {
    this.agemin = new Agemin({
      assetId: process.env.VUE_APP_AGEMIN_ASSET_ID
    });
  },
  
  methods: {
    verifyAge() {
      this.agemin.verify({
        onSuccess: (result) => {
          this.isVerified = true;
          localStorage.setItem('agemin_token', result.token);
        },
        onError: (error) => {
          alert(`Verification failed: ${error.message}`);
        }
      });
    }
  }
};
</script>
```

### Custom Metadata

You can attach custom metadata to verification sessions:

```javascript
agemin.verify({
  metadata: {
    source: 'checkout-page',
    productId: 'ABC123',
    userId: 'user-456',
    timestamp: Date.now()
  },
  onSuccess: (result) => {
    // Metadata is included in the verification result
    console.log('Verification completed with metadata');
  }
});
```

## Browser Support

The SDK supports all modern browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android)

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/agemin/agemin-sdk.git
cd agemin-sdk

# Install dependencies
npm install

# Build the SDK
npm run build

# Watch mode for development
npm run dev
```

### Running Examples

```bash
# Build the SDK first
npm run build

# Open an example in your browser
open examples/basic.html
```

## Security

The SDK implements several security measures:

- **Domain Validation**: Only accepts messages from trusted Agemin domains
- **Secure Communication**: Uses postMessage API for cross-origin communication
- **Session Management**: Generates unique session IDs for each verification
- **Input Sanitization**: All inputs are validated and sanitized

## Error Handling

The SDK provides detailed error information:

```javascript
agemin.verify({
  onError: (error) => {
    switch (error.code) {
      case 'POPUP_BLOCKED':
        // Handle popup blocker
        alert('Please allow popups for age verification');
        break;
      
      case 'BROWSER_NOT_SUPPORTED':
        // Handle unsupported browser
        alert('Please use a modern browser');
        break;
      
      case 'NETWORK_ERROR':
        // Handle network issues
        alert('Please check your internet connection');
        break;
      
      default:
        // Handle other errors
        console.error('Verification error:', error);
    }
  }
});
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.agemin.com](https://docs.agemin.com)
- **Issues**: [GitHub Issues](https://github.com/agemin/agemin-sdk/issues)
- **Email**: support@agemin.com

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes in each version.