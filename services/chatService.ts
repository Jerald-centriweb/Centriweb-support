import { ChatMessage } from '../types';

const SYSTEM_PROMPT = `
You are the CentriWeb AI Assistant. 
Your goal is to help users navigate the CentriWeb (GoHighLevel-based) platform.
Be concise, professional, and helpful.
If a user asks about specific features (Pipelines, Workflows), explain briefly and suggest looking at the relevant guide.
`;

// Simulating an API call to OpenAI or an internal proxy
export const sendMessageToAI = async (
  messages: ChatMessage[]
): Promise<ChatMessage> => {
  
  // IN PRODUCTION: Replace this with a fetch to your backend (e.g., /api/chat)
  // const response = await fetch('/api/chat', { ... });
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
      let responseContent = "I can help with that. Could you provide more details?";
      let actions: ChatMessage['suggestedActions'] = [];

      if (lastUserMessage.includes('pipeline') || lastUserMessage.includes('opportunity')) {
        responseContent = "Pipelines help you track leads through your sales process. You can customize stages in Settings > Pipelines. Would you like to read the full guide on Opportunities?";
        actions = [{ type: 'open_guide', payload: 'understanding-pipelines', label: 'Read Guide: Pipelines' }];
      } else if (lastUserMessage.includes('setup') || lastUserMessage.includes('start')) {
        responseContent = "Welcome to CentriWeb! To get started, you should verify your domain and connect your calendar. I have a checklist ready for you.";
        actions = [{ type: 'open_guide', payload: 'account-setup', label: 'Open Setup Checklist' }];
      } else if (lastUserMessage.includes('support') || lastUserMessage.includes('broken')) {
        responseContent = "I'm sorry to hear you're having trouble. It might be best to raise a ticket with our human support team.";
        actions = [{ type: 'navigate', payload: '/support', label: 'Open Support Ticket' }];
      }

      resolve({
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
        suggestedActions: actions
      });
    }, 1200); // Simulate network latency
  });
};
