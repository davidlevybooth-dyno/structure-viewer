import { Conversation, Message } from '../types/chat';


export function generateId(prefix: string = ''): string {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}`;
}


export function createNewConversation(title: string = "New Chat", folder: string = "Work Projects"): Conversation {
  const id = generateId();
  const now = new Date().toISOString();
  
  return {
    id,
    title,
    updatedAt: now,
    messageCount: 0,
    preview: "Say hello to start...",
    pinned: false,
    folder,
    messages: [],
  };
}

export function createMessage(role: "user" | "assistant", content: string): Message {
  return {
    id: generateId('m'),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}


export function updateConversationWithMessage(
  conversation: Conversation, 
  message: Message
): Conversation {
  const messages = [...conversation.messages, message];
  
  return {
    ...conversation,
    messages,
    updatedAt: message.createdAt,
    messageCount: messages.length,
    preview: message.content.slice(0, 80),
  };
}


export function filterConversations(conversations: Conversation[], query: string): Conversation[] {
  if (!query.trim()) return conversations;
  
  const q = query.toLowerCase();
  return conversations.filter(
    (c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
  );
}
