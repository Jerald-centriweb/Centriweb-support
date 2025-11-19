import { useState, useEffect } from 'react';
import { Guide, GuideArea } from '../types';
import { fetchCategories, fetchAllGuides } from '../services/contentService';
import { useTenant } from '../contexts/TenantContext';
import { GUIDE_DATA } from '../data/guides'; // Fallback to static data

/**
 * Hook to fetch and manage content with tenant context
 * Falls back to static GUIDE_DATA if API fails (for development)
 */
export function useContent() {
  const { config, context } = useTenant();
  const [categories, setCategories] = useState<GuideArea[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    async function loadContent() {
      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch from API
        const [fetchedCategories, fetchedGuides] = await Promise.all([
          fetchCategories({ tenantId: context.tenantId }),
          fetchAllGuides({ tenantId: context.tenantId }),
        ]);

        if (fetchedCategories.length === 0 && fetchedGuides.length === 0) {
          // No content from API - use static fallback
          console.warn('[useContent] No content from API, using static fallback');
          setCategories(GUIDE_DATA);
          setUseFallback(true);
        } else {
          setCategories(fetchedCategories);
          setGuides(fetchedGuides);
          setUseFallback(false);
        }
      } catch (err) {
        console.error('[useContent] Error loading content:', err);
        setError('Failed to load content');
        // Use static fallback on error
        setCategories(GUIDE_DATA);
        setUseFallback(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (context.tenantId) {
      loadContent();
    }
  }, [context.tenantId]);

  return {
    categories,
    guides,
    isLoading,
    error,
    useFallback,
  };
}

/**
 * Hook to fetch a single guide by ID
 */
export function useGuide(guideId: string) {
  const { guides, isLoading } = useContent();
  const [guide, setGuide] = useState<Guide | null>(null);

  useEffect(() => {
    if (!isLoading && guides.length > 0) {
      const found = guides.find((g) => g.id === guideId);
      setGuide(found || null);
    }
  }, [guideId, guides, isLoading]);

  return { guide, isLoading };
}
