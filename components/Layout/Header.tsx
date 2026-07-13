import React from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { Search, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const { setSearchOpen, toggleMobileMenu } = useStore();
  const location = useLocation();
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <header className="h-16 sticky top-0 z-30 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-4 sm:px-8 transition-colors duration-300">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Breadcrumbs path={location.pathname} />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Search guides and actions (${isMac ? 'Cmd+K' : 'Ctrl+K'})`}
        >
          <Search className="w-3.5 h-3.5" />
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-400">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
        <ThemeToggle />
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-medium text-emerald-500">Online</span>
        </div>
      </div>
    </header>
  );
};
