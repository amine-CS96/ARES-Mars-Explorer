import { create } from 'zustand'

/**
 * Session-level UI state. Kept intentionally tiny; router location and server caches are owned
 * elsewhere (see docs/ARCHITECTURE.md §4).
 */
interface UiState {
  /** Mobile navigation drawer. */
  navOpen: boolean
  setNavOpen: (open: boolean) => void
  toggleNav: () => void
}

export const useUiStore = create<UiState>()((set) => ({
  navOpen: false,
  setNavOpen: (navOpen) => set({ navOpen }),
  toggleNav: () => set((state) => ({ navOpen: !state.navOpen })),
}))
