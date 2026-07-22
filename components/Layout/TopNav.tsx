import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useContent } from '../../hooks/useContent';
import { ThemeToggle } from '../ui/ThemeToggle';
import {
  Home,
  Rocket,
  BookOpen,
  Video,
  Wrench,
  Receipt,
  MessageSquare,
  LifeBuoy,
  ChevronDown,
  Search,
  Menu,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Top navigation bar — replaces the old left Sidebar. This portal is embedded
 * via iframe inside a builder's own dashboard, which already has its own left
 * sidebar; a second one wasted horizontal space and doubled up on chrome. A
 * full-width bar uses that width properly instead of leaving a permanent
 * 256px/80px gutter down the left.
 *
 * Two rows, not one: brand + get-help + the utility cluster (search/theme/
 * online) measure out to roughly 700px even with every label showing, so
 * they happily share a single row at any desktop width. The six primary nav
 * labels are fixed by the product and two of them are long ("Day-to-day
 * guides", "Money and documents") — with icon+label for all six that row
 * alone needs ~825px, and cramming brand+nav+help+utility into ONE row does
 * not fit below roughly 1550px wide (measured, not guessed — it silently
 * overflowed off-screen in testing). Giving the nav its own row means every
 * label stays fully visible from `lg` (1024px) up, which is what the
 * six-item nav is actually for, instead of shortening copy or hiding labels
 * at ordinary desktop widths to force a single-row layout that only really
 * works past ~1550px.
 *
 * Below `lg`, both rows collapse to one compact row (brand + search + theme
 * + a single "Menu" button) that opens the MobileNav drawer with every
 * primary and help item inside it.
 */

const PRIMARY_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/guides/start_here', label: 'Start here', icon: Rocket },
  { to: '/guides/day_to_day', label: 'Day-to-day guides', icon: BookOpen },
  { to: '/guides/money_and_documents', label: 'Money and documents', icon: Receipt },
  { to: '/guides/videos', label: 'Videos', icon: Video },
  { to: '/guides/troubleshooting', label: 'Troubleshooting', icon: Wrench },
] as const;

const NavItem: React.FC<{ to: string; label: string; icon: any; end?: boolean }> = ({ to, label, icon: Icon, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
        isActive
          ? 'bg-centri-600 text-white shadow-md shadow-centri-900/20 dark:shadow-centri-900/40'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
      )
    }
  >
    <Icon className="w-4 h-4 flex-shrink-0" />
    <span>{label}</span>
  </NavLink>
);

/** Same brand treatment the old sidebar header used: the solid-blue mark
 * (transparent background, sits on either theme) plus "PreBuild" set in the
 * app's own font rather than the wordmark PNG, whose baked-in "RE" only reads
 * on a dark chip. */
const Brand: React.FC = () => {
  const { products } = useContent();
  const { selectedProduct, setSelectedProduct } = useStore();

  return (
    <div className="relative group flex-shrink-0">
      {products.length > 1 ? (
        <button className="flex items-center gap-2.5 text-left">
          <img src="/prebuild-mark.png" alt="" className="h-8 w-8 object-contain flex-shrink-0" />
          <span className="min-w-0 hidden sm:inline-block">
            <span className="block text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">PreBuild</span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">Help Centre</span>
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 hidden sm:block" />
        </button>
      ) : (
        <div className="flex items-center gap-2.5">
          <img src="/prebuild-mark.png" alt="PreBuild" className="h-8 w-8 object-contain flex-shrink-0" />
          <span className="min-w-0 hidden sm:inline-block">
            <span className="block text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">PreBuild</span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">Help Centre</span>
          </span>
        </div>
      )}
      {products.length > 1 && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
          {products.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSelectedProduct(p.slug)}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800',
                p.slug === selectedProduct && 'text-centri-600 dark:text-centri-400 font-medium'
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SearchTrigger: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { setSearchOpen } = useStore();
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (compact) {
    return (
      <button
        onClick={() => setSearchOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        aria-label="Search guides and actions"
      >
        <Search className="w-4.5 h-4.5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setSearchOpen(true)}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      title={`Search guides and actions (${isMac ? 'Cmd+K' : 'Ctrl+K'})`}
    >
      <Search className="w-3.5 h-3.5" />
      <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-400">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </button>
  );
};

export const TopNav: React.FC = () => {
  const { toggleMobileMenu } = useStore();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md transition-colors duration-300">
      {/* Row 1: brand, far left; get-help + utility, far right. Always one
          row regardless of viewport — this half of the bar is short enough
          (~700px fully labeled) to never need to collapse on its own. */}
      <div className="h-16 flex items-center gap-2 px-3 sm:px-4 lg:px-6 border-b border-slate-200 dark:border-dark-border">
        <Brand />

        {/* Get-help + utility groups, desktop only — pushed to the far
            right. Below lg these give way entirely to the compact cluster,
            which opens the MobileNav drawer instead. */}
        <div className="hidden lg:flex items-center gap-1 ml-auto">
          <div className="flex items-center gap-1 pl-3 border-l border-slate-200 dark:border-white/10">
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'text-centri-600 dark:text-centri-400 bg-centri-50 dark:bg-centri-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                )
              }
              title="Ask a question"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span>Ask a question</span>
            </NavLink>
            <NavLink
              to="/support"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shadow-sm',
                  isActive ? 'bg-centri-700 text-white' : 'bg-centri-600 text-white hover:bg-centri-500 shadow-centri-900/20'
                )
              }
              title="Raise a ticket"
            >
              <LifeBuoy className="w-4 h-4 flex-shrink-0" />
              <span>Raise a ticket</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-white/10">
            <SearchTrigger />
            <ThemeToggle />
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-500">Online</span>
            </div>
          </div>
        </div>

        {/* Compact cluster — below lg. Brand + search + theme + a single
            Menu button that opens the full-screen drawer (MobileNav.tsx). */}
        <div className="flex lg:hidden items-center gap-1 ml-auto">
          <SearchTrigger compact />
          <ThemeToggle />
          <button
            onClick={toggleMobileMenu}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Row 2: the primary nav tabs, full labels, own row so they never
          have to compete with row 1 for width. lg and up only — below that
          it lives in the MobileNav drawer instead. */}
      <nav className="hidden lg:flex items-center gap-1 px-3 sm:px-4 lg:px-6 h-12 bg-slate-50/70 dark:bg-white/[0.02] border-b border-slate-200 dark:border-dark-border">
        {PRIMARY_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </header>
  );
};
