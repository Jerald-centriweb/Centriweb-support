import React, { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface Shortcut {
  keys: string[];
  description: string;
  action?: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

export const KeyboardShortcuts: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toggleSidebar, setSearchOpen, toggleTheme } = useStore();

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['G', 'H'], description: 'Go to Dashboard', action: () => navigate('/') },
        { keys: ['G', 'G'], description: 'Go to Guides', action: () => navigate('/guides') },
        { keys: ['G', 'C'], description: 'Go to Chat', action: () => navigate('/chat') },
        { keys: ['G', 'S'], description: 'Go to Support', action: () => navigate('/support') },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { keys: ['/'], description: 'Focus search', action: () => setSearchOpen(true) },
        { keys: ['⌘', 'K'], description: 'Command palette', action: () => setSearchOpen(true) },
        { keys: ['T'], description: 'Toggle theme', action: toggleTheme },
        { keys: ['B'], description: 'Toggle sidebar', action: toggleSidebar },
        { keys: ['?'], description: 'Show shortcuts', action: () => setIsOpen(true) },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { keys: ['Esc'], description: 'Close dialog / Cancel' },
        { keys: ['⌘', 'Enter'], description: 'Submit form' },
      ],
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts modal
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      // Close modal
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        return;
      }

      // Navigation shortcuts (G + X)
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !isOpen) {
        e.preventDefault();
        // Wait for next key
        const handleNext = (nextE: KeyboardEvent) => {
          const key = nextE.key.toLowerCase();
          if (key === 'h') navigate('/');
          else if (key === 'g') navigate('/guides');
          else if (key === 'c') navigate('/chat');
          else if (key === 's') navigate('/support');
          window.removeEventListener('keydown', handleNext);
        };
        window.addEventListener('keydown', handleNext, { once: true });
        return;
      }

      // Single key shortcuts
      if (!e.metaKey && !e.ctrlKey && !isOpen && !isInputFocused()) {
        if (e.key === '/') {
          e.preventDefault();
          setSearchOpen(true);
        } else if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          toggleTheme();
        } else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          toggleSidebar();
        }
      }

      // Command+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, navigate, setSearchOpen, toggleTheme, toggleSidebar]);

  const isInputFocused = () => {
    const active = document.activeElement;
    return active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-centri-500 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <Keyboard className="w-6 h-6" />
                <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {shortcutGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                      {group.title}
                    </h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIdx) => (
                              <React.Fragment key={keyIdx}>
                                <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-slate-700 dark:text-slate-300">
                                  {key}
                                </kbd>
                                {keyIdx < shortcut.keys.length - 1 && (
                                  <span className="text-slate-400 dark:text-slate-500 text-xs mx-1">
                                    then
                                  </span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300">?</kbd> anytime to show this dialog
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
