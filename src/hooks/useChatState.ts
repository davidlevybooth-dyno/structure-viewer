/**
 * Custom hook for managing chat state and operations
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Conversation, Template, Folder, CollapsedState } from "../types/chat";
import { getStorageItem, setStorageItem, STORAGE_KEYS } from "../utils/storage";
import {
  createNewConversation,
  createMessage,
  updateConversationWithMessage,
  filterConversations,
} from "../utils/chat";

interface UseChatStateProps {
  initialConversations: Conversation[];
  initialTemplates: Template[];
  initialFolders: Folder[];
}

export function useChatState({
  initialConversations,
  initialTemplates,
  initialFolders,
}: UseChatStateProps) {
  // Core state
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [query, setQuery] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [thinkingConvId, setThinkingConvId] = useState<string | null>(null);

  // Persistent state - initialize with defaults to avoid hydration mismatch
  const [collapsed, setCollapsed] = useState<CollapsedState>({
    pinned: true,
    recent: false,
    folders: true,
    templates: true,
  });

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    const savedCollapsed = getStorageItem<CollapsedState>(
      STORAGE_KEYS.SIDEBAR_COLLAPSED,
      { pinned: true, recent: false, folders: true, templates: true },
    );
    setCollapsed(savedCollapsed);
  }, []);

  // Save to localStorage when collapsed state changes
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed);
  }, [collapsed]);

  // Refs
  const searchRef = useRef<HTMLInputElement | null>(null);
  const composerRef = useRef<{
    insertTemplate: (content: string) => void;
  } | null>(null);

  // Computed values
  const filtered = useMemo(
    () => filterConversations(conversations, query),
    [conversations, query],
  );

  const pinned = useMemo(
    () =>
      filtered
        .filter((c) => c.pinned)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [filtered],
  );

  const recent = useMemo(
    () =>
      filtered
        .filter((c) => !c.pinned)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, 10),
    [filtered],
  );

  const folderCounts = useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]));
    for (const c of conversations) {
      if (map[c.folder] != null) map[c.folder] += 1;
    }
    return map;
  }, [conversations, folders]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  // Actions
  const togglePin = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
  }, []);

  const createNewChat = useCallback(() => {
    const newConversation = createNewConversation();
    setConversations((prev) => [newConversation, ...prev]);
    setSelectedId(newConversation.id);
  }, []);

  const sendMessage = useCallback((convId: string, content: string) => {
    if (!content.trim()) return;

    const userMessage = createMessage("user", content);

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        return updateConversationWithMessage(c, userMessage);
      }),
    );

    setIsThinking(true);
    setThinkingConvId(convId);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage = createMessage(
        "assistant",
        "Got it — I'll help with that.",
      );

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          return updateConversationWithMessage(c, assistantMessage);
        }),
      );

      setIsThinking(false);
      setThinkingConvId(null);
    }, 2000);
  }, []);

  const editMessage = useCallback(
    (convId: string, messageId: string, newContent: string) => {
      const now = new Date().toISOString();
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const messages = c.messages.map((m) =>
            m.id === messageId
              ? { ...m, content: newContent, editedAt: now }
              : m,
          );
          return {
            ...c,
            messages,
            preview:
              messages[messages.length - 1]?.content?.slice(0, 80) || c.preview,
          };
        }),
      );
    },
    [],
  );

  const resendMessage = useCallback(
    (convId: string, messageId: string) => {
      const conv = conversations.find((c) => c.id === convId);
      const msg = conv?.messages?.find((m) => m.id === messageId);
      if (!msg) return;
      sendMessage(convId, msg.content);
    },
    [conversations, sendMessage],
  );

  const pauseThinking = useCallback(() => {
    setIsThinking(false);
    setThinkingConvId(null);
  }, []);

  const handleUseTemplate = useCallback((template: Template) => {
    if (composerRef.current) {
      composerRef.current.insertTemplate(template.content);
    }
  }, []);

  return {
    // State
    conversations,
    selectedId,
    templates,
    folders,
    query,
    isThinking,
    thinkingConvId,
    collapsed,
    selected,

    // Computed
    pinned,
    recent,
    folderCounts,

    // Refs
    searchRef,
    composerRef,

    // Actions
    setSelectedId,
    setTemplates,
    setQuery,
    setCollapsed,
    togglePin,
    createNewChat,
    sendMessage,
    editMessage,
    resendMessage,
    pauseThinking,
    handleUseTemplate,
  };
}
