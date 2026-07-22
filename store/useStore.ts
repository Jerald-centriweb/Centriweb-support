import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, ThemeMode } from '../types';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('theme-mode');
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      mobileMenuOpen: false,
      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
      viewedGuides: [],
      markGuideAsViewed: (slug) =>
        set((state) => {
          if (state.viewedGuides[0] === slug) return state;
          const rest = state.viewedGuides.filter((id) => id !== slug);
          return { viewedGuides: [slug, ...rest].slice(0, 10) };
        }),
      themeMode: getInitialTheme(),
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(mode);
          localStorage.setItem('theme-mode', mode);
        }
      },
      toggleTheme: () => {
        const currentMode = get().themeMode;
        get().setThemeMode(currentMode === 'dark' ? 'light' : 'dark');
      },

      selectedProduct: null,
      setSelectedProduct: (slug) => set({ selectedProduct: slug }),
    }),
    {
      name: 'centriweb-support-storage',
      partialize: (state) => ({
        viewedGuides: state.viewedGuides,
        themeMode: state.themeMode,
        selectedProduct: state.selectedProduct,
      }),
    }
  )
);
