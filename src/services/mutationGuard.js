// src/services/mutationGuard.js
// Auth removed — all write operations are always permitted.

let isEditAuthorized = true; // Always true — no password/PIN required

export function onMutationBlocked(callback) {
  // No-op: mutations are never blocked
  return () => {};
}

export function canEdit() {
  return true; // Always allowed
}

export function triggerViewOnlyNotice() {
  // No-op
}

export function requireEditPermission() {
  return true; // Always permitted
}

export function setEditModeAuthorized(authorized) {
  isEditAuthorized = true; // Always keep true regardless of argument
}
