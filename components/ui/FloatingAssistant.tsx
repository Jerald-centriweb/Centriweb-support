import React, { useState } from 'react';
import { MessageSquare, X, Mic, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ChatMessage } from '../../types';
import { sendMessageToAI } from '../../services/chatService';

export const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Hi! I\'m your AI assistant. Ask me anything about GoHighLevel!',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendMessageToAI([...messages, userMsg]);
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error('AI error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300',
          'bg-gradient-to-br from-centri-500 to-purple-600 text-white',
          'hover:scale-110 hover:shadow-centri-500/50',
          'focus:outline-none focus:ring-4 focus:ring-centri-500/50',
          isOpen && 'scale-0 opacity-0'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          boxShadow: isOpen
            ? '0 0 0 0 rgba(14, 165, 233, 0)'
            : '0 0 0 10px rgba(14, 165, 233, 0.3)',
        }}
        transition={{
          boxShadow: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse',
          },
        }}
      >
        <MessageSquare className="w-6 h-6" />

        {/* Unread Indicator (optional) */}
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold animate-pulse">
          !
        </span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-centri-500 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-xs text-white/80">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] p-3 rounded-2xl text-sm',
                      msg.role === 'user'
                        ? 'bg-centri-500 text-white rounded-tr-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <button
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
                  title="Voice input (coming soon)"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-centri-500 text-slate-900 dark:text-white placeholder-slate-400"
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2 bg-centri-500 text-white rounded-lg hover:bg-centri-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                AI responses may not always be accurate
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
