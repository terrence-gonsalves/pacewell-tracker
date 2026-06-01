/**
 * Fetch wrapper that automatically refreshes expired tokens
 * Use this instead of regular fetch for all API calls
 */

import { getValidAccessToken } from './token-utils';

interface FetchOptions extends RequestInit {
    skipAuth?: boolean;
}

/**
 * Fetch with automatic token refresh and authorization header
 */
export async function fetchWithAuth(
    url: string,
    options: FetchOptions = {}
) {
    const { skipAuth = false, ...fetchOptions } = options;

    // get valid access token (refreshes if necessary)
    let token: string | null = null;

    if (!skipAuth) {
        token = await getValidAccessToken();

        if (!token) {
            throw new Error(
                'Authentication failed: No valid token. Please log in again.'
            );
        }
    }

    // set up headers
    const headers = new Headers(fetchOptions.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // make the fetch call
    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    });

    // if 401 Unauthorized, token might have been invalid despite refresh
    if (response.status === 401) {

        // clear stored tokens and redirect to login
        localStorage.removeItem('pacewell_token');
        localStorage.removeItem('pacewell_refresh_token');
        localStorage.removeItem('pacewell_user');

        // redirect to login page
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }

        throw new Error('Session expired. Please log in again.');
    }

    return response;
}