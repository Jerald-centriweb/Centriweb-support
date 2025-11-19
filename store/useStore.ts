import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState } from '../types';

interface Store extends AppState {}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
      viewedGuides: [],
      markGuideAsViewed: (id) =>
        set((state) => {
          if (state.viewedGuides.includes(id)) return state;
          return { viewedGuides: [id, ...state.viewedGuides].slice(0, 10) };
        }),
    }),
    {
      name: 'centriweb-storage',
      partialize: (state) => ({ viewedGuides: state.viewedGuides }), // Only persist history
    }
  )
);
