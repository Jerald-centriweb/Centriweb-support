import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { themeMode, toggleTheme } = useStore();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-300 group",
        themeMode === 'dark'
          ? "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
          : "bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400",
        className
      )}
      aria-label="Toggle theme"
      title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon for dark mode (shows when in dark, clicking switches to light) */}
        <Sun
          className={cn(
            "absolute inset-0 transition-all duration-300 transform",
            themeMode === 'dark'
              ? "rotate-0 scale-100 opacity-100 text-yellow-400"
              : "rotate-90 scale-0 opacity-0 text-slate-400"
          )}
          size={20}
        />
        {/* Moon icon for light mode (shows when in light, clicking switches to dark) */}
        <Moon
          className={cn(
            "absolute inset-0 transition-all duration-300 transform",
            themeMode === 'light'
              ? "rotate-0 scale-100 opacity-100 text-slate-700"
              : "-rotate-90 scale-0 opacity-0 text-slate-400"
          )}
          size={20}
        />
      </div>
    </button>
  );
};
