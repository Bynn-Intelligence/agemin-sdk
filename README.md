# Agemin SDK

[![npm version](https://img.shields.io/npm/v/@bynn-intelligence/agemin-sdk.svg)](https://www.npmjs.com/package/@bynn-intelligence/agemin-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, type-safe JavaScript/TypeScript SDK for integrating Agemin age verification into your web applications.

> **📝 Prerequisites**: You need a free account on [agemin.com](https://agemin.com) to use this SDK. Sign up to get your Asset ID and start verifying ages in minutes.

## Features

- 🚀 **Easy Integration** - Simple API with automatic initialization support
- 📱 **Cross-Platform** - Works on desktop and mobile browsers
- 🎨 **Customizable** - Theme support (light/dark/auto) and localization
- 🔒 **Secure** - Cross-origin communication with trusted domain validation
- 📦 **Lightweight** - Zero runtime dependencies
- 💪 **TypeScript** - Full TypeScript support with comprehensive type definitions
- 🎯 **Flexible** - Multiple verification modes (modal, popup, redirect)

## Getting Started

1. **Sign up for a free account** at [agemin.com](https://agemin.com)
2. **Create an asset** in your dashboard to get your Asset ID
3. **Install the SDK** using your preferred package manager
4. **Initialize with your Asset ID** and start verifying!

## Installation

### NPM
```bash
npm install @bynn-intelligence/agemin-sdk
```

### Yarn
```bash
yarn add @bynn-intelligence/agemin-sdk
```

### pnpm
```bash
pnpm add @bynn-intelligence/agemin-sdk
```

### CDN
```html
<!-- Latest version -->
<script src="https://unpkg.com/@bynn-intelligence/agemin-sdk/dist/agemin-sdk.umd.js"></script>

<!-- Specific version -->
<script src="https://unpkg.com/@bynn-intelligence/agemin-sdk@2.0.1/dist/agemin-sdk.umd.js"></script>

<!-- Minified version -->
<script src="https://unpkg.com/@bynn-intelligence/agemin-sdk/dist/agemin-sdk.min.js"></script>
```

## Quick Start

### Basic Usage

```javascript
import Agemin from '@bynn-intelligence/agemin-sdk';

// Initialize the SDK with your Asset ID from agemin.com
const agemin = new Agemin({
  assetId: 'your-asset-id', // Required: Get this from your Agemin dashboard
  debug: true // Optional: Enable debug logging
});

// Start verification
agemin.verify({
  onSuccess: (result) => {
    console.log('Age verified - visitor meets requirement:', result);
  },
  onFail: (result) => {
    console.log('Visitor does not meet age requirement:', result);
  },
  onError: (error) => {
    // Technical error - show fallback age confirmation
    console.error('Technical error occurred:', error);
    showFallbackAgeModal(); // Your backup age gate
  },
  onCancel: () => {
    console.log('User cancelled verification');
  }
});
```

### Auto-Initialization

You can configure the SDK directly in HTML using data attributes:

```html
<script src="https://unpkg.com/@bynn-intelligence/agemin-sdk/dist/agemin-sdk.min.js"
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
  mode?: 'modal' | 'redirect';  // How to show verification (default: modal)
  
  // Callbacks
  onSuccess?: (result: VerificationResult) => void;  // Visitor meets age requirement
  onFail?: (result: VerificationResult) => void;     // Visitor doesn't meet age requirement
  onError?: (error: VerificationError) => void;      // Technical error (API, network, etc.)
  onCancel?: () => void;                            // User cancelled verification
  onClose?: () => void;                             // Modal/popup closed
  
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

### Modal (Default)
Opens verification in an iframe overlay within the current page. Works seamlessly on both desktop and mobile devices.

```javascript
agemin.verify({ mode: 'modal' });
```

### Redirect
Redirects the entire page to the verification URL. Useful for single-page flows or when iframe is not suitable.

```javascript
agemin.verify({ mode: 'redirect' });
```

## Event Handling

The SDK provides comprehensive event callbacks for different scenarios:

```javascript
agemin.verify({
  onSuccess: (result) => {
    // Visitor successfully verified AND meets age requirement
    console.log('Session ID:', result.sessionId);
    console.log('Verification token:', result.token);
    console.log('Status:', result.status); // 'verified'
    // Allow access to age-restricted content
  },
  
  onFail: (result) => {
    // Visitor completed verification but doesn't meet age requirement
    console.log('Status:', result.status); // 'underage'
    // Redirect to age-appropriate content or show restriction message
  },
  
  onError: (error) => {
    // Technical error occurred (API, network, model error, etc.)
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // IMPORTANT: Show fallback age confirmation to avoid losing visitors
    // Example: Display a simple "Are you 18+" modal as backup
    showBackupAgeGate();
  },
  
  onCancel: () => {
    // User explicitly cancelled the verification process
    console.log('User cancelled');
  },
  
  onClose: () => {
    // Modal/popup was closed (fired after other callbacks)
    console.log('Verification window closed');
  }
});
```

### Important: Handling Technical Errors

When `onError` is triggered (technical issues), we strongly recommend showing a fallback age confirmation modal to ensure you don't lose potential visitors due to temporary technical issues:

```javascript
function showBackupAgeGate() {
  // Simple fallback when Agemin verification has technical issues
  const confirmed = confirm('Please confirm you are 18 or older to continue');
  if (confirmed) {
    // Allow access with degraded verification
    allowAccess();
  } else {
    // Redirect to age-appropriate content
    window.location.href = '/underage';
  }
}
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
      onFail: (result) => {
        // Visitor is underage
        alert('You must be 18 or older to access this content');
        window.location.href = '/age-restricted';
      },
      onError: (error) => {
        // Technical error - show fallback
        if (confirm('Please confirm you are 18 or older')) {
          setIsVerified(true);
        }
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
git clone https://github.com/Bynn-Intelligence/agemin-sdk.git
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

The SDK distinguishes between verification failures and technical errors:

### Verification Results

```javascript
agemin.verify({
  onSuccess: (result) => {
    // result.status === 'verified'
    // Visitor meets age requirement - grant access
  },
  
  onFail: (result) => {
    // result.status === 'underage'
    // Visitor doesn't meet age requirement - restrict access
  }
});
```

### Technical Errors

Technical errors trigger `onError` and should be handled with a fallback:

```javascript
agemin.verify({
  onError: (error) => {
    // Log the technical error for debugging
    console.error('Technical error:', error.code, error.message);
    
    // Show fallback age gate to avoid losing visitors
    switch (error.code) {
      case 'POPUP_BLOCKED':
        alert('Please allow popups for age verification');
        showSimpleAgeGate();
        break;
      
      case 'NETWORK_ERROR':
      case 'API_ERROR':
      case 'MODEL_ERROR':
        // Don't lose the visitor - show backup age confirmation
        showSimpleAgeGate();
        break;
      
      default:
        showSimpleAgeGate();
    }
  }
});

function showSimpleAgeGate() {
  // Fallback for when Agemin verification has technical issues
  const isAdult = confirm('Are you 18 years or older?');
  if (isAdult) {
    // Grant degraded access
    grantAccess(/* limited = */ true);
  } else {
    redirectToAgeAppropriate();
  }
}
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [https://docs.agemin.com](https://docs.agemin.com)
- **Issues**: [GitHub Issues](https://github.com/Bynn-Intelligence/agemin-sdk/issues)
- **npm Package**: [https://www.npmjs.com/package/@bynn-intelligence/agemin-sdk](https://www.npmjs.com/package/@bynn-intelligence/agemin-sdk)
- **Email**: support@agemin.com

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes in each version.