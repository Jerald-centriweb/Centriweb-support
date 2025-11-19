import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { useStore } from '../../store/useStore';
import { GUIDE_DATA } from '../../data/guides';
import { Guide, GuideArea } from '../../types';
import { cn } from '../../lib/utils';

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
  const { searchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setSearchOpen]);

  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
    } else {
      setResults(fuse.search(query).map((r) => r.item).slice(0, 5));
    }
  }, [query]);

  const handleSelect = (item: any) => {
    setSearchOpen(false);
    setQuery('');
    navigate(`/guides/${item.areaId}/${item.id}`);
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
          className="relative w-full max-w-2xl bg-dark-card border border-dark-border rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center px-4 border-b border-dark-border">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides, tutorials, and help..."
              className="w-full px-4 py-4 bg-transparent text-lg text-white placeholder-slate-500 focus:outline-none"
            />
            <button onClick={() => setSearchOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {query === '' && (
              <div className="p-8 text-center text-slate-500">
                <p className="text-sm">Type to search CentriWeb guides...</p>
              </div>
            )}
            
            {query !== '' && results.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <p className="text-sm">No results found for "{query}"</p>
              </div>
            )}

            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-centri-900/30 group transition-colors text-left"
                >
                  <div className="flex-shrink-0 p-2 bg-slate-800 rounded-md group-hover:bg-centri-900/50">
                    <FileText className="w-5 h-5 text-centri-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-200 group-hover:text-centri-300 truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      {item.areaName} <span className="w-1 h-1 bg-slate-600 rounded-full" /> {item.timeToRead}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-centri-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-slate-900/50 px-4 py-2 border-t border-dark-border flex justify-end items-center text-xs text-slate-500">
             <span className="mr-2">Navigate</span> <kbd className="font-sans bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">↵</kbd>
             <span className="mx-2">·</span>
             <span className="mr-2">Close</span> <kbd className="font-sans bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">Esc</kbd>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
