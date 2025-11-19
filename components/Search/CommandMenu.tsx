import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, ArrowRight, Home, MessageSquare, LifeBuoy, Moon, Sun, Clock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { useStore } from '../../store/useStore';
import { GUIDE_DATA } from '../../data/guides';
import { cn } from '../../lib/utils';
import { analytics, searchPatternDetector } from '../../lib/analytics';

// Quick actions available in command palette
interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  action: () => void;
  keywords: string[];
}

// Flatten data for search
const searchIndex = GUIDE_DATA.flatMap((area) =>
  area.guides.map((guide) => ({
    ...guide,
    areaName: area.title,
    areaId: area.id,
  }))
);

const fuse = new Fuse(searchIndex, {
  keys: ['title', 'summary', 'tags', 'areaName'],
  threshold: 0.4,
});

export const CommandMenu: React.FC = () => {
  const { searchOpen, setSearchOpen, toggleTheme, themeMode, viewedGuides } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'home',
      label: 'Go to Dashboard',
      description: 'Navigate to home page',
      icon: Home,
      action: () => { navigate('/'); setSearchOpen(false); },
      keywords: ['home', 'dashboard', 'main'],
    },
    {
      id: 'chat',
      label: 'Open AI Assistant',
      description: 'Get help from AI',
      icon: MessageSquare,
      action: () => { navigate('/chat'); setSearchOpen(false); },
      keywords: ['chat', 'ai', 'assistant', 'help'],
    },
    {
      id: 'support',
      label: 'Submit Support Ticket',
      description: 'Contact support team',
      icon: LifeBuoy,
      action: () => { navigate('/support'); setSearchOpen(false); },
      keywords: ['support', 'ticket', 'help', 'contact'],
    },
    {
      id: 'theme',
      label: `Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle theme',
      icon: themeMode === 'dark' ? Sun : Moon,
      action: () => { toggleTheme(); },
      keywords: ['theme', 'dark', 'light', 'mode'],
    },
  ];

  // Get recent guides
  const recentGuides = viewedGuides.slice(0, 3).map((id) => {
    for (const area of GUIDE_DATA) {
      const guide = area.guides.find((g) => g.id === id);
      if (guide) return { ...guide, areaName: area.title, areaId: area.id };
    }
    return null;
  }).filter(Boolean);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }

      // Navigation
      if (searchOpen) {
        const totalItems = results.length + quickActions.length + recentGuides.length;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleEnter();
        }
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setSearchOpen, searchOpen, results, selectedIndex]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setSelectedIndex(0);
    } else {
      // Search in guides
      const guideResults = fuse.search(query).map((r) => r.item).slice(0, 5);

      // Filter quick actions by query
      const actionResults = quickActions.filter((action) =>
        action.keywords.some((kw) => kw.includes(query.toLowerCase())) ||
        action.label.toLowerCase().includes(query.toLowerCase())
      );

      setResults(guideResults);
      setSelectedIndex(0);

      // Analytics: Track search (with debounce to avoid spam)
      const timeoutId = setTimeout(() => {
        analytics.trackSearch(query, guideResults.length);
        searchPatternDetector.addSearch(query);

        // Check for confusion signals
        if (searchPatternDetector.hasRepeatedSearches() || searchPatternDetector.isSearchingRapidly()) {
          console.warn('[Analytics] Confusion signal detected - user may be stuck');
        }
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [query]);

  const handleEnter = () => {
    const totalActions = quickActions.length;
    const totalRecents = recentGuides.length;

    if (query === '') {
      // Navigate recent guides or quick actions
      if (selectedIndex < totalRecents) {
        const item = recentGuides[selectedIndex];
        if (item) handleSelectGuide(item);
      } else if (selectedIndex < totalRecents + totalActions) {
        const action = quickActions[selectedIndex - totalRecents];
        action.action();
      }
    } else {
      // Navigate search results
      if (selectedIndex < results.length) {
        handleSelectGuide(results[selectedIndex]);
      }
    }
  };

  const handleSelectGuide = (item: any) => {
    setSearchOpen(false);
    setQuery('');
    navigate(`/guides/${item.areaId}/${item.id}`);
  };

  const handleSelectAction = (action: QuickAction) => {
    action.action();
    if (action.id !== 'theme') {
      setQuery('');
    }
  };

  if (!searchOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSearchOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-slate-200 dark:border-dark-border">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides, actions, or type a command..."
              className="w-full px-4 py-4 bg-transparent text-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query === '' ? (
              <>
                {/* Recent Guides */}
                {recentGuides.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Recent
                    </div>
                    <div className="space-y-1">
                      {recentGuides.map((item: any, idx) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectGuide(item)}
                          className={cn(
                            'w-full flex items-center gap-4 p-3 rounded-lg group transition-colors text-left',
                            idx === selectedIndex
                              ? 'bg-centri-100 dark:bg-centri-900/30'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-md group-hover:bg-centri-100 dark:group-hover:bg-centri-900/50">
                            <FileText className="w-5 h-5 text-centri-500 dark:text-centri-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 group-hover:text-centri-600 dark:group-hover:text-centri-300 truncate">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                              {item.areaName} <span className="w-1 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" /> {item.timeToRead}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 dark:group-hover:text-centri-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Quick Actions
                  </div>
                  <div className="space-y-1">
                    {quickActions.map((action, idx) => {
                      const adjustedIdx = idx + recentGuides.length;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleSelectAction(action)}
                          className={cn(
                            'w-full flex items-center gap-4 p-3 rounded-lg group transition-colors text-left',
                            adjustedIdx === selectedIndex
                              ? 'bg-purple-100 dark:bg-purple-900/30'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-md group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50">
                            <action.icon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-300">
                              {action.label}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                              {action.description}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <>
                {results.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-500">
                    <p className="text-sm">No results found for "{query}"</p>
                  </div>
                ) : (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Guides ({results.length})
                    </div>
                    <div className="space-y-1">
                      {results.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectGuide(item)}
                          className={cn(
                            'w-full flex items-center gap-4 p-3 rounded-lg group transition-colors text-left',
                            idx === selectedIndex
                              ? 'bg-centri-100 dark:bg-centri-900/30'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-md group-hover:bg-centri-100 dark:group-hover:bg-centri-900/50">
                            <FileText className="w-5 h-5 text-centri-500 dark:text-centri-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 group-hover:text-centri-600 dark:group-hover:text-centri-300 truncate">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                              {item.areaName} <span className="w-1 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" /> {item.timeToRead}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-centri-500 dark:group-hover:text-centri-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-t border-slate-200 dark:border-dark-border flex justify-between items-center text-xs text-slate-500 dark:text-slate-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <kbd className="font-sans bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">↑</kbd>
                <kbd className="font-sans bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">↓</kbd>
                <span className="ml-1">Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="font-sans bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">↵</kbd>
                <span className="ml-1">Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="font-sans bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">Esc</kbd>
              <span className="ml-1">Close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
