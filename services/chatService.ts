import { ChatMessage } from '../types';
import { apiFetch } from './authService';

/**
 * Sends the latest user message to the grounded chat endpoint. The backend
 * (/api/chat) answers ONLY from migrated guide content and Agency Brain
 * search, and refuses to invent an answer when nothing matches — see
 * server/chat.js. This replaces the previous version of this file, which
 * was a hardcoded setTimeout() stub with no real backend call at all.
 */
export const sendMessageToAI = async (messages: ChatMessage[]): Promise<ChatMessage> => {
  const lastUserMessage = messages[messages.length - 1].content;

  const res = await apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: lastUserMessage }),
  });

  if (!res.ok) {
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: "Something went wrong reaching support. Please try again, or raise a ticket from the Support tab.",
      timestamp: Date.now(),
      suggestedActions: [{ type: 'navigate', payload: '/support', label: 'Open Support Ticket' }],
    };
  }

  const data = await res.json();

  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: data.reply,
    timestamp: Date.now(),
    suggestedActions: data.grounded
      ? []
      : [{ type: 'navigate', payload: '/support', label: 'Raise a Support Ticket' }],
  };
};
