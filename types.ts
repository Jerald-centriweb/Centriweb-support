// Navigation & Core
export type NavItem = 'guides' | 'chat' | 'support';

// SOP model: PRODUCT first, then a fixed onboarding-path SECTION, then guides.
// A second product is added purely by inserting a `products` row and tagging
// guides with its slug — nothing in the nav or routing is hardcoded to
// "prebuild" beyond the default selection.
export type GuideSection = 'start_here' | 'day_to_day' | 'troubleshooting';
export type GuideContentType = 'article' | 'video' | 'mixed';

export interface Product {
  slug: string;
  name: string;
  description?: string;
}

export interface Guide {
  id: string; // slug, used as the route param
  productSlug: string;
  section: GuideSection;
  category: string;
  title: string;
  summary: string;
  minutes: number;
  contentType: GuideContentType;
  videoUrl?: string | null;
  content?: string; // populated on the detail fetch only
  contentFormat?: 'html' | 'md';
}

// Chat Module
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  suggestedActions?: {
    type: 'open_guide' | 'navigate';
    payload: string; // slug or path
    label: string;
  }[];
}

// Theme
export type ThemeMode = 'light' | 'dark';

// Global State
export interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  viewedGuides: string[]; // slugs, most recent first, for "Recently Viewed"
  markGuideAsViewed: (slug: string) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  selectedProduct: string | null; // product slug; null until products load, then defaults to the first
  setSelectedProduct: (slug: string) => void;
}
