'use client';

import React from 'react';
import { AppLayout } from './layout/AppLayout';
import { ResizableLayout } from './layout/ResizableLayout';
import { ChatContainer } from './chat/ChatContainer';
import { UnifiedSidebar } from './ui/UnifiedSidebar';
import { ProteinViewerControls } from './ui/ProteinViewerControls';
import { ProteinViewer } from './ui/ProteinViewer';
import { INITIAL_CONVERSATIONS, INITIAL_TEMPLATES, INITIAL_FOLDERS } from './ui/mockData';

/**
 * Main AI Assistant interface
 */
export function AIAssistantUI() {
  return (
    <AppLayout>
      <ChatContainer
        initialConversations={INITIAL_CONVERSATIONS}
        initialTemplates={INITIAL_TEMPLATES}
        initialFolders={INITIAL_FOLDERS}
      >
        {(chatProps) => (
          <ResizableLayout
            sidebar={
              <UnifiedSidebar
                ref={chatProps.composerRef}
                collapsed={chatProps.collapsed}
                setCollapsed={chatProps.setCollapsed}
                conversations={chatProps.conversations}
                pinned={chatProps.pinned}
                recent={chatProps.recent}
                folders={chatProps.folders}
                folderCounts={chatProps.folderCounts}
                selectedId={chatProps.selectedId}
                onSelect={chatProps.setSelectedId}
                togglePin={chatProps.togglePin}
                query={chatProps.query}
                setQuery={chatProps.setQuery}
                searchRef={chatProps.searchRef}
                createFolder={() => {}} // TODO: Implement folder creation
                createNewChat={chatProps.createNewChat}
                templates={chatProps.templates}
                setTemplates={chatProps.setTemplates}
                onUseTemplate={chatProps.handleUseTemplate}
                conversation={chatProps.selected}
                onSend={(content: string) => 
                  chatProps.selected && chatProps.sendMessage(chatProps.selected.id, content)
                }
                onEditMessage={(messageId: string, newContent: string) => 
                  chatProps.selected && chatProps.editMessage(chatProps.selected.id, messageId, newContent)
                }
                onResendMessage={(messageId: string) => 
                  chatProps.selected && chatProps.resendMessage(chatProps.selected.id, messageId)
                }
                isThinking={chatProps.isThinking && chatProps.thinkingConvId === chatProps.selected?.id}
                onPauseThinking={chatProps.pauseThinking}
              />
            }
            main={
              <>
                <ProteinViewerControls />
                <ProteinViewer />
              </>
            }
          />
        )}
      </ChatContainer>
    </AppLayout>
  );
}
