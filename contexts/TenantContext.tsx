import React, { createContext, useContext, useEffect, useState } from 'react';
import { TenantConfig, DEFAULT_TENANT_CONFIG } from '../types/tenant';
import { loadTenantConfig, getTenantContext, TenantContext as TenantContextType } from '../lib/tenant-loader';

interface TenantContextValue {
  config: TenantConfig;
  context: TenantContextType;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TenantConfig>(DEFAULT_TENANT_CONFIG);
  const [context, setContext] = useState<TenantContextType>(getTenantContext());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tenantConfig = await loadTenantConfig();
      setConfig(tenantConfig);

      const tenantContext = getTenantContext();
      setContext(tenantContext);

      console.log('[TenantProvider] Loaded tenant:', tenantConfig.slug);
    } catch (err) {
      console.error('[TenantProvider] Error loading tenant:', err);
      setError(err as Error);
      // Keep using default config on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Apply tenant branding to document
  useEffect(() => {
    if (config.branding.primaryColor) {
      document.documentElement.style.setProperty('--tenant-primary', config.branding.primaryColor);
    }

    if (config.branding.companyName) {
      document.title = `${config.branding.companyName} Support`;
    }
  }, [config]);

  const value: TenantContextValue = {
    config,
    context,
    isLoading,
    error,
    reload: loadConfig,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

/**
 * Hook to access tenant config
 */
export const useTenant = (): TenantContextValue => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};

/**
 * Hook to check if a feature is enabled for current tenant
 */
export const useFeature = (featureName: keyof TenantConfig['features']): boolean => {
  const { config } = useTenant();
  return config.features[featureName] === true;
};

/**
 * Hook to get tenant branding
 */
export const useBranding = () => {
  const { config } = useTenant();
  return config.branding;
};
