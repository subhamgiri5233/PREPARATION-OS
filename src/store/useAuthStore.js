import { create } from 'zustand';
import { getAuthStatus, loginWithPin, verifyAuthToken, logoutUser } from '../services/authService.js';
import { authenticateWithPasskey, registerPasskeyCredential, checkBiometricSupport } from '../services/webauthnService.js';
import { setEditModeAuthorized } from '../services/mutationGuard.js';

const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem('prepos_auth_token') : null;
const initialGuest = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('prepos_guest_mode') === 'true' : false;

export const useAuthStore = create((set, get) => ({
  // ── LAYER 1: APP LOGIN AUTHENTICATION ────────────────────────────────
  isAppAuthenticated: !!initialToken,
  isAuthenticated: !!initialToken, // Optimistic instant shell if token exists
  isGuestMode: initialGuest,
  token: initialToken,
  isCheckingSession: !initialToken ? false : true,
  isChecking: !initialToken ? false : true,
  isBiometricSupported: false,
  hasPasskeys: false,

  // ── LAYER 2: EDIT MODE (STRICTLY VIEW ONLY BY DEFAULT) ───────────────
  isEditMode: false, // Default: View Only Mode (zero operations)
  isConfigured: true,
  privacyMode: 'privacy',
  ownerName: 'Subham',
  showPinModal: false, // Edit Mode PIN modal
  pinError: '',

  /**
   * Initializes session and WebAuthn status on application mount (non-blocking fast-path)
   */
  checkAuth: async () => {
    // 1. Ensure Edit Mode ALWAYS starts in View Only
    setEditModeAuthorized(false);
    set({ isEditMode: false });

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('prepos_auth_token') : null;

    // Fast parallel check: verify token & get auth status concurrently
    try {
      const [bioSupported, authStatus, verifyRes] = await Promise.all([
        checkBiometricSupport().catch(() => false),
        getAuthStatus().catch(() => null),
        token ? verifyAuthToken(token).catch(() => ({ valid: false })) : Promise.resolve({ valid: false })
      ]);

      const authValid = token ? !!verifyRes?.valid : false;
      if (token && !authValid) {
        if (typeof localStorage !== 'undefined') localStorage.removeItem('prepos_auth_token');
      }

      set({
        isBiometricSupported: !!bioSupported,
        isAppAuthenticated: authValid,
        isAuthenticated: authValid,
        isCheckingSession: false,
        isChecking: false,
        isConfigured: authStatus ? authStatus.isConfigured : true,
        hasPasskeys: authStatus ? authStatus.hasPasskeys : false,
        privacyMode: authStatus?.privacyMode || 'privacy',
        ownerName: authStatus?.ownerName || 'Subham',
      });
    } catch (err) {
      console.warn('[useAuthStore] checkAuth error:', err.message || err);
      set({
        isCheckingSession: false,
        isChecking: false,
      });
    }
  },

  /**
   * LAYER 1: Login using WebAuthn / Passkey (Biometric)
   */
  loginWithPasskey: async () => {
    try {
      const res = await authenticateWithPasskey();
      if (res && res.verified && res.token) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('prepos_auth_token', res.token);
        }
        setEditModeAuthorized(false);
        set({
          token: res.token,
          isAppAuthenticated: true,
          isAuthenticated: true,
          isEditMode: false,
          ownerName: res.ownerName || 'Subham',
          pinError: ''
        });
        return { success: true };
      }
      throw new Error(res?.error || 'Biometric authentication failed');
    } catch (err) {
      throw err;
    }
  },

  /**
   * LAYER 1: Login using PIN (Application Access / View-Only)
   */
  loginWithPinFallback: async (pin) => {
    try {
      const res = await loginWithPin(pin);
      if (res && res.token) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('prepos_auth_token', res.token);
        }
        setEditModeAuthorized(false);
        set({
          token: res.token,
          isAppAuthenticated: true,
          isAuthenticated: true,
          isEditMode: false,
          ownerName: res.ownerName || 'Subham',
          pinError: ''
        });
        return { success: true };
      }
      throw new Error(res?.error || 'Invalid PIN. Please try again.');
    } catch (err) {
      throw err;
    }
  },

  loginWithPin: async (pin) => {
    return get().loginWithPinFallback(pin);
  },

  /**
   * LAYER 2: Unlock Edit Mode using Master PIN
   */
  unlockEditMode: async (pin) => {
    try {
      const res = await loginWithPin(pin);
      if (res && res.token) {
        setEditModeAuthorized(true);
        set({
          isEditMode: true,
          showPinModal: false,
          pinError: ''
        });
        return { success: true };
      }
      set({ pinError: 'Invalid PIN' });
      throw new Error('Invalid PIN');
    } catch (err) {
      const msg = err.message || 'Verification failed';
      set({ pinError: msg });
      throw err;
    }
  },

  login: async (pin) => {
    return get().unlockEditMode(pin);
  },

  /**
   * LAYER 2: Lock back to View Only Mode
   */
  lock: () => {
    setEditModeAuthorized(false);
    set({ isEditMode: false, showPinModal: false, pinError: '' });
  },

  disableEditMode: () => {
    setEditModeAuthorized(false);
    set({ isEditMode: false, showPinModal: false, pinError: '' });
  },

  requestEditMode: () => set({ showPinModal: true, pinError: '' }),
  cancelEditMode: () => set({ showPinModal: false, pinError: '' }),

  toggleEditMode: () => {
    const { isEditMode } = get();
    if (isEditMode) {
      setEditModeAuthorized(false);
      set({ isEditMode: false, showPinModal: false });
    } else {
      set({ showPinModal: true, pinError: '' });
    }
  },

  openLoginModal: () => set({ showPinModal: true, pinError: '' }),
  closePinModal: () => set({ showPinModal: false, pinError: '' }),

  enterGuestMode: () => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('prepos_guest_mode', 'true');
    }
    setEditModeAuthorized(false);
    set({ isGuestMode: true, isEditMode: false });
  },

  /**
   * Full App Logout
   */
  logout: async () => {
    try {
      await logoutUser();
    } catch (_) {}
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('prepos_auth_token');
    }
    setEditModeAuthorized(false);
    set({
      token: null,
      isAppAuthenticated: false,
      isAuthenticated: false,
      isEditMode: false,
      showPinModal: false,
      pinError: ''
    });
  },

  registerPasskey: async () => {
    try {
      const res = await registerPasskeyCredential();
      if (res && res.verified) {
        set({ hasPasskeys: true });
        return { success: true };
      }
      throw new Error(res?.error || 'Registration could not be completed');
    } catch (err) {
      throw err;
    }
  }
}));
