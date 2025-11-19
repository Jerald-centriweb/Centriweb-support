import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, ThemeMode, UserStats, UnlockedBadge } from '../types';
import { getUnlockedBadges } from '../data/badges';

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

const getInitialUserStats = (): UserStats => ({
  guidesRead: 0,
  guidesCompleted: 0,
  daysActive: 1,
  consecutiveDays: 1,
  categoriesExplored: new Set<string>(),
  searchesPerformed: 0,
  chatMessagesCount: 0,
  ticketsSubmitted: 0,
  lastActiveDate: new Date().toISOString(),
  firstActiveDate: new Date().toISOString(),
});

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
          // Increment guidesRead stat
          const newStats = { ...state.userStats, guidesRead: state.userStats.guidesRead + 1 };
          return {
            viewedGuides: [id, ...state.viewedGuides].slice(0, 10),
            userStats: newStats,
          };
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

      // User stats & badges
      userStats: getInitialUserStats(),
      unlockedBadges: [],

      incrementStat: (stat, value = 1) => {
        set((state) => {
          if (stat === 'categoriesExplored') return state; // Use addCategoryExplored instead
          const newStats = { ...state.userStats };
          if (typeof newStats[stat] === 'number') {
            (newStats[stat] as number) += value;
          }
          return { userStats: newStats };
        });
      },

      addCategoryExplored: (categoryId) => {
        set((state) => {
          const newCategories = new Set(state.userStats.categoriesExplored);
          newCategories.add(categoryId);
          return {
            userStats: { ...state.userStats, categoriesExplored: newCategories },
          };
        });
      },

      checkAndUnlockBadges: () => {
        const state = get();
        const currentUnlockedIds = state.unlockedBadges.map((b) => b.badgeId);

        // Stats for check
        const statsForCheck = {
          ...state.userStats,
          categoriesExplored: state.userStats.categoriesExplored,
        };

        const allEligibleBadges = getUnlockedBadges(statsForCheck);
        const newlyUnlocked: string[] = [];

        allEligibleBadges.forEach((badge) => {
          if (!currentUnlockedIds.includes(badge.id)) {
            newlyUnlocked.push(badge.id);
            const newBadge: UnlockedBadge = {
              badgeId: badge.id,
              unlockedAt: new Date().toISOString(),
              seen: false,
            };
            set((state) => ({
              unlockedBadges: [...state.unlockedBadges, newBadge],
            }));
          }
        });

        return newlyUnlocked;
      },

      markBadgeAsSeen: (badgeId) => {
        set((state) => ({
          unlockedBadges: state.unlockedBadges.map((b) =>
            b.badgeId === badgeId ? { ...b, seen: true } : b
          ),
        }));
      },
    }),
    {
      name: 'centriweb-storage',
      partialize: (state) => ({
        viewedGuides: state.viewedGuides,
        themeMode: state.themeMode,
        userStats: {
          ...state.userStats,
          categoriesExplored: Array.from(state.userStats.categoriesExplored), // Convert Set to Array for storage
        },
        unlockedBadges: state.unlockedBadges,
      }),
      // Rehydrate categoriesExplored as a Set
      onRehydrateStorage: () => (state) => {
        if (state && state.userStats) {
          const categories = (state.userStats.categoriesExplored as unknown) as string[];
          if (Array.isArray(categories)) {
            state.userStats.categoriesExplored = new Set(categories);
          } else {
            state.userStats.categoriesExplored = new Set<string>();
          }
        }
      },
    }
  )
);
