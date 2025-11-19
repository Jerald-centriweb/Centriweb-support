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
}
