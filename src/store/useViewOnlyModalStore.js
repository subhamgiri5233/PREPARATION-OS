// src/store/useViewOnlyModalStore.js
import { create } from 'zustand';
import { onMutationBlocked } from '../services/mutationGuard.js';

export const useViewOnlyModalStore = create((set) => ({
  isOpen: false,
  actionContext: '',
  openModal: (actionContext = '') => set({ isOpen: true, actionContext }),
  closeModal: () => set({ isOpen: false, actionContext: '' }),
}));

// Automatically open the View Only notice whenever a mutation is blocked by mutationGuard
onMutationBlocked((actionContext) => {
  useViewOnlyModalStore.getState().openModal(actionContext);
});
