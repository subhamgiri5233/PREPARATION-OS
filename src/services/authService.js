// src/services/authService.js
// API communication service for Master PIN authentication and Privacy Mode

const API_BASE = import.meta.env.VITE_API_URL || 'https://preparation-os.onrender.com/api';

async function authFetch(path, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
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
    console.error(`[AuthService] Error on ${path}:`, err);
    throw err;
  }
}

export async function getAuthStatus() {
  return await authFetch('/auth/status');
}

export async function loginWithPin(pin) {
  return await authFetch('/auth/login', {
    method: 'POST',
    body: { pin }
  });
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

export async function updateAuthSettings({ privacyMode, ownerName }) {
  return await authFetch('/auth/update-settings', {
    method: 'POST',
    body: { privacyMode, ownerName }
  });
}
