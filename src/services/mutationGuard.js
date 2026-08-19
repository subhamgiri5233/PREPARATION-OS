// src/services/mutationGuard.js
// Central Mutation & Security Guard for View Only Mode vs Edit Mode

let isEditAuthorized = false; // Default: false (View Only Mode on startup/refresh)
const viewOnlyListeners = new Set();

/**
 * Register a listener for when a mutation is attempted in View Only Mode.
 */
export function onMutationBlocked(callback) {
  viewOnlyListeners.add(callback);
  return () => viewOnlyListeners.delete(callback);
}

/**
 * Check if write operations are permitted.
 */
export function canEdit() {
  return isEditAuthorized;
}

/**
 * Trigger the View Only Mode alert/modal in the UI.
 */
export function triggerViewOnlyNotice(actionContext = 'this operation') {
  for (const listener of viewOnlyListeners) {
    try {
      listener(actionContext);
    } catch (e) {
      console.error('[MutationGuard] Listener error:', e);
    }
  }
}

/**
 * Central Guard: If not in Edit Mode, triggers the View Only popup and throws an Error.
 */
export function requireEditPermission(actionContext = 'edit') {
  if (!isEditAuthorized) {
    triggerViewOnlyNotice(actionContext);
    const err = new Error("You cannot make any changes in View Only Mode. You can only view Subham's work.");
    err.isViewOnlyBlocked = true;
    throw err;
  }
  return true;
}

/**
 * Authorize or deauthorize Edit Mode in memory.
 */
export function setEditModeAuthorized(authorized) {
  isEditAuthorized = !!authorized;
}
