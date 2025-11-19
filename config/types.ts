// Multi-tenant configuration types

export interface TenantTheme {
  primary: string;
  primaryHover: string;
  accent: string;
  background: string;
  cardBackground: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
}

export interface TenantBranding {
  appName: string;
  logoUrl?: string;
  logoText: string;
  tagline: string;
  faviconUrl?: string;
}

export interface TenantChatbot {
  enabled: boolean;
  assistantName: string;
  personality: string;
  apiEndpoint?: string;
}

export interface TenantSupport {
  formUrl: string;
  email?: string;
  phone?: string;
  hours?: string;
}

export interface TenantConfig {
  id: string;
  domain: string;
  branding: TenantBranding;
  theme: {
    dark: TenantTheme;
    light: TenantTheme;
  };
  chatbot: TenantChatbot;
  support: TenantSupport;
  features: {
    showGuides: boolean;
    showChat: boolean;
    showSupport: boolean;
    allowThemeToggle: boolean;
  };
  customization: {
    customCSS?: string;
    customJS?: string;
  };
}
