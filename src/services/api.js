// src/services/api.js
// Central API configuration and fetch helper for MongoDB backend

const envApiUrl = import.meta.env.VITE_API_URL || '/api';
export const BASE_URL = envApiUrl.replace(/\/+$/, '');

/**
 * Normalizes MongoDB documents so that:
 * 1. `_id` is also available as `id` (string)
 * 2. Foreign keys ending in `Id` are converted to string
 */
function normalizeItem(item) {
  if (!item || typeof item !== 'object') return item;
  if (Array.isArray(item)) return item.map(normalizeItem);

  const copy = { ...item };
  if (copy._id && !copy.id) {
    copy.id = String(copy._id);
  }
  
  // Normalize nested objects
  for (const key of Object.keys(copy)) {
    if (copy[key] && typeof copy[key] === 'object') {
      copy[key] = normalizeItem(copy[key]);
    }
  }
  return copy;
}

/**
 * apiFetch — wrapper around fetch with JSON defaults, error handling, and ID normalization
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

  const data = await response.json();
  return normalizeItem(data);
}
