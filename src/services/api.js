// src/services/api.js
// Central API configuration and fetch helper for MongoDB backend

// When running in production (e.g. Vercel -> Render), VITE_API_URL is used (e.g., https://my-app.onrender.com/api)
// When running in local development, it defaults to '/api' (proxied by Vite to localhost:3001)
const envApiUrl = import.meta.env.VITE_API_URL || '/api';
export const BASE_URL = envApiUrl.replace(/\/+$/, '');

/**
 * apiFetch — wrapper around fetch with JSON defaults and error handling
 * @param {string} path  - e.g. '/settings'
 * @param {object} opts  - fetch options (method, body, etc.)
 */
export async function apiFetch(path, opts = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${BASE_URL}${cleanPath}`;
  
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (!response.ok) {
    let errMsg = `API Error ${response.status}`;
    try {
      const errData = await response.json();
      errMsg = errData.error || errMsg;
    } catch (_) { /* ignore */ }
    throw new Error(errMsg);
  }

  return response.json();
}
