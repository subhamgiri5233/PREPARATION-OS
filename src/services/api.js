// src/services/api.js
// Central API configuration, in-flight request deduplication, in-memory caching,
// and mutation guard for MongoDB backend.

let envApiUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || (typeof process !== 'undefined' && process.env?.VITE_API_URL);

if (!envApiUrl || envApiUrl.trim() === '') {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    envApiUrl = '/api';
  } else {
    envApiUrl = 'https://preparation-os.onrender.com/api';
  }
}

// Clean and normalize API base URL
envApiUrl = envApiUrl.trim().replace(/\/+$/, '');

if (envApiUrl.startsWith('http')) {
  if (envApiUrl.includes('vercel.app')) {
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
  
  for (const key of Object.keys(copy)) {
    if (copy[key] && typeof copy[key] === 'object') {
      copy[key] = normalizeItem(copy[key]);
    }
  }
  return copy;
}

import { requireEditPermission } from './mutationGuard.js';

// ─── High Performance Cache & In-Flight Request Deduplication ───────────────────
const inFlightRequests = new Map();
const apiCache = new Map();

// Endpoints with custom TTLs (in milliseconds)
const CACHEABLE_PREFIXES = {
  '/settings': 60000,          // 1 min
  '/areas': 60000,             // 1 min
  '/courses': 60000,           // 1 min
  '/subjects': 60000,          // 1 min
  '/chapters': 60000,          // 1 min
  '/topics': 45000,            // 45 sec
  '/resources': 60000,         // 1 min
  '/schedule': 45000,          // 45 sec
  '/dictionary/': 300000,      // 5 min for dictionary lookups
};

/**
 * Checks if a path is eligible for in-memory read caching
 */
function getCacheTTL(cleanPath) {
  for (const [prefix, ttl] of Object.entries(CACHEABLE_PREFIXES)) {
    if (cleanPath === prefix || cleanPath.startsWith(prefix)) {
      return ttl;
    }
  }
  return 0; // Not cached by default
}

/**
 * Invalidates cached API responses matching a prefix or pattern
 */
export function invalidateApiCache(pattern) {
  if (!pattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
}

export function clearApiCache() {
  apiCache.clear();
  inFlightRequests.clear();
}

/**
 * apiFetch — wrapper around fetch with request deduplication, in-memory caching,
 * JSON defaults, error handling, ID normalization, and View Only protection
 */
export async function apiFetch(path, opts = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const method = (opts.method || 'GET').toUpperCase();

  // Guard mutations: POST, PUT, PATCH, DELETE are blocked in View Only Mode
  const isAuthPath = cleanPath.startsWith('/auth') || cleanPath === '/health';
  if (!isAuthPath && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    requireEditPermission(`${method} ${cleanPath}`);
    
    // Invalidate relevant cache on mutation
    const rootSegment = cleanPath.split('/')[1];
    if (rootSegment) {
      invalidateApiCache(`/${rootSegment}`);
    }
  }

  // 1. For GET requests, check in-memory TTL cache
  const cacheTTL = method === 'GET' ? getCacheTTL(cleanPath) : 0;
  if (cacheTTL > 0 && !opts.noCache) {
    const cached = apiCache.get(cleanPath);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return cached.data;
    }
  }

  // 2. In-flight request deduplication for identical GET requests
  if (method === 'GET') {
    if (inFlightRequests.has(cleanPath)) {
      return inFlightRequests.get(cleanPath);
    }
  }

  const url = `${BASE_URL}${cleanPath}`;
  
  const fetchPromise = (async () => {
    try {
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

      const rawData = await response.json();
      const normalizedData = normalizeItem(rawData);

      // Store in memory cache if eligible
      if (cacheTTL > 0) {
        apiCache.set(cleanPath, {
          data: normalizedData,
          timestamp: Date.now()
        });
      }

      return normalizedData;
    } finally {
      if (method === 'GET') {
        inFlightRequests.delete(cleanPath);
      }
    }
  })();

  if (method === 'GET') {
    inFlightRequests.set(cleanPath, fetchPromise);
  }

  return fetchPromise;
}
