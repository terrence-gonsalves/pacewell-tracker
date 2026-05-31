/**
 * Token Management Utilities
 * Handles JWT token expiration checks and refresh
 */

interface TokenPayload {
    exp: number;
    [key: string]: any;
}
  
/**
 * Decode JWT token to check expiration
 */
export function decodeToken(token: string): TokenPayload | null {
    try {
        const parts = token.split('.');

        if (parts.length !== 3) return null;

        const decoded = JSON.parse(atob(parts[1]));

        return decoded;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}
  
/**
 * Check if token is expired (with 5 minute buffer)
 */
export function isTokenExpired(token: string): boolean {
    const decoded = decodeToken(token);

    if (!decoded || !decoded.exp) return true;
  
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 5 * 60; // 5 minute buffer
  
    return decoded.exp - bufferTime < now;
}
  
/**
 * Get a fresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
  
        if (!response.ok) {
            console.error('Failed to refresh token:', response.statusText);
            return null;
        }
  
        const data = await response.json();
        const newAccessToken = data.access_token || data.token;
  
        if (newAccessToken) {
            localStorage.setItem('pacewell_token', newAccessToken);
            return newAccessToken;
        }
    
        return null;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return null;
    }
}
  
/**
 * Get valid access token, refreshing if necessary
 * Returns null if token is invalid and cannot be refreshed
 */
export async function getValidAccessToken(): Promise<string | null> {
    const token = localStorage.getItem('pacewell_token');
    const refreshToken = localStorage.getItem('pacewell_refresh_token');
  
    if (!token) {
        console.warn('No access token found');
        return null;
    }
  
    // check if token is expired
    if (!isTokenExpired(token)) {
        return token; // token is still valid
    }
  
    console.log('Access token expired, attempting refresh...');
  
    // try to refresh using refresh token
    if (refreshToken) {
        const newToken = await refreshAccessToken(refreshToken);

        if (newToken) {
            return newToken;
        }
    }
  
    // token is expired and cannot be refreshed
    console.warn('Could not refresh token - user needs to re-login');
    return null;
}
  
/**
 * Ensure Authorization header has a valid token
 * Refreshes if necessary before making API calls
 */
export async function getAuthorizationHeader(): Promise<string | null> {
    const token = await getValidAccessToken();
  
    if (!token) {
      return null;
    }
  
    return `Bearer ${token}`;
}