import { TenantConfig } from './types';
import { centriwebConfig } from './tenants/centriweb';
import { defaultConfig } from './tenants/default';

// Tenant registry
const tenants: Record<string, TenantConfig> = {
  'centriweb.com': centriwebConfig,
  'localhost': defaultConfig,
  'default': defaultConfig,
};

/**
 * Get tenant configuration based on hostname
 * Falls back to default config if tenant not found
 */
export function getTenantConfig(hostname?: string): TenantConfig {
  if (!hostname) {
    // Try to get from window location if available
    if (typeof window !== 'undefined') {
      hostname = window.location.hostname;
    } else {
      return defaultConfig;
    }
  }

  // Check for exact match
  if (tenants[hostname]) {
    return tenants[hostname];
  }

  // Check for subdomain match (e.g., app.centriweb.com -> centriweb.com)
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const parentDomain = parts.slice(-2).join('.');
    if (tenants[parentDomain]) {
      return tenants[parentDomain];
    }
  }

  // Return default config
  return defaultConfig;
}

/**
 * Load tenant config synchronously for initial render
 */
export function loadTenantConfig(): TenantConfig {
  return getTenantConfig();
}

// Export types
export * from './types';

// Export individual configs for direct import if needed
export { centriwebConfig, defaultConfig };
