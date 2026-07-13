import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useContent } from '../../hooks/useContent';
import {
  Home,
  Rocket,
  BookOpen,
  Video,
  Wrench,
  MessageSquare,
  LifeBuoy,
  ChevronLeft,
  ChevronDown,
  Menu,
  Hexagon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NavItem = ({ to, icon: Icon, label, collapsed, end }: { to: string; icon: any; label: string; collapsed: boolean; end?: boolean }) => (
  <NavLink
    to={to}
    end={end}
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
  const { sidebarOpen, toggleSidebar, selectedProduct, setSelectedProduct } = useStore();
  const { products } = useContent();

  // Default to the first product once the list loads. This is the entire
  // amount of work a second product needs from the nav: add a row to
  // `products`, tag guides with its slug, and it appears here automatically.
  useEffect(() => {
    if (!selectedProduct && products.length > 0) setSelectedProduct(products[0].slug);
  }, [products, selectedProduct, setSelectedProduct]);

  const activeProduct = products.find((p) => p.slug === selectedProduct) || products[0];

  return (
    <>
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
        {/* Logo + Product selector — top level of the SOP model */}
        <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white w-full">
            <div className="relative flex-shrink-0">
              <Hexagon className="w-8 h-8 text-centri-500 fill-centri-500/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold">CW</span>
              </div>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 relative group">
                <button className="w-full flex items-center justify-between gap-1 text-left">
                  <div className="min-w-0">
                    <span className="font-bold tracking-tight truncate block leading-tight">
                      {activeProduct?.name || 'Help Centre'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Help Centre</span>
                  </div>
                  {products.length > 1 && <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
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
            )}
          </div>
        </div>

        {/* Nav — SOP model: onboarding path, day-to-day, videos, troubleshooting */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <NavItem to="/" end icon={Home} label="Home" collapsed={!sidebarOpen} />
          <div className={cn('text-xs font-semibold text-slate-500 dark:text-slate-500 mt-6 mb-2 px-3 uppercase tracking-wider', !sidebarOpen && 'hidden')}>
            {activeProduct?.name || 'Guides'}
          </div>
          <NavItem to="/guides/start_here" icon={Rocket} label="Start here" collapsed={!sidebarOpen} />
          <NavItem to="/guides/day_to_day" icon={BookOpen} label="Day-to-day guides" collapsed={!sidebarOpen} />
          <NavItem to="/guides/videos" icon={Video} label="Videos" collapsed={!sidebarOpen} />
          <NavItem to="/guides/troubleshooting" icon={Wrench} label="Troubleshooting" collapsed={!sidebarOpen} />

          <div className={cn('text-xs font-semibold text-slate-500 dark:text-slate-500 mt-6 mb-2 px-3 uppercase tracking-wider', !sidebarOpen && 'hidden')}>
            Get help
          </div>
          <NavItem to="/chat" icon={MessageSquare} label="Ask a question" collapsed={!sidebarOpen} />
          <NavItem to="/support" icon={LifeBuoy} label="Raise a ticket" collapsed={!sidebarOpen} />
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-white/5">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <ChevronLeft className={cn('w-5 h-5 transition-transform', !sidebarOpen && 'rotate-180')} />
          </button>
        </div>
      </aside>
    </>
  );
};
