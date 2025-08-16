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