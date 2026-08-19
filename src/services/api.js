// src/services/api.js
// Central API configuration and fetch helper for MongoDB backend

let envApiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || (typeof process !== 'undefined' && process.env?.VITE_API_URL);

if (!envApiUrl || envApiUrl.trim() === '') {
  // If running in development on localhost, use Vite's proxy '/api'
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    envApiUrl = '/api';
  } else {
    // Production default: Render backend API
    envApiUrl = 'https://preparation-os.onrender.com/api';
  }
}

// Clean and normalize API base URL
envApiUrl = envApiUrl.trim().replace(/\/+$/, '');

// If user accidentally passed frontend vercel domain or raw domain without /api
if (envApiUrl.startsWith('http')) {
  if (envApiUrl.includes('vercel.app')) {
    // Accidentally set to Vercel frontend URL -> redirect to live Render API
    envApiUrl = 'https://preparation-os.onrender.com/api';
  } else if (!envApiUrl.endsWith('/api')) {
    envApiUrl = `${envApiUrl}/api`;
  }
}

export const BASE_URL = envApiUrl;

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

import { requireEditPermission } from './mutationGuard.js';

/**
 * apiFetch — wrapper around fetch with JSON defaults, error handling, ID normalization, and View Only protection
 * @param {string} path  - e.g. '/settings'
 * @param {object} opts  - fetch options (method, body, etc.)
 */
export async function apiFetch(path, opts = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const method = (opts.method || 'GET').toUpperCase();

  // Guard mutations: POST, PUT, PATCH, DELETE are blocked in View Only Mode
  // Auth endpoints (status, login, verify, setup) and health checks are exempt so the user can unlock Edit Mode
  const isAuthPath = cleanPath.startsWith('/auth') || cleanPath === '/health';
  if (!isAuthPath && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    requireEditPermission(`${method} ${cleanPath}`);
  }

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
