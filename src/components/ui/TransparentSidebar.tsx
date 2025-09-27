'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '../../lib/utils';

interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
  expandable?: boolean;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  onClick?: () => void;
  active?: boolean;
}

interface TransparentSidebarProps {
  children?: React.ReactNode;
  className?: string;
  onItemClick?: (itemId: string) => void;
}

export function TransparentSidebar({ 
  children, 
  className = '',
  onItemClick 
}: TransparentSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('structures');
  const theme = useTheme();

  const sidebarSections: SidebarSection[] = [
    {
      id: 'navigation',
      title: 'Navigation',
      items: [
        { id: 'structures', label: 'Structures', icon: '🧬' },
        { id: 'sequences', label: 'Sequences', icon: '🧵' },
        { id: 'analysis', label: 'Analysis', icon: '📊' }
      ]
    },
    {
      id: 'tools',
      title: 'Tools',
      items: [
        { id: 'isolation', label: 'Isolation', icon: '✂️' },
        { id: 'highlighting', label: 'Highlighting', icon: '🖍️' },
        { id: 'export', label: 'Export', icon: '📥' }
      ]
    },
    {
      id: 'ai',
      title: 'AI Assistant',
      expandable: true,
      items: [
        { id: 'chat', label: 'Chat', icon: '💬' },
        { id: 'suggestions', label: 'Suggestions', icon: '💡' }
      ]
    }
  ];

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    onItemClick?.(itemId);
    
    // Expand for AI chat
    if (itemId === 'chat') {
      setIsExpanded(true);
    }
  };

  return (
    <>
      {/* Transparent Sidebar */}
      <motion.div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex',
          className
        )}
        style={{
          width: isExpanded ? theme.spacing.sidebar.expandedWidth : theme.spacing.sidebar.width,
        }}
        initial={false}
        animate={{
          width: isExpanded ? theme.spacing.sidebar.expandedWidth : theme.spacing.sidebar.width,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Main Sidebar */}
        <div
          className="h-full backdrop-blur-md border-r border-white/10 flex flex-col"
          style={{
            background: theme.colors.sidebar.background,
            backdropFilter: theme.effects.blur.sidebar,
            boxShadow: theme.effects.shadows.sidebar,
            width: theme.spacing.sidebar.width,
          }}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <h2 
              className="font-semibold tracking-wide"
              style={{ 
                color: theme.colors.sidebar.text,
                fontSize: theme.typography.sidebar.sectionTitle.fontSize,
                fontWeight: theme.typography.sidebar.sectionTitle.fontWeight,
              }}
            >
              Dyno
            </h2>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 overflow-y-auto p-2">
            {sidebarSections.map((section, sectionIndex) => (
              <div key={section.id} className="mb-6">
                {/* Section Title */}
                <div className="px-3 mb-2">
                  <h3 
                    className="uppercase tracking-wider"
                    style={{
                      color: theme.colors.sidebar.textMuted,
                      fontSize: '0.75rem',
                      fontWeight: '600',
                    }}
                  >
                    {section.title}
                  </h3>
                </div>

                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      className={cn(
                        'w-full flex items-center justify-start h-10 px-3 text-left transition-all duration-200 rounded-lg',
                        activeItem === item.id 
                          ? 'bg-blue-500/20 text-blue-400 border-r-2 border-blue-400' 
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      )}
                      onClick={() => handleItemClick(item.id)}
                    >
                      <span className="text-lg mr-3">{item.icon}</span>
                      <span 
                        style={{
                          fontSize: theme.typography.sidebar.menuItem.fontSize,
                          fontWeight: theme.typography.sidebar.menuItem.fontWeight,
                        }}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Divider */}
                {sectionIndex < sidebarSections.length - 1 && (
                  <div className="mt-4 h-px bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expanded Content Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="flex-1 h-full backdrop-blur-sm border-r border-white/5"
              style={{
                background: theme.colors.chat.background,
                backdropFilter: theme.effects.blur.backdrop,
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Panel Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 
                  className="font-semibold"
                  style={{ color: theme.colors.sidebar.text }}
                >
                  AI Assistant
                </h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
