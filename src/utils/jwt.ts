/**
 * JWT validation utilities for age verification tokens
 */

import { importSPKI, jwtVerify, decodeJwt } from 'jose';

// RSA Public Key for signature verification
const RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgs4sO1z5s1ZAcrBJJXmB
fZV69hSvXOLdYhLX7U7oYTV20KCW3xXM37m0bsh48Uq3JqrWVVnqNqNQI8U4ka4v
4CR80OSWp2oAF/9ORigz/VCsddZ9X6UCkwl7qkhpW1yRBeuMeGWu7d6C43eOo+k/
GqjDIrj3GI9DXRcVV/+68sBQVYFz8ybSEbkNsMJNoyz+oNU5zJyqB/Yq0A8D5Od8
4M2nFD2pHEFF93tEmBR7VaPpK4+87NQ9u5cDEB49hkxm2F54scRNHwcHWQk/MUy1
RZz0jkprASaj5HfcMXrr/KGdIIRxpJo7Ft4/tN+5YkAWX8Pg13++82uLUz0SsK/E
BQIDAQAB
-----END PUBLIC KEY-----`;

export interface JWTPayload {
  iss: string;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  data: {
    session_token: string;
    age_threshold: number;
    confidence: string;
    verification_status: string;
    is_adult: boolean;
    is_of_age: boolean;
    passed: boolean;
    face_confidence: number;
    domain: string;
  };
}

/**
 * Cache for the imported public key
 */
let publicKeyCache: ReturnType<typeof importSPKI> | null = null;

/**
 * Get the public key for verification
 */
async function getPublicKey() {
  if (!publicKeyCache) {
    publicKeyCache = importSPKI(RSA_PUBLIC_KEY, 'RS256');
  }
  return publicKeyCache;
}

/**
 * Decode a JWT without verification (for payload inspection)
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    return decodeJwt(token) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Validate that the JWT domain matches the current hostname
 * Skips validation for localhost and local IP addresses
 */
function isValidDomain(jwtDomain: string | undefined, currentHostname: string): boolean {
  // If no domain in JWT, fail validation (except for local development)
  if (!jwtDomain) {
    const localHosts = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'];
    const isLocalDev = localHosts.includes(currentHostname) || 
                       /^[\d.]+$/.test(currentHostname) || // IPv4
                       /^[\da-f:]+$/i.test(currentHostname); // IPv6
    return isLocalDev; // Only allow missing domain for local development
  }
  
  // Skip validation for local development environments
  const localHosts = ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'];
  if (localHosts.includes(currentHostname) || 
      /^[\d.]+$/.test(currentHostname) || // IPv4 addresses
      /^[\da-f:]+$/i.test(currentHostname)) { // IPv6 addresses
    return true; // Skip validation for local development
  }
  
  // Normalize domains (remove port if present)
  const normalizedCurrent = currentHostname.split(':')[0].toLowerCase();
  const normalizedJWT = jwtDomain.toLowerCase();
  
  // Exact match
  if (normalizedJWT === normalizedCurrent) {
    return true;
  }
  
  // Subdomain match (e.g., www.example.com matches example.com)
  if (normalizedCurrent.endsWith('.' + normalizedJWT)) {
    return true;
  }
  
  return false;
}

/**
 * Validate a JWT token completely (signature, expiration, and payload)
 */
export async function validateJWT(token: string): Promise<{
  isValid: boolean;
  isOfAge: boolean;
  payload?: JWTPayload;
  error?: string;
}> {
  try {
    // Get the public key
    const publicKey = await getPublicKey();
    
    // Verify the JWT (this checks signature and expiration)
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'agemin.com'
    });
    
    // Cast to our expected payload type
    const typedPayload = payload as unknown as JWTPayload;
    
    // Validate domain matches current hostname
    const currentHostname = window.location.hostname;
    const jwtDomain = typedPayload.data?.domain;
    
    if (!isValidDomain(jwtDomain, currentHostname)) {
      console.error(`JWT domain mismatch - expected ${jwtDomain}, got ${currentHostname}`);
      return {
        isValid: false,
        isOfAge: false,
        error: `JWT domain mismatch - token is for ${jwtDomain} but current domain is ${currentHostname}`
      };
    }
    
    // Check is_of_age in payload
    const isOfAge = typedPayload.data?.is_of_age === true;
    
    return {
      isValid: true,
      isOfAge,
      payload: typedPayload
    };
  } catch (error) {
    // Handle specific jose errors
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorMessage = 'JWT expired';
      } else if (error.message.includes('signature')) {
        errorMessage = 'Invalid signature';
      } else if (error.message.includes('claim')) {
        errorMessage = 'Invalid JWT claims';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { 
      isValid: false, 
      isOfAge: false, 
      error: errorMessage
    };
  }
}