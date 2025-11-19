import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, ThemeMode } from '../types';

interface Store extends AppState {}

// Get initial theme from localStorage or system preference
const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark';

  const stored = localStorage.getItem('theme-mode');
  if (stored === 'light' || stored === 'dark') return stored;

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
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
        const newMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark';
        get().setThemeMode(newMode);
      },
    }),
    {
      name: 'centriweb-storage',
      partialize: (state) => ({
        viewedGuides: state.viewedGuides,
        themeMode: state.themeMode
      }),
    }
  )
);
