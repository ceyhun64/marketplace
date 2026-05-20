/**
 * use-ui.ts
 * Lightweight Zustand store for UI shell state.
 * Keeps drawer + command-menu open/close state out of component trees
 * so any component can trigger them without prop drilling.
 */

import { create } from "zustand";

interface UIState {
  // Cart drawer
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Command menu
  commandOpen: boolean;
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;
}

export const useUI = create<UIState>((set) => ({
  cartOpen: false,
  openCart:   () => set({ cartOpen: true }),
  closeCart:  () => set({ cartOpen: false }),
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),

  commandOpen: false,
  openCommand:   () => set({ commandOpen: true }),
  closeCommand:  () => set({ commandOpen: false }),
  toggleCommand: () => set((s) => ({ commandOpen: !s.commandOpen })),
}));
