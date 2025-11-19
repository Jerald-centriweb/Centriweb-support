import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { CommandMenu } from './components/Search/CommandMenu';
import { GuidesPage } from './pages/GuidesPage';
import { ChatPage } from './pages/ChatPage';
import { SupportPage } from './pages/SupportPage';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { useStore } from './store/useStore';
import { cn } from './lib/utils';

const Layout = () => {
  const { sidebarOpen, themeMode, setThemeMode } = useStore();
  const location = useLocation();

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeMode);
  }, [themeMode]);

  // Helper to show breadcrumbs mostly for visual flair in header
  const pathSegments = location.pathname.split('/').filter(Boolean);

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
            <span className="text-slate-600 dark:text-slate-400 font-semibold">CentriWeb</span>
            {pathSegments.map((segment, i) => (
               <React.Fragment key={i}>
                 <span className="text-slate-400 dark:text-slate-700">/</span>
                 <span className={i === pathSegments.length - 1 ? "text-slate-900 dark:text-white font-medium" : "text-slate-600 dark:text-slate-400"}>
                   {segment}
                 </span>
               </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* System Status */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               <span className="text-xs font-medium text-emerald-500">System Operational</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/guides" replace />} />
            <Route path="/guides/*" element={<GuidesPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </div>
      </main>

      <CommandMenu />
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
};

export default App;
