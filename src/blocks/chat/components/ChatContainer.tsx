"use client";

import React from "react";
import { useChatState } from "@/hooks/useChatState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePanelResize } from "@/hooks/usePanelResize";
import { KeyboardShortcut } from "@/types/ui";
import { Conversation, Template, Folder } from "@/types/chat";

interface ChatContainerProps {
  initialConversations: Conversation[];
  initialTemplates: Template[];
  initialFolders: Folder[];
  children: (
    props: ReturnType<typeof useChatState> & ReturnType<typeof usePanelResize>,
  ) => React.ReactNode;
}

export function ChatContainer({
  initialConversations,
  initialTemplates,
  initialFolders,
  children,
}: ChatContainerProps) {
  const chatState = useChatState({
    initialConversations,
    initialTemplates,
    initialFolders,
  });

  const panelResize = usePanelResize();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "n",
      metaKey: true,
      action: chatState.createNewChat,
      description: "Create new chat",
    },
    {
      key: "/",
      action: () => chatState.searchRef.current?.focus(),
      description: "Focus search",
    },
    {
      key: "[",
      metaKey: true,
      action: panelResize.collapseSidebar,
      description: "Collapse sidebar",
    },
    {
      key: "]",
      metaKey: true,
      action: panelResize.expandSidebar,
      description: "Expand sidebar",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return <>{children({ ...chatState, ...panelResize })}</>;
}
