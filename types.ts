// Navigation & Core
export type NavItem = 'guides' | 'chat' | 'support';

// SOP model: PRODUCT first, then a fixed onboarding-path SECTION, then guides.
// A second product is added purely by inserting a `products` row and tagging
// guides with its slug — nothing in the nav or routing is hardcoded to
// "prebuild" beyond the default selection.
export type GuideSection = 'start_here' | 'day_to_day' | 'money_and_documents' | 'troubleshooting';
export type GuideContentType = 'article' | 'video' | 'mixed';
// Set by the Notion sync's server-side Drive-sharing check (see
// server/notion-sync.mjs) — never computed in the browser, because a
// broken/sign-in-walled iframe is cross-origin and can't report its own
// failure back to JS. null/undefined = no video, or a non-Drive host we
// don't actively probe (YouTube/Loom/Vimeo) and simply trust.
export type GuideVideoStatus = 'ok' | 'unreachable';

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
  videoStatus?: GuideVideoStatus | null;
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
