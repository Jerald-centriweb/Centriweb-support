import { TenantConfig, DEFAULT_TENANT_CONFIG } from '../types/tenant';

/**
 * Tenant Loader - Detects and loads tenant configuration
 *
 * Detection order:
 * 1. Query param ?tenant=slug (dev mode)
 * 2. Subdomain (e.g., acme.supportos.io)
 * 3. Custom domain lookup (e.g., support.acmeagency.com)
 * 4. Fallback to default tenant
 */

interface TenantDetectionResult {
  method: 'query' | 'subdomain' | 'domain' | 'default';
  identifier: string;
}

// Cache tenant config in memory (client-side only)
let cachedTenantConfig: TenantConfig | null = null;
let cachedTenantSlug: string | null = null;

/**
 * Detect which tenant based on URL
 */
export function detectTenant(): TenantDetectionResult {
  if (typeof window === 'undefined') {
    // SSR fallback
    return { method: 'default', identifier: 'centriweb' };
  }

  const url = new URL(window.location.href);
  const hostname = url.hostname;
  const params = url.searchParams;

  // 1. Check query param (dev mode)
  if (params.has('tenant')) {
    const slug = params.get('tenant')!;
    console.log('[TenantLoader] Detected via query param:', slug);
    return { method: 'query', identifier: slug };
  }

  // 2. Check subdomain (e.g., acme.supportos.io)
  // Assuming production domain is supportos.io or centriweb-support.vercel.app
  const productionDomains = ['supportos.io', 'centriweb-support.vercel.app', 'supportos.app'];
  const isProductionDomain = productionDomains.some((domain) => hostname.includes(domain));

  if (isProductionDomain) {
    const subdomain = hostname.split('.')[0];
    if (subdomain && subdomain !== 'www') {
      console.log('[TenantLoader] Detected via subdomain:', subdomain);
      return { method: 'subdomain', identifier: subdomain };
    }
  }

  // 3. Custom domain (need to look up in database)
  if (hostname !== 'localhost' && !isProductionDomain) {
    console.log('[TenantLoader] Detected custom domain:', hostname);
    return { method: 'domain', identifier: hostname };
  }

  // 4. Fallback to default (localhost dev)
  console.log('[TenantLoader] Using default tenant');
  return { method: 'default', identifier: 'centriweb' };
}

/**
 * Load tenant config from API
 */
export async function loadTenantConfig(): Promise<TenantConfig> {
  // Check cache
  const detection = detectTenant();
  const cacheKey = `${detection.method}:${detection.identifier}`;

  if (cachedTenantConfig && cachedTenantSlug === cacheKey) {
    console.log('[TenantLoader] Using cached config');
    return cachedTenantConfig;
  }

  try {
    let config: TenantConfig;

    if (detection.method === 'default') {
      // Use default config for localhost
      config = DEFAULT_TENANT_CONFIG;
    } else if (detection.method === 'domain') {
      // Lookup by domain
      const response = await fetch(`/api/tenants/by-domain?domain=${detection.identifier}`);
      if (!response.ok) {
        throw new Error(`Failed to load tenant by domain: ${response.statusText}`);
      }
      config = await response.json();
    } else {
      // Lookup by slug (query or subdomain)
      const response = await fetch(`/api/tenants/${detection.identifier}/config`);
      if (!response.ok) {
        throw new Error(`Failed to load tenant config: ${response.statusText}`);
      }
      config = await response.json();
    }

    // Cache the config
    cachedTenantConfig = config;
    cachedTenantSlug = cacheKey;

    console.log('[TenantLoader] Loaded config for tenant:', config.slug);
    return config;
  } catch (error) {
    console.error('[TenantLoader] Error loading tenant config:', error);
    console.log('[TenantLoader] Falling back to default config');
    return DEFAULT_TENANT_CONFIG;
  }
}

/**
 * Clear tenant cache (useful for testing)
 */
export function clearTenantCache(): void {
  cachedTenantConfig = null;
  cachedTenantSlug = null;
  console.log('[TenantLoader] Cache cleared');
}

/**
 * Get current tenant slug from cache (if available)
 */
export function getCurrentTenantSlug(): string | null {
  return cachedTenantSlug?.split(':')[1] || null;
}

/**
 * Parse sub-account ID from URL or GHL context
 * GHL embeds often pass location_id in the iframe URL
 */
export function getSubAccountId(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);

  // Check for GHL location_id
  if (params.has('location_id')) {
    return params.get('location_id');
  }

  // Check for our own sub_account param
  if (params.has('sub_account')) {
    return params.get('sub_account');
  }

  // Try to detect from GHL iframe context
  try {
    if (window.parent !== window) {
      // We're in an iframe - try to get location from parent URL
      const parentParams = new URLSearchParams(window.parent.location.search);
      if (parentParams.has('location_id')) {
        return parentParams.get('location_id');
      }
    }
  } catch (e) {
    // Cross-origin restrictions prevent accessing parent URL
    // This is expected in production
  }

  return null;
}

/**
 * Get user ID from GHL context or session
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);

  // Check for GHL user_id
  if (params.has('user_id')) {
    return params.get('user_id');
  }

  // Check for our own user param
  if (params.has('user')) {
    return params.get('user');
  }

  // Fallback to anonymous session ID (stored in localStorage)
  const sessionKey = 'supportos_session_id';
  let sessionId = localStorage.getItem(sessionKey);

  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(sessionKey, sessionId);
  }

  return sessionId;
}

/**
 * Get full tenant context (tenant + sub-account + user)
 */
export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  subAccountId: string | null;
  userId: string | null;
}

export function getTenantContext(): TenantContext {
  const slug = getCurrentTenantSlug() || 'centriweb';
  const tenantId = cachedTenantConfig?.id || 'default';

  return {
    tenantId,
    tenantSlug: slug,
    subAccountId: getSubAccountId(),
    userId: getUserId(),
  };
}
