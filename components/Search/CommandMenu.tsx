import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, ArrowRight, Home, MessageSquare, LifeBuoy, Moon, Sun, Clock, Zap, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { useStore } from '../../store/useStore';
import { useContent } from '../../hooks/useContent';
import { cn } from '../../lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: any;
  action: () => void;
  keywords: string[];
}

export const CommandMenu: React.FC = () => {
  const { searchOpen, setSearchOpen, toggleTheme, themeMode, viewedGuides } = useStore();
  const { guides } = useContent();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof guides>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const fuse = useMemo(() => new Fuse(guides, { keys: ['title', 'summary', 'category'], threshold: 0.4 }), [guides]);

  const quickActions: QuickAction[] = [
    { id: 'home', label: 'Go to Home', description: 'Your dashboard', icon: Home, action: () => { navigate('/'); setSearchOpen(false); }, keywords: ['home', 'dashboard'] },
    { id: 'chat', label: 'Ask a question', description: 'Get help from the assistant', icon: MessageSquare, action: () => { navigate('/chat'); setSearchOpen(false); }, keywords: ['chat', 'ask', 'assistant', 'help'] },
    { id: 'support', label: 'Raise a ticket', description: 'Contact the CentriWeb team', icon: LifeBuoy, action: () => { navigate('/support'); setSearchOpen(false); }, keywords: ['support', 'ticket', 'help', 'contact'] },
    { id: 'theme', label: `Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`, description: 'Toggle theme', icon: themeMode === 'dark' ? Sun : Moon, action: () => toggleTheme(), keywords: ['theme', 'dark', 'light', 'mode'] },
  ];

  const recentGuides = viewedGuides.map((id) => guides.find((g) => g.id === id)).filter(Boolean).slice(0, 3) as typeof guides;

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape') setSearchOpen(false);
      if (searchOpen) {
        const totalItems = query === '' ? recentGuides.length + quickActions.length : results.length;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % Math.max(totalItems, 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(totalItems, 1));
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleEnter();
        }
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setSearchOpen, searchOpen, results, selectedIndex, query]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      setSelectedIndex(0);
    } else {
      setResults(fuse.search(query).map((r) => r.item).slice(0, 6));
      setSelectedIndex(0);
    }
  }, [query, fuse]);

  const handleSelectGuide = (guide: (typeof guides)[number]) => {
    setSearchOpen(false);
    setQuery('');
    navigate(`/guides/${guide.section}/${guide.id}`);
  };

  const handleEnter = () => {
    if (query === '') {
      if (selectedIndex < recentGuides.length) {
        handleSelectGuide(recentGuides[selectedIndex]);
      } else {
        const action = quickActions[selectedIndex - recentGuides.length];
        action?.action();
      }
    } else if (selectedIndex < results.length) {
      handleSelectGuide(results[selectedIndex]);
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
          <div className="flex items-center px-4 border-b border-slate-200 dark:border-dark-border">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides, videos, or type a command..."
              className="w-full px-4 py-4 bg-transparent text-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
            <button onClick={() => setSearchOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query === '' ? (
              <>
                {recentGuides.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Recent
                    </div>
                    <div className="space-y-1">
                      {recentGuides.map((g, idx) => (
                        <button
                          key={g.id}
                          onClick={() => handleSelectGuide(g)}
                          className={cn(
                            'w-full flex items-center gap-4 p-3 rounded-lg group transition-colors text-left',
                            idx === selectedIndex ? 'bg-centri-100 dark:bg-centri-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-md group-hover:bg-centri-100 dark:group-hover:bg-centri-900/50">
                            {g.contentType !== 'article' ? <PlayCircle className="w-5 h-5 text-centri-500 dark:text-centri-400" /> : <FileText className="w-5 h-5 text-centri-500 dark:text-centri-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{g.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{g.minutes} min</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Quick actions
                  </div>
                  <div className="space-y-1">
                    {quickActions.map((action, idx) => {
                      const adjustedIdx = idx + recentGuides.length;
                      return (
                        <button
                          key={action.id}
                          onClick={action.action}
                          className={cn(
                            'w-full flex items-center gap-4 p-3 rounded-lg group transition-colors text-left',
                            adjustedIdx === selectedIndex ? 'bg-purple-100 dark:bg-purple-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          )}
                        >
                          <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-md group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50">
                            <action.icon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200">{action.label}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{action.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-500">
                <p className="text-sm">No results for "{query}"</p>
              </div>
            ) : (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Guides ({results.length})
                </div>
                <div className="space-y-1">
                  {results.map((g, idx) => (
                    <button
                      key={g.id}
                      onClick={() => handleSelectGuide(g)}
                      className={cn(
                        'w-full flex items-center gap-4 p-3 rounded-lg group transition-colors text-left',
                        idx === selectedIndex ? 'bg-centri-100 dark:bg-centri-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <div className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 rounded-md group-hover:bg-centri-100 dark:group-hover:bg-centri-900/50">
                        {g.contentType !== 'article' ? <PlayCircle className="w-5 h-5 text-centri-500 dark:text-centri-400" /> : <FileText className="w-5 h-5 text-centri-500 dark:text-centri-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{g.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-500 truncate">{g.summary}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 border-t border-slate-200 dark:border-dark-border flex justify-between items-center text-xs text-slate-500 dark:text-slate-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <kbd className="font-sans bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">↑</kbd>
                <kbd className="font-sans bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">↓</kbd>
                <span className="ml-1">Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="font-sans bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">↵</kbd>
                <span className="ml-1">Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="font-sans bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">Esc</kbd>
              <span className="ml-1">Close</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
