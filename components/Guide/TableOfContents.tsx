import React, { useLayoutEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { List } from 'lucide-react';

interface TOCItem {
  id: string;
  text: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Assigns stable ids to the real, rendered h2/h3 elements inside contentRef
 * AND reads them back, both in the same effect — deliberately not split
 * across two components (one assigning, one reading), which is fragile:
 * relying on "GuideViewer's effect always finishes before mine" is exactly
 * the kind of cross-component effect-ordering assumption that is easy to get
 * wrong and hard to notice, since it can render correctly most of the time
 * and silently show an empty TOC otherwise. A MutationObserver on top means
 * this also keeps working if content streams in or changes after mount
 * (e.g. a slow markdown render), not just once at first paint.
 */
export const TableOfContents: React.FC<{ contentRef: React.RefObject<HTMLElement> }> = ({ contentRef }) => {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const sync = () => {
      const nodes = Array.from(el.querySelectorAll('h2, h3')) as HTMLElement[];
      nodes.forEach((n) => {
        if (!n.id) n.id = slugify(n.textContent || '');
      });
      setHeadings(nodes.map((n) => ({ id: n.id, text: n.textContent || '' })).filter((h) => h.id));
      return nodes;
    };

    const nodes = sync();

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '-96px 0px -70% 0px' }
    );
    nodes.forEach((n) => intersectionObserver.observe(n));

    // Safety net: if content mounts/changes after this effect already ran
    // (e.g. an async render), re-sync instead of staying empty forever.
    const mutationObserver = new MutationObserver(() => sync());
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [contentRef.current]);

  if (headings.length === 0) return null;

  return (
    <div className="hidden xl:block w-56 flex-shrink-0 pl-8">
      <div className="sticky top-24">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-4">
          <List className="w-4 h-4" />
          <span>On this page</span>
        </div>
        <nav className="space-y-1 relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />
          {headings.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveId(h.id);
              }}
              className={cn(
                'block py-1.5 text-sm transition-colors pl-4 border-l-2 -ml-px',
                activeId === h.id
                  ? 'border-centri-500 text-centri-600 dark:text-centri-400 font-medium'
                  : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              )}
            >
              {h.text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};
