/**
 * Chat-related utility functions
 */

import { Conversation, Message } from '../types/chat';

/**
 * Generate a unique ID for messages and conversations
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Create a new conversation with default values
 */
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

/**
 * Create a new message
 */
export function createMessage(role: "user" | "assistant", content: string): Message {
  return {
    id: generateId('m'),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Update conversation with new message
 */
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

/**
 * Filter conversations by search query
 */
export function filterConversations(conversations: Conversation[], query: string): Conversation[] {
  if (!query.trim()) return conversations;
  
  const q = query.toLowerCase();
  return conversations.filter(
    (c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q)
  );
}
