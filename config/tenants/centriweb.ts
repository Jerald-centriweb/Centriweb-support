import { TenantConfig } from '../types';

export const centriwebConfig: TenantConfig = {
  id: 'centriweb',
  domain: 'centriweb.com',
  branding: {
    appName: 'CentriWeb',
    logoText: 'CW',
    tagline: 'Support OS',
  },
  theme: {
    dark: {
      primary: '#0369a1',
      primaryHover: '#0284c7',
      accent: '#38bdf8',
      background: '#0f172a',
      cardBackground: '#1e293b',
      borderColor: '#334155',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
    },
    light: {
      primary: '#0284c7',
      primaryHover: '#0369a1',
      accent: '#38bdf8',
      background: '#ffffff',
      cardBackground: '#f8fafc',
      borderColor: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
    },
  },
  chatbot: {
    enabled: true,
    assistantName: 'CentriWeb AI',
    personality: 'professional and helpful',
  },
  support: {
    formUrl: 'https://link.centriweb.com/widget/form/YeI4hfsgWG9C6IosdXTn',
    email: 'support@centriweb.com',
    hours: 'Mon-Fri, 9am-6pm EST',
  },
  features: {
    showGuides: true,
    showChat: true,
    showSupport: true,
    allowThemeToggle: true,
  },
  customization: {},
};
