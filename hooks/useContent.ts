import { useState, useEffect } from 'react';
import { Guide, Product } from '../types';
import { fetchGuides, fetchProducts } from '../services/contentService';

/**
 * Loads the whole knowledge base once (products + all guides) from the real
 * portal API. No static fallback data — if the API is unreachable this
 * surfaces as a genuine error state, which is the honest thing to show
 * rather than quietly rendering stale placeholder content.
 */
export function useContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [productRows, guideRows] = await Promise.all([fetchProducts(), fetchGuides()]);
        if (cancelled) return;
        setProducts(productRows);
        setGuides(guideRows);
      } catch (err) {
        console.error('[useContent] Error loading content:', err);
        if (!cancelled) setError('Could not load the help centre right now.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, guides, isLoading, error };
}
