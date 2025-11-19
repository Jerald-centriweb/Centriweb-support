import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { ChatMessage } from '../../types';
import { sendMessageToAI } from '../../services/chatService';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';
import { analytics } from '../../lib/analytics';
import { VoiceInput } from './VoiceInput';
import { useFeature } from '../../contexts/TenantContext';

export const ChatInterface: React.FC<{ className?: string }> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: 'Hello! I am the CentriWeb AI Assistant. I can help you find guides, explain features, or troubleshoot issues. What can I do for you today?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState<string>(() => `conv_${Date.now()}`);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const voiceInputEnabled = useFeature('voiceInput');

  // Track chat session start
  useEffect(() => {
    analytics.trackAIChatStart();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Track user message
    analytics.trackAIChatMessage(input, true);

    try {
      const response = await sendMessageToAI([...messages, userMsg]);
      setMessages(prev => [...prev, response]);

      // Track AI response
      analytics.trackAIChatMessage(response.content, false);
    } catch (error) {
      // Error handling
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = (action: any) => {
    // Track suggested action click
    analytics.trackEvent('ai_chat_action_click', {
      actionType: action.type,
      actionLabel: action.label
    });

    if (action.type === 'open_guide') {
       // In a real app, you'd find the areaID too, or handle routing more robustly
       // Here we assume the payload is the guide ID and we rely on global search or known paths
       // For demo, we assume we know where it is or just nav to guides
       navigate(`/guides`); // Simplified for this demo without full routing context map
    } else if (action.type === 'navigate') {
       navigate(action.payload);
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
    setVoiceError(null);
  };

  const handleVoiceError = (error: string) => {
    setVoiceError(error);
    setTimeout(() => setVoiceError(null), 5000); // Clear error after 5 seconds
  };

  return (
    <div className={cn("flex flex-col h-full bg-dark-bg", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
              msg.role === 'assistant' ? "bg-centri-600 text-white" : "bg-slate-700 text-slate-300"
            )}>
              {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className={cn(
                "p-4 rounded-2xl shadow-sm leading-relaxed text-sm",
                msg.role === 'assistant' 
                  ? "bg-dark-card border border-dark-border text-slate-200 rounded-tl-none" 
                  : "bg-centri-600 text-white rounded-tr-none"
              )}>
                {msg.content}
              </div>

              {/* Suggested Actions */}
              {msg.suggestedActions && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {msg.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAction(action)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-centri-900/30 border border-centri-700/30 text-centri-300 text-xs hover:bg-centri-900/50 transition-colors"
                    >
                      <Sparkles size={12} />
                      {action.label}
                      <ExternalLink size={12} className="opacity-50" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-centri-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot size={18} />
            </div>
            <div className="bg-dark-card border border-dark-border p-4 rounded-2xl rounded-tl-none flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-dark-border bg-dark-card/50 backdrop-blur-md">
        {voiceError && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center">
            {voiceError}
          </div>
        )}

        <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about pipelines, workflows, or account setup..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pr-24 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-centri-500 focus:ring-1 focus:ring-centri-500 transition-all shadow-inner"
          />

          {/* Voice Input Button (Feature Gated) */}
          {voiceInputEnabled && (
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              onError={handleVoiceError}
              className="absolute right-12 top-1.5 bottom-1.5"
            />
          )}

          <Button
            size="sm"
            className="absolute right-2 top-1.5 bottom-1.5 aspect-square p-0 rounded-lg"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send size={16} />
          </Button>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2">
          AI can make mistakes. Review specific guides for critical configuration.
        </p>
      </div>
    </div>
  );
};
