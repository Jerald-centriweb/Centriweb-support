import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { TopNav } from './components/Layout/TopNav';
import { Header } from './components/Layout/Header';
import { MobileNav } from './components/Layout/MobileNav';
import { CommandMenu } from './components/Search/CommandMenu';
import { DashboardPage } from './pages/DashboardPage';
import { GuidesPage } from './pages/GuidesPage';
import { ChatPage } from './pages/ChatPage';
import { SupportPage } from './pages/SupportPage';
import { FloatingAssistant } from './components/ui/FloatingAssistant';
import { KeyboardShortcuts } from './components/ui/KeyboardShortcuts';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LoginGate } from './components/Auth/LoginGate';
import { useStore } from './store/useStore';

const Layout = () => {
  const { themeMode } = useStore();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeMode);
  }, [themeMode]);

  return (
    // Top nav replaces the old left sidebar: this portal is embedded via
    // iframe inside a builder's own GHL dashboard, which already has its own
    // left sidebar, so a second one wasted the iframe's width. Everything
    // below now runs the full width of the container instead of leaving a
    // 256px/80px gutter down the left.
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-200 flex flex-col transition-colors duration-300">
      <div className="aurora-bg" />
      <TopNav />
      <Header />

      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/guides/*" element={<GuidesPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/support" element={<SupportPage />} />
            </Routes>
          </AnimatePresence>
        </div>

        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-200 dark:border-dark-border flex items-center justify-center sm:justify-start gap-2">
          <img src="/centriweb-logo.png" alt="" className="h-4 w-4 object-contain opacity-70" />
          <span className="text-xs text-slate-400 dark:text-slate-500">Supported by CentriWeb</span>
        </footer>
      </main>

      <MobileNav />
      <CommandMenu />
      <KeyboardShortcuts />
      <FloatingAssistant />
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <LoginGate>
        <ToastProvider>
          {/* reducedMotion="user" makes every framer-motion animation in the
              app defer to the OS-level prefers-reduced-motion setting
              automatically, on top of the plain-CSS handling in index.html. */}
          <MotionConfig reducedMotion="user">
            <HashRouter>
              <Layout />
            </HashRouter>
          </MotionConfig>
        </ToastProvider>
      </LoginGate>
    </ErrorBoundary>
  );
};

export default App;
