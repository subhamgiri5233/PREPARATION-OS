// src/store/useAuthStore.js
// Auth fully removed — always authenticated and in edit mode.
// No passwords, PINs, passkeys, or any credentials required.

import { create } from 'zustand';
import { setEditModeAuthorized } from '../services/mutationGuard.js';

// Immediately grant edit permissions on load
setEditModeAuthorized(true);

export const useAuthStore = create(() => ({
  // Always authenticated
  isAuthenticated: true,
  isAppAuthenticated: true,
  token: 'no-auth',
  isChecking: false,
  isCheckingSession: false,
  isBiometricSupported: false,
  hasPasskeys: false,

  // Always in edit mode
  isEditMode: true,
  isConfigured: true,
  privacyMode: 'public',
  ownerName: 'Subham',
  showPinModal: false,
  pinError: '',

  // No-op functions — all auth calls are bypassed
  checkAuth: () => {},
  loginWithPinFallback: async () => ({ success: true }),
  loginWithPin: async () => ({ success: true }),
  loginWithPasskey: async () => ({ success: true }),
  unlockEditMode: async () => {
    setEditModeAuthorized(true);
    return { success: true };
  },
  login: async () => {
    setEditModeAuthorized(true);
    return { success: true };
  },
  toggleEditMode: () => {
    setEditModeAuthorized(true);
  },
  lock: () => {},
  disableEditMode: () => {},
  requestEditMode: () => {},
  cancelEditMode: () => {},
  openLoginModal: () => {},
  closePinModal: () => {},
  logout: () => {},
  registerPasskey: async () => ({ success: true }),
}));
