import { TenantConfig } from '../types';

// Default configuration for white-label deployments
export const defaultConfig: TenantConfig = {
  id: 'default',
  domain: 'localhost',
  branding: {
    appName: 'Support Portal',
    logoText: 'SP',
    tagline: 'Help Center',
  },
  theme: {
    dark: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      accent: '#60a5fa',
      background: '#0f172a',
      cardBackground: '#1e293b',
      borderColor: '#334155',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
    },
    light: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      accent: '#60a5fa',
      background: '#ffffff',
      cardBackground: '#f8fafc',
      borderColor: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
    },
  },
  chatbot: {
    enabled: true,
    assistantName: 'AI Assistant',
    personality: 'friendly and knowledgeable',
  },
  support: {
    formUrl: '',
    email: 'support@example.com',
    hours: 'Mon-Fri, 9am-5pm',
  },
  features: {
    showGuides: true,
    showChat: true,
    showSupport: true,
    allowThemeToggle: true,
  },
  customization: {},
};
