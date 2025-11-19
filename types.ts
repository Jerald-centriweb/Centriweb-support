// Navigation & Core
export type NavItem = 'guides' | 'chat' | 'support';

// Guides Module
export interface GuideStep {
  title: string;
  content: string; // Markdown supported
}

export interface Guide {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  timeToRead: string;
  videoUrl?: string; // Loom or YouTube embed
  content: string; // Main body content (Markdown)
  relatedGuideIds?: string[];
}

export interface GuideArea {
  id: string;
  title: string;
  iconName: string; // Lucide icon name
  description: string;
  guides: Guide[];
}

// Chat Module
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  suggestedActions?: {
    type: 'open_guide' | 'navigate';
    payload: string; // ID or Path
    label: string;
  }[];
}

export interface ChatContext {
  currentPath: string;
  userHistory?: string[];
}

// Theme
export type ThemeMode = 'light' | 'dark';

// User Stats & Badges
export interface UserStats {
  guidesRead: number;
  guidesCompleted: number;
  daysActive: number;
  consecutiveDays: number;
  categoriesExplored: Set<string>;
  searchesPerformed: number;
  chatMessagesCount: number;
  ticketsSubmitted: number;
  lastActiveDate: string;
  firstActiveDate: string;
}

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
  seen: boolean;
}

// Global State
export interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  viewedGuides: string[]; // For "Recently Viewed"
  markGuideAsViewed: (id: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;

  // User stats & badges
  userStats: UserStats;
  unlockedBadges: UnlockedBadge[];
  incrementStat: (stat: keyof UserStats, value?: number) => void;
  addCategoryExplored: (categoryId: string) => void;
  checkAndUnlockBadges: () => string[]; // Returns newly unlocked badge IDs
  markBadgeAsSeen: (badgeId: string) => void;
}
