import { Guide, GuideArea } from '../types';

/**
 * Content Service
 * Handles fetching guides and categories from the API with content inheritance
 */

export interface ContentServiceConfig {
  apiUrl?: string;
  tenantId: string;
}

/**
 * Fetch all guide categories for a tenant
 */
export async function fetchCategories(config: ContentServiceConfig): Promise<GuideArea[]> {
  const apiUrl = config.apiUrl || '';
  const url = `${apiUrl}/api/content/categories?tenantId=${config.tenantId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ContentService] Error fetching categories:', error);
    // Return empty array as fallback
    return [];
  }
}

/**
 * Fetch guides for a specific category
 */
export async function fetchGuidesByCategory(
  config: ContentServiceConfig,
  category: string
): Promise<Guide[]> {
  const apiUrl = config.apiUrl || '';
  const url = `${apiUrl}/api/content/guides?tenantId=${config.tenantId}&category=${category}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch guides: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ContentService] Error fetching guides:', error);
    return [];
  }
}

/**
 * Fetch all guides for a tenant (no category filter)
 */
export async function fetchAllGuides(config: ContentServiceConfig): Promise<Guide[]> {
  const apiUrl = config.apiUrl || '';
  const url = `${apiUrl}/api/content/guides?tenantId=${config.tenantId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch guides: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ContentService] Error fetching all guides:', error);
    return [];
  }
}

/**
 * Search guides by query
 */
export async function searchGuides(
  config: ContentServiceConfig,
  query: string
): Promise<Guide[]> {
  // Fetch all guides and filter client-side (or implement server-side search)
  const allGuides = await fetchAllGuides(config);

  const lowerQuery = query.toLowerCase();

  return allGuides.filter((guide) => {
    return (
      guide.title.toLowerCase().includes(lowerQuery) ||
      guide.summary.toLowerCase().includes(lowerQuery) ||
      guide.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      guide.content.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Get a single guide by ID
 */
export async function fetchGuideById(
  config: ContentServiceConfig,
  guideId: string
): Promise<Guide | null> {
  // Fetch all guides and find the one we need
  const allGuides = await fetchAllGuides(config);
  return allGuides.find((guide) => guide.id === guideId) || null;
}
