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
  video_status?: 'ok' | 'unreachable' | null;
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
    videoStatus: row.video_status ?? null,
    content: row.content,
    contentFormat: row.content_format,
  };
}

/** Extracts a Google Drive file id from any reasonable share-link shape:
 * /file/d/ID/view, /file/d/ID/preview, /open?id=ID, a bare /file/d/ID, or a
 * legacy ?id=ID / uc?id=ID link — with or without extra query params
 * (usp=sharing, usp=drivesdk, etc). Returns null if none is found. */
function extractDriveFileId(url: string): string | null {
  const byPath = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (byPath) return byPath[1];
  const byQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return byQuery ? byQuery[1] : null;
}

/** Converts a Google Drive/YouTube/Vimeo/Loom URL into an embeddable iframe
 * src. Returns null (not the original URL) if the host isn't recognised, or a
 * Drive link has no extractable file id, so the caller can fall back to a
 * plain "watch video" link instead of an iframe that will just show an error. */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('drive.google.com') || u.hostname === 'drive.usercontent.google.com') {
      const id = extractDriveFileId(url);
      if (!id) return null;
      // Files shared before Google introduced resourcekey (mid-2021) can 404
      // without it — carry it over from whatever link Jerald pasted, if present.
      const resourceKey = u.searchParams.get('resourcekey');
      return resourceKey
        ? `https://drive.google.com/file/d/${id}/preview?resourcekey=${resourceKey}`
        : `https://drive.google.com/file/d/${id}/preview`;
    }
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

/** Best-effort thumbnail for the Videos view's cards. Returns null when no
 * cheap public thumbnail exists for the host (Loom/Vimeo need an API call we
 * don't make here) — callers should fall back to a plain icon card, and treat
 * the returned URL as "may 404" (an unshared Drive file's thumbnail endpoint
 * fails the same way the embed does; the caller's <img onError> handles it). */
export function getVideoThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : u.searchParams.get('v');
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (u.hostname.includes('drive.google.com')) {
      const id = extractDriveFileId(url);
      return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w400` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** True only when a guide has a video AND it isn't known to be broken. Used
 * consistently by the guide detail view and the Videos list so a Drive link
 * that's failing its server-side sharing check (see server/notion-sync.mjs)
 * never shows a broken embed to a client — the written steps still do. */
export function hasWorkingVideo(guide: Pick<Guide, 'videoUrl' | 'videoStatus'>): boolean {
  return !!guide.videoUrl && guide.videoStatus !== 'unreachable';
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
