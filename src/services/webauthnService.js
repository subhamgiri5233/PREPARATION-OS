// src/services/webauthnService.js
// Client-side WebAuthn (Passkeys / Biometric) Authentication Service

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';

const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof process !== 'undefined' && (process.env?.VITE_API_URL || 'http://localhost:5000/api')) ||
  'https://preparation-os.onrender.com/api';

async function authFetch(path, options = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('prepos_auth_token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(3000),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

/**
 * Checks if WebAuthn / Passkeys and Platform Biometrics are supported on this device/browser.
 */
export async function checkBiometricSupport() {
  const supported = browserSupportsWebAuthn();
  if (!supported) return false;
  try {
    const isPlatformAvailable = await platformAuthenticatorIsAvailable();
    return supported && isPlatformAvailable;
  } catch {
    return supported;
  }
}

/**
 * Registers a new Biometric / Passkey credential on the device.
 */
export async function registerPasskeyCredential(deviceName = 'My Device Passkey') {
  // 1. Fetch challenge and registration options from server
  const options = await authFetch('/auth/webauthn/register-options', { method: 'POST' });

  // 2. Invoke browser/device authenticator (Windows Hello, Touch ID, Fingerprint, Android)
  let attResp;
  try {
    attResp = await startRegistration({ optionsJSON: options });
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric registration was cancelled or timed out.');
    }
    throw err;
  }

  // 3. Send cryptographic result to server for verification and storage
  const verificationResp = await authFetch('/auth/webauthn/register-verify', {
    method: 'POST',
    body: { response: attResp, deviceName }
  });

  return verificationResp;
}

/**
 * Authenticates using device Biometric / Passkey (Windows Hello, Fingerprint, Face ID, Android).
 */
export async function authenticateWithPasskey() {
  // 1. Fetch challenge and authentication options from server
  const options = await authFetch('/auth/webauthn/login-options', { method: 'POST' });

  // 2. Invoke browser/device authenticator
  let asseResp;
  try {
    asseResp = await startAuthentication({ optionsJSON: options });
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric login was cancelled or timed out.');
    }
    throw err;
  }

  // 3. Verify assertion on the server
  const verificationResp = await authFetch('/auth/webauthn/login-verify', {
    method: 'POST',
    body: { response: asseResp }
  });

  return verificationResp;
}

/**
 * Lists registered passkeys.
 */
export async function listPasskeys() {
  return await authFetch('/auth/webauthn/credentials');
}

/**
 * Deletes a registered passkey.
 */
export async function deletePasskey(id) {
  return await authFetch(`/auth/webauthn/credentials/${id}`, { method: 'DELETE' });
}
