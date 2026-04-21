/**
 * JWT utility functions for decoding and extracting claims
 */

export interface JWTPayload {
  sub?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

/**
 * Decode JWT token and extract payload
 * Note: This only decodes the token, it does NOT verify the signature
 * Signature verification should be done on the backend
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Extract user ID from JWT token
 * The user ID is typically stored in the 'sub' (subject) claim
 */
export const getUserIdFromToken = (token: string): string | null => {
  const payload = decodeJWT(token);
  return payload?.sub || null;
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload?.exp) {
    return false;
  }

  const expirationTime = payload.exp * 1000; // Convert to milliseconds
  return Date.now() >= expirationTime;
};
