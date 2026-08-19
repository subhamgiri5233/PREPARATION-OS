import { create } from 'zustand';
import { getAuthStatus, loginWithPin, setupMasterPin, updateMasterPin, updateAuthSettings } from '../services/authService.js';
import { setEditModeAuthorized } from '../services/mutationGuard.js';

export const useAuthStore = create((set, get) => ({
  isEditMode: false, // Default: View Only Mode (zero operations)
  isAuthenticated: false, // Synced with isEditMode
  isConfigured: true,
  privacyMode: 'privacy',
  ownerName: 'Subham',
  showPinModal: false,
  pinError: '',
  isChecking: false,

  checkAuth: async () => {
    // Ensures startup begins strictly in View Only Mode
    setEditModeAuthorized(false);
    set({ isEditMode: false, isAuthenticated: false });
    try {
      const status = await getAuthStatus();
      set({
        isConfigured: status.isConfigured,
        privacyMode: status.privacyMode || 'privacy',
        ownerName: status.ownerName || 'Subham',
      });
    } catch (err) {
      console.warn('[useAuthStore] checkAuth error:', err);
    }
  },

  requestEditMode: () => {
    set({ showPinModal: true, pinError: '' });
  },

  cancelEditMode: () => {
    set({ showPinModal: false, pinError: '' });
  },

  toggleEditMode: () => {
    const { isEditMode } = get();
    if (isEditMode) {
      // Immediately exit Edit Mode to View Only Mode (no PIN required)
      get().disableEditMode();
    } else {
      // Require PIN every time to enter Edit Mode
      get().requestEditMode();
    }
  },

  login: async (pin) => {
    try {
      set({ pinError: '' });
      const res = await loginWithPin(pin);
      if (res && res.success) {
        setEditModeAuthorized(true);
        set({
          isEditMode: true,
          isAuthenticated: true,
          showPinModal: false,
          pinError: '',
          ownerName: res.ownerName || 'Subham',
          privacyMode: res.privacyMode || 'privacy',
        });
        return res;
      }
      throw new Error('Incorrect PIN. Edit Mode remains disabled.');
    } catch (err) {
      setEditModeAuthorized(false);
      set({
        isEditMode: false,
        isAuthenticated: false,
        pinError: 'Incorrect PIN. Edit Mode remains disabled.',
      });
      throw new Error('Incorrect PIN. Edit Mode remains disabled.');
    }
  },

  disableEditMode: () => {
    setEditModeAuthorized(false);
    set({
      isEditMode: false,
      isAuthenticated: false,
      showPinModal: false,
      pinError: '',
    });
  },

  // Aliases for backwards compatibility
  lock: () => get().disableEditMode(),
  openLoginModal: () => get().requestEditMode(),
  closeLoginModal: () => get().cancelEditMode(),
}));
