import { Guide, Product } from '../types';
import { apiFetch } from './authService';

/**
 * Content Service — talks to the real portal API (server/index.js), which
 * reads from the portal Postgres `guides`/`products` tables. Guides and
 * products are public content (no auth needed to read them — see
 * migrations/002_product_embed_clickup.sql and the RLS note in
 * server/index.js), so this uses a plain fetch for the read endpoints;
 * apiFetch (bearer token attached) is reserved for ticket submission, where
 * RLS-backed account isolation actually matters.
 *
 * There is no hardcoded guide content anywhere in the front end. Everything
 * rendered here comes from whatever rows exist in the database at request
 * time, so a content sync (Notion or otherwise) or Jerald editing a row
 * directly shows up with no front-end deploy.
 */

interface GuideRow {
  slug: string;
  product_slug: string;
  section: string;
  category: string;
  title: string;
  summary: string;
  minutes: number;
  content_type: 'article' | 'video' | 'mixed';
  video_url: string | null;
  content_format?: 'html' | 'md';
  content?: string;
}

function toGuide(row: GuideRow): Guide {
  return {
    id: row.slug,
    productSlug: row.product_slug,
    section: row.section as Guide['section'],
    category: row.category,
    title: row.title,
    summary: row.summary,
    minutes: row.minutes,
    contentType: row.content_type,
    videoUrl: row.video_url,
    content: row.content,
    contentFormat: row.content_format,
  };
}

/** Converts a YouTube/Vimeo/Loom URL into an embeddable iframe src. Returns
 * null (not the original URL) if the host isn't recognised, so the caller can
 * fall back to a plain link instead of an iframe that will just show an error. */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (u.hostname.includes('loom.com')) {
      return url.replace('/share/', '/embed/');
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const rows = await res.json();
  return rows.map((r: any) => ({ slug: r.slug, name: r.name, description: r.description }));
}

export async function fetchGuides(filter?: { product?: string; section?: string }): Promise<Guide[]> {
  const params = new URLSearchParams();
  if (filter?.product) params.set('product', filter.product);
  if (filter?.section) params.set('section', filter.section);
  const qs = params.toString();
  const res = await fetch(`/api/guides${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`Failed to fetch guides: ${res.status}`);
  const rows: GuideRow[] = await res.json();
  return rows.map(toGuide);
}

export async function fetchGuideBySlug(slug: string): Promise<Guide | null> {
  const res = await fetch(`/api/guides/${slug}`);
  if (!res.ok) return null;
  return toGuide(await res.json());
}

export function searchGuidesLocal(guides: Guide[], query: string): Guide[] {
  const q = query.toLowerCase();
  return guides.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q)
  );
}

// Ticket submission uses the authenticated fetch wrapper (bearer token
// required — RLS scopes it to the caller's own account).
export async function submitTicket(subject: string, body: string): Promise<Response> {
  return apiFetch('/api/tickets', { method: 'POST', body: JSON.stringify({ subject, body, source: 'portal' }) });
}
