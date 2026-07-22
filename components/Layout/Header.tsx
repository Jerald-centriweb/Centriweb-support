import React from 'react';
import { useLocation } from 'react-router-dom';
import { Breadcrumbs } from '../ui/Breadcrumbs';

/**
 * Wayfinding strip for guide detail pages only. Everything that used to live
 * here (search trigger, theme toggle, online pill, mobile hamburger) moved
 * into TopNav.tsx, which is now the single place those global controls live.
 *
 * Home, Chat, Support and the guide section lists are all one tap from the
 * top nav (whose active pill already shows where you are), so a persistent
 * breadcrumb strip on every page would just repeat that. It earns its keep
 * only on an actual guide article — "Guides > Start here > Welcome to
 * PreBuild" — which is a real third level nothing else on the page states.
 * Not sticky: it scrolls away with the article rather than adding a second
 * permanently-fixed bar under TopNav.
 */
export const Header: React.FC = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const isGuideDetail = segments.length >= 3;

  if (!isGuideDetail) return null;

  return (
    <div className="border-b border-slate-200 dark:border-dark-border px-3 sm:px-4 lg:px-6 py-2.5 transition-colors duration-300">
      <Breadcrumbs path={location.pathname} />
    </div>
  );
};
