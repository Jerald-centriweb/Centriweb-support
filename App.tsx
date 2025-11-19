import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Layout/Sidebar';
import { CommandMenu } from './components/Search/CommandMenu';
import { DashboardPage } from './pages/DashboardPage';
import { GuidesPage } from './pages/GuidesPage';
import { ChatPage } from './pages/ChatPage';
import { SupportPage } from './pages/SupportPage';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { FloatingAssistant } from './components/ui/FloatingAssistant';
import { KeyboardShortcuts } from './components/ui/KeyboardShortcuts';
import { BadgeNotification } from './components/ui/BadgeNotification';
import { ToastProvider } from './components/ui/Toast';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import { FeatureGate } from './components/FeatureGate';
import { useStore } from './store/useStore';
import { cn } from './lib/utils';

const Layout = () => {
  const { sidebarOpen, themeMode, setSearchOpen } = useStore();
  const { config, isLoading } = useTenant();
  const location = useLocation();

  // Detect if user is on Mac or Windows
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Show loading state while tenant config loads
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-centri-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeMode);
  }, [themeMode]);

  // Helper to show breadcrumbs mostly for visual flair in header
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Get page title based on route
  const getPageTitle = () => {
    if (pathSegments.length === 0) return 'Dashboard';
    const segment = pathSegments[0];
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-200 flex transition-colors duration-300">
      <Sidebar />

      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out min-h-screen flex flex-col",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        {/* Header / Top Bar */}
        <header className="h-16 sticky top-0 z-30 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-8 transition-colors duration-300">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 capitalize">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">{config.branding.companyName}</span>
            {pathSegments.length > 0 && (
              <>
                <span className="text-slate-400 dark:text-slate-700">/</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {getPageTitle()}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Search guides and actions (${isMac ? '⌘K' : 'Ctrl+K'})`}
            >
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-400">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
              <span className="text-slate-400 dark:text-slate-500">Search</span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* System Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-xs font-medium text-emerald-500">Online</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/guides/*" element={<GuidesPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>

      <CommandMenu />
      <KeyboardShortcuts />

      {/* EXPERIMENTAL FEATURES - Feature-gated */}
      <FeatureGate feature="badges">
        <BadgeNotification />
      </FeatureGate>

      {/* Floating Assistant - always show but could be feature-gated later */}
      <FloatingAssistant />
    </div>
  );
};

const App = () => {
  return (
    <TenantProvider>
      <ToastProvider>
        <HashRouter>
          <Layout />
        </HashRouter>
      </ToastProvider>
    </TenantProvider>
  );
};

export default App;
