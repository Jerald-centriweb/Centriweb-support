import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Layout/Sidebar';
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
import { cn } from './lib/utils';

const Layout = () => {
  const { sidebarOpen, themeMode } = useStore();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeMode);
  }, [themeMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-200 flex transition-colors duration-300">
      <div className="aurora-bg" />
      <Sidebar />

      <main
        className={cn(
          'flex-1 transition-all duration-300 ease-in-out min-h-screen flex flex-col',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        <Header />

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
          <HashRouter>
            <Layout />
          </HashRouter>
        </ToastProvider>
      </LoginGate>
    </ErrorBoundary>
  );
};

export default App;
