// src/store/useAuthStore.js
import { create } from 'zustand';
import { getAuthStatus, loginWithPin, verifyAuthToken, setupMasterPin, updateMasterPin, updateAuthSettings } from '../services/authService';

const TOKEN_KEY = 'prepos_auth_token';

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  isConfigured: true,
  privacyMode: 'privacy', // 'privacy' (mask private items) or 'lockdown' (block full screen)
  ownerName: 'Subham',
  showLoginModal: false,
  isChecking: true,

  checkAuth: async () => {
    set({ isChecking: true });
    try {
      const status = await getAuthStatus();
      set({
        isConfigured: status.isConfigured,
        privacyMode: status.privacyMode || 'privacy',
        ownerName: status.ownerName || 'Subham'
      });

      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const verified = await verifyAuthToken(token);
          if (verified && verified.valid) {
            set({ isAuthenticated: true, isChecking: false });
            return;
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      set({ isAuthenticated: false, isChecking: false });
    } catch (err) {
      console.warn('[useAuthStore] checkAuth error:', err);
      set({ isChecking: false });
    }
  },

  login: async (pin) => {
    const res = await loginWithPin(pin);
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      set({
        isAuthenticated: true,
        showLoginModal: false,
        ownerName: res.ownerName || 'Subham',
        privacyMode: res.privacyMode || 'privacy'
      });
      return res;
    }
    throw new Error('Authentication failed');
  },

  setup: async (pin, ownerName, privacyMode) => {
    const res = await setupMasterPin(pin, ownerName, privacyMode);
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      set({
        isAuthenticated: true,
        isConfigured: true,
        showLoginModal: false,
        ownerName: res.ownerName || 'Subham',
        privacyMode: res.privacyMode || 'privacy'
      });
      return res;
    }
    throw new Error('Setup failed');
  },

  lock: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ isAuthenticated: false });
  },

  toggleEditMode: () => {
    const { isAuthenticated } = get();
    if (isAuthenticated) {
      localStorage.removeItem(TOKEN_KEY);
      set({ isAuthenticated: false });
    } else {
      set({ showLoginModal: true });
    }
  },

  openLoginModal: () => set({ showLoginModal: true }),
  closeLoginModal: () => set({ showLoginModal: false }),
}));
