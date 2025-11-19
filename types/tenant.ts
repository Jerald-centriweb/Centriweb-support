// Multi-tenant configuration types for CentriWeb Support OS

export type TenantPlan = 'starter' | 'pro' | 'enterprise';

export interface TenantFeatures {
  // CORE (always enabled for all plans)
  guides: true;
  aiChat: true;
  analytics: true;
  voiceInput: true;

  // EXPERIMENTAL (feature-flagged by plan)
  badges?: boolean;
  gamification?: boolean;
  interactiveWalkthroughs?: boolean;
  coBrowsing?: boolean;
  advancedGameification?: boolean;
  whisperVoice?: boolean; // Use Whisper instead of Web Speech API
  customBranding?: boolean; // Advanced logo/color customization
  ghlApiIntegration?: boolean; // Instance-aware features via GHL API
  multiLanguage?: boolean;
}

export interface TenantBranding {
  logo: string; // URL or base64
  primaryColor: string; // Hex color
  secondaryColor?: string;
  fontFamily?: string;
  companyName: string;
  supportEmail: string;
  supportPhone?: string;
}

export interface TenantAISettings {
  tone: 'professional' | 'casual' | 'friendly';
  customInstructions?: string;
  ragEnabled: boolean;
  voiceInputEnabled: boolean;
  voiceTTSEnabled?: boolean; // Text-to-speech responses
}

export interface TenantSupportSettings {
  ticketForm: {
    embedCode: string; // GHL form embed code or iframe src
    webhookUrl?: string; // For custom ticket handling
  };
  integrations?: {
    clickup?: {
      spaceId: string;
      apiKey: string;
    };
    zendesk?: {
      subdomain: string;
      apiToken?: string;
    };
    slack?: {
      webhookUrl: string;
    };
  };
  responseTime?: string; // e.g., "2-4 hours"
  businessHours?: string; // e.g., "Mon-Fri 9am-5pm EST"
}

export interface TenantContentSettings {
  inheritBaseKB: boolean; // Should inherit grey-label KB
  customKBEnabled: boolean; // Can add custom content
  allowOverrides: boolean; // Can override base KB articles
}

export interface TenantAnalytics {
  dashboardEnabled: boolean;
  healthScoringEnabled: boolean;
  exportEnabled: boolean;
  retentionDays: number; // How long to keep analytics data
}

export interface TenantConfig {
  // Identity
  id: string; // UUID
  slug: string; // URL-friendly identifier (e.g., "acme-agency")
  domain: string; // Custom domain (e.g., "support.acmeagency.com")

  // Subscription
  plan: TenantPlan;
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  trialEndsAt?: string; // ISO date

  // Branding
  branding: TenantBranding;

  // Features
  features: TenantFeatures;

  // Settings
  aiSettings: TenantAISettings;
  supportSettings: TenantSupportSettings;
  contentSettings: TenantContentSettings;
  analytics: TenantAnalytics;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Plan-based feature defaults
export const PLAN_FEATURES: Record<TenantPlan, TenantFeatures> = {
  starter: {
    guides: true,
    aiChat: true,
    analytics: true,
    voiceInput: true,
    badges: false,
    gamification: false,
    interactiveWalkthroughs: false,
    coBrowsing: false,
    advancedGameification: false,
    whisperVoice: false,
    customBranding: false,
    ghlApiIntegration: false,
    multiLanguage: false,
  },
  pro: {
    guides: true,
    aiChat: true,
    analytics: true,
    voiceInput: true,
    badges: true,
    gamification: true,
    interactiveWalkthroughs: true,
    coBrowsing: false,
    advancedGameification: false,
    whisperVoice: true,
    customBranding: true,
    ghlApiIntegration: false,
    multiLanguage: false,
  },
  enterprise: {
    guides: true,
    aiChat: true,
    analytics: true,
    voiceInput: true,
    badges: true,
    gamification: true,
    interactiveWalkthroughs: true,
    coBrowsing: true,
    advancedGameification: true,
    whisperVoice: true,
    customBranding: true,
    ghlApiIntegration: true,
    multiLanguage: true,
  },
};

// Default tenant config (for development)
export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  id: 'default',
  slug: 'centriweb',
  domain: 'localhost',
  plan: 'enterprise', // Full features in dev
  status: 'active',
  branding: {
    logo: '',
    primaryColor: '#3b82f6', // centri-500
    companyName: 'CentriWeb',
    supportEmail: 'support@centriweb.com',
  },
  features: PLAN_FEATURES.enterprise,
  aiSettings: {
    tone: 'professional',
    ragEnabled: true,
    voiceInputEnabled: true,
    voiceTTSEnabled: false,
  },
  supportSettings: {
    ticketForm: {
      embedCode: 'https://link.centriweb.com/widget/form/YeI4hfsgWG9C6IosdXTn',
    },
    responseTime: '2-4 hours',
    businessHours: 'Mon-Fri 9am-5pm EST',
  },
  contentSettings: {
    inheritBaseKB: true,
    customKBEnabled: true,
    allowOverrides: true,
  },
  analytics: {
    dashboardEnabled: true,
    healthScoringEnabled: true,
    exportEnabled: true,
    retentionDays: 365,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
