import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Home,
  BookOpen,
  MessageSquare,
  LifeBuoy,
  ChevronLeft,
  Menu,
  Hexagon
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NavItem = ({ to, icon: Icon, label, collapsed }: { to: string; icon: any; label: string; collapsed: boolean }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
        isActive
          ? 'bg-centri-600 text-white shadow-lg shadow-centri-900/20 dark:shadow-centri-900/40'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
      )
    }
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    {!collapsed && <span className="font-medium truncate">{label}</span>}
    {collapsed && (
      <div className="absolute left-14 bg-slate-900 dark:bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-slate-700 dark:border-slate-600 z-50 whitespace-nowrap shadow-lg">
        {label}
      </div>
    )}
  </NavLink>
);

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useStore();

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-dark-border transition-all duration-300 ease-in-out flex flex-col shadow-xl',
          sidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="relative">
              <Hexagon className="w-8 h-8 text-centri-500 fill-centri-500/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold">CW</span>
              </div>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold tracking-tight">CentriWeb</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Support OS</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <div className={cn("text-xs font-semibold text-slate-500 dark:text-slate-500 mb-2 px-3 uppercase tracking-wider", !sidebarOpen && "hidden")}>
            Menu
          </div>
          <NavItem to="/" icon={Home} label="Dashboard" collapsed={!sidebarOpen} />
          <NavItem to="/guides" icon={BookOpen} label="Guides & Tutorials" collapsed={!sidebarOpen} />
          <NavItem to="/chat" icon={MessageSquare} label="AI Assistant" collapsed={!sidebarOpen} />
          <NavItem to="/support" icon={LifeBuoy} label="Submit Ticket" collapsed={!sidebarOpen} />
        </div>

        {/* Footer / Toggle */}
        <div className="p-3 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", !sidebarOpen && "rotate-180")} />
          </button>
        </div>
      </aside>
    </>
  );
};
