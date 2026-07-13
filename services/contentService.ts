import { Guide, GuideArea } from '../types';
import { apiFetch } from './authService';

/**
 * Content Service — talks to the real portal API (server/index.js), which
 * reads from the portal Postgres `guides` table (migrated from the
 * /opt/support-centre static help centre, see server/migrate-content.mjs).
 * This replaces the previous version, which called Vercel-style /api routes
 * that only worked against a project that was never actually deployed.
 */

interface GuideRow {
  slug: string;
  category: string;
  title: string;
  summary: string;
  minutes: number;
  content_format?: 'html' | 'md';
  content?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Getting started': 'Rocket',
  'Working your leads': 'Users',
  'Money and documents': 'FileText',
  Help: 'LifeBuoy',
};

function toGuide(row: GuideRow): Guide {
  return {
    id: row.slug,
    title: row.title,
    summary: row.summary,
    tags: [row.category],
    timeToRead: `${row.minutes} min`,
    content: row.content || '',
  };
}

async function fetchGuideRows(): Promise<GuideRow[]> {
  const res = await apiFetch('/api/guides');
  if (!res.ok) throw new Error(`Failed to fetch guides: ${res.status}`);
  return res.json();
}

export async function fetchAllGuides(): Promise<Guide[]> {
  try {
    const rows = await fetchGuideRows();
    return rows.map(toGuide);
  } catch (error) {
    console.error('[ContentService] Error fetching all guides:', error);
    return [];
  }
}

export async function fetchCategories(): Promise<GuideArea[]> {
  try {
    const rows = await fetchGuideRows();
    const byCategory = new Map<string, GuideRow[]>();
    for (const row of rows) {
      if (!byCategory.has(row.category)) byCategory.set(row.category, []);
      byCategory.get(row.category)!.push(row);
    }
    return Array.from(byCategory.entries()).map(([category, guides]) => ({
      id: category.toLowerCase().replace(/\s+/g, '-'),
      title: category,
      iconName: CATEGORY_ICONS[category] || 'BookOpen',
      description: '',
      guides: guides.map(toGuide),
    }));
  } catch (error) {
    console.error('[ContentService] Error fetching categories:', error);
    return [];
  }
}

export async function fetchGuideBySlug(slug: string): Promise<Guide | null> {
  const res = await apiFetch(`/api/guides/${slug}`);
  if (!res.ok) return null;
  return toGuide(await res.json());
}

export async function searchGuides(query: string): Promise<Guide[]> {
  const allGuides = await fetchAllGuides();
  const lowerQuery = query.toLowerCase();
  return allGuides.filter(
    (guide) =>
      guide.title.toLowerCase().includes(lowerQuery) ||
      guide.summary.toLowerCase().includes(lowerQuery) ||
      guide.content.toLowerCase().includes(lowerQuery)
  );
}

export async function fetchGuideById(guideId: string): Promise<Guide | null> {
  return fetchGuideBySlug(guideId);
}
