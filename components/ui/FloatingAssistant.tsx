import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A persistent shortcut into the real chat surface (pages/ChatPage.tsx +
 * ChatInterface), not a second, lighter-weight chat implementation. An
 * earlier version of this component ran its own separate message state and
 * opened a self-contained panel on top of the page — a client could end up
 * in two different "AI assistant" conversations (this one, and the full
 * /chat page) that didn't share history, one of which lacked voice input and
 * analytics tracking. That is the kind of inconsistency a premium app can't
 * have, so this is now just fast navigation to the one real chat. It also
 * hides on /chat itself, where it would otherwise float over the exact
 * feature it links to.
 */
export const FloatingAssistant: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/chat')) return null;

  return (
    <AnimatePresence>
      <motion.button
        key="floating-assistant"
        initial={{ opacity: 0, scale: 0.8, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/chat')}
        className="group fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 pl-4 pr-4 sm:pr-5 h-12 sm:h-14 rounded-full bg-centri-600 text-white shadow-lg shadow-centri-900/30 hover:bg-centri-500 transition-colors"
        aria-label="Ask a question"
        title="Ask a question"
      >
        <MessageSquare className="w-5 h-5 flex-shrink-0" />
        <span className="hidden sm:inline text-sm font-medium max-w-0 overflow-hidden opacity-0 group-hover:max-w-[10rem] group-hover:opacity-100 group-focus-visible:max-w-[10rem] group-focus-visible:opacity-100 transition-all duration-300 whitespace-nowrap">
          Ask a question
        </span>
      </motion.button>
    </AnimatePresence>
  );
};
