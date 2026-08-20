// src/services/authService.js
// API communication service for Master PIN authentication and Privacy Mode

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'https://preparation-os.onrender.com/api';

const IS_DEV =
  (typeof import.meta !== 'undefined' && !!import.meta.env?.DEV) ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

async function authFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: options.signal || AbortSignal.timeout(8000),
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getAuthStatus() {
  return await authFetch('/auth/status');
}

export async function loginWithPin(pin) {
  try {
    return await authFetch('/auth/login', {
      method: 'POST',
      body: { pin }
    });
  } catch (err) {
    // SECURITY: Only allow offline fallback in local development.
    // In production, a server connection is required to authenticate.
    if (IS_DEV && String(pin) === '1234') {
      console.warn('[authService] DEV offline fallback: accepting PIN 1234 without server.');
      return { success: true, token: 'dev-offline-token-1234', ownerName: 'Subham', privacyMode: 'privacy' };
    }
    throw err;
  }
}

export async function setupMasterPin(pin, ownerName = 'Subham', privacyMode = 'privacy') {
  return await authFetch('/auth/setup', {
    method: 'POST',
    body: { pin, ownerName, privacyMode }
  });
}

export async function verifyAuthToken(token) {
  return await authFetch('/auth/verify', {
    method: 'POST',
    body: { token }
  });
}

export async function updateMasterPin(currentPin, newPin) {
  return await authFetch('/auth/update-pin', {
    method: 'POST',
    body: { currentPin, newPin }
  });
}

export async function logoutUser() {
  try {
    await authFetch('/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  }
}

export async function updateAuthSettings({ privacyMode, ownerName }) {
  return await authFetch('/auth/update-settings', {
    method: 'POST',
    body: { privacyMode, ownerName }
  });
}
