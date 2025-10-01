"use client";
import { forwardRef, useState } from "react";
import { SearchIcon, Plus, Star, Clock, Asterisk } from "lucide-react";
import CreateFolderModal from "@/components/ui/modals/CreateFolderModal";
import CreateTemplateModal from "@/components/ui/modals/CreateTemplateModal";
import SearchModal from "@/components/ui/modals/SearchModal";
import ChatPane from "../ChatPane";
import ConversationRow from "./ConversationRow";
import SidebarSection from "./SidebarSection";
import { Conversation, Template, Folder, CollapsedState } from "@/types/chat";

interface UnifiedSidebarProps {
  collapsed: CollapsedState;
  setCollapsed: (
    collapsed: CollapsedState | ((prev: CollapsedState) => CollapsedState),
  ) => void;
  conversations: Conversation[];
  pinned: Conversation[];
  recent: Conversation[];
  folders: Folder[];
  folderCounts: Record<string, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  togglePin: (id: string) => void;
  query: string;
  setQuery: (query: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  createFolder: () => void;
  createNewChat: () => void;
  templates: Template[];
  setTemplates: (templates: Template[]) => void;
  onUseTemplate: (template: Template) => void;
  conversation: Conversation | null;
  onSend: (content: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onResendMessage: (messageId: string) => void;
  isThinking: boolean;
  onPauseThinking: () => void;
}

const UnifiedSidebar = forwardRef<any, UnifiedSidebarProps>(
  function UnifiedSidebar(
    {
      collapsed,
      setCollapsed,
      conversations,
      pinned,
      recent,
      folders,
      folderCounts,
      selectedId,
      onSelect,
      togglePin,
      query,
      setQuery,
      searchRef,
      createFolder,
      createNewChat,
      templates = [],
      setTemplates = () => {},
      onUseTemplate = () => {},
      conversation,
      onSend,
      onEditMessage,
      onResendMessage,
      isThinking,
      onPauseThinking,
    },
    ref,
  ) {
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [showCreateTemplateModal, setShowCreateTemplateModal] =
      useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showSearchModal, setShowSearchModal] = useState(false);

    const getConversationsByFolder = (folderName) => {
      return conversations.filter((conv) => conv.folder === folderName);
    };

    const handleCreateFolder = (folderName) => {
      createFolder(folderName);
    };

    const handleDeleteFolder = (folderName) => {
      const updatedConversations = conversations.map((conv) =>
        conv.folder === folderName ? { ...conv, folder: null } : conv,
      );
      console.log(
        "Delete folder:",
        folderName,
        "Updated conversations:",
        updatedConversations,
      );
    };

    const handleRenameFolder = (oldName, newName) => {
      const updatedConversations = conversations.map((conv) =>
        conv.folder === oldName ? { ...conv, folder: newName } : conv,
      );
      console.log(
        "Rename folder:",
        oldName,
        "to",
        newName,
        "Updated conversations:",
        updatedConversations,
      );
    };

    const handleCreateTemplate = (templateData) => {
      if (editingTemplate) {
        const updatedTemplates = templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...templateData, id: editingTemplate.id }
            : t,
        );
        setTemplates(updatedTemplates);
        setEditingTemplate(null);
      } else {
        const newTemplate = {
          ...templateData,
          id: Date.now().toString(),
        };
        setTemplates([...templates, newTemplate]);
      }
      setShowCreateTemplateModal(false);
    };

    const handleEditTemplate = (template) => {
      setEditingTemplate(template);
      setShowCreateTemplateModal(true);
    };

    const handleRenameTemplate = (templateId, newName) => {
      const updatedTemplates = templates.map((t) =>
        t.id === templateId
          ? { ...t, name: newName, updatedAt: new Date().toISOString() }
          : t,
      );
      setTemplates(updatedTemplates);
    };

    const handleDeleteTemplate = (templateId) => {
      const updatedTemplates = templates.filter((t) => t.id !== templateId);
      setTemplates(updatedTemplates);
    };

    const handleUseTemplate = (template) => {
      onUseTemplate(template);
    };

    return (
      <>
        <div className="flex w-full min-w-0 border-r border-zinc-200/60 bg-white">
          <div className="flex flex-col w-full h-full">
            <div className="h-1/4 border-b border-zinc-200/60 bg-zinc-50/50 flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-zinc-200/60 px-4 py-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="grid h-6 w-6 place-items-center rounded-md bg-blue-600 text-white">
                    <Asterisk className="h-3 w-3" />
                  </div>
                  <div className="text-sm font-medium tracking-tight">p0</div>
                </div>
              </div>

              {/* Search and New Chat */}
              <div className="px-4 py-3 space-y-3 shrink-0">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    onClick={() => setShowSearchModal(true)}
                    onFocus={() => setShowSearchModal(true)}
                    className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                  />
                </div>

                <button
                  onClick={createNewChat}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                >
                  <Plus className="h-4 w-4" /> Start New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-3">
                {/* Pinned Chats */}
                <SidebarSection
                  title="PINNED CHATS"
                  icon={<Star className="h-4 w-4" />}
                  isCollapsed={collapsed.pinned}
                  onToggle={() =>
                    setCollapsed((prev) => ({ ...prev, pinned: !prev.pinned }))
                  }
                  count={pinned.length}
                >
                  {pinned.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      data={conv}
                      active={selectedId === conv.id}
                      onSelect={() => onSelect(conv.id)}
                      onTogglePin={() => togglePin(conv.id)}
                      showMeta={true}
                    />
                  ))}
                </SidebarSection>

                {/* Recent Chats */}
                <SidebarSection
                  title="RECENT"
                  icon={<Clock className="h-4 w-4" />}
                  isCollapsed={collapsed.recent}
                  onToggle={() =>
                    setCollapsed((prev) => ({ ...prev, recent: !prev.recent }))
                  }
                  count={recent.length}
                >
                  {recent.map((conv) => (
                    <ConversationRow
                      key={conv.id}
                      data={conv}
                      active={selectedId === conv.id}
                      onSelect={() => onSelect(conv.id)}
                      onTogglePin={() => togglePin(conv.id)}
                      showMeta={true}
                    />
                  ))}
                </SidebarSection>
              </div>
            </div>

            <div className="flex-1 bg-white">
              <ChatPane
                ref={ref}
                conversation={conversation}
                onSend={onSend}
                onEditMessage={onEditMessage}
                onResendMessage={onResendMessage}
                isThinking={isThinking}
                onPauseThinking={onPauseThinking}
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          onCreateFolder={handleCreateFolder}
        />

        <CreateTemplateModal
          isOpen={showCreateTemplateModal}
          onClose={() => {
            setShowCreateTemplateModal(false);
            setEditingTemplate(null);
          }}
          onCreateTemplate={handleCreateTemplate}
          editingTemplate={editingTemplate}
        />

        <SearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          conversations={conversations}
          selectedId={selectedId}
          onSelect={onSelect}
          togglePin={togglePin}
          createNewChat={createNewChat}
        />
      </>
    );
  },
);

export { UnifiedSidebar };
export default UnifiedSidebar;
