/**
 * Chat Block - Complete chat functionality
 *
 * This block contains all chat-related components, hooks, and utilities.
 * It's a self-contained feature that can be easily imported and used.
 */

// Main chat components
export { ChatPane } from "./components/ChatPane";
export { ChatContainer } from "./components/ChatContainer";
export { Composer } from "./components/Composer";
export { Message } from "./components/Message";

// Chat sidebar components
export { UnifiedSidebar } from "./components/sidebar/UnifiedSidebar";
export { ConversationRow } from "./components/sidebar/ConversationRow";
export { FolderRow } from "./components/sidebar/FolderRow";
export { TemplateRow } from "./components/sidebar/TemplateRow";

// Re-export everything from components for convenience
export * from "./components";
