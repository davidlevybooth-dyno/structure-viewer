'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Button, 
  Divider, 
  Card, 
  CardBody,
  Chip,
  Tooltip
} from '@heroui/react';
import { useTheme } from 'next-themes';

interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
  expandable?: boolean;
}

interface SidebarItem {
  id: string;
  label: string;
  description?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string;
}

interface ProfessionalSidebarProps {
  children?: React.ReactNode;
  className?: string;
  onItemClick?: (itemId: string) => void;
}

export function ProfessionalSidebar({ 
  children, 
  className = '',
  onItemClick 
}: ProfessionalSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeItem, setActiveItem] = useState<string>('structures');
  const { theme } = useTheme();

  const sidebarSections: SidebarSection[] = [
    {
      id: 'navigation',
      title: 'Navigation',
      items: [
        { 
          id: 'structures', 
          label: 'Structures', 
          description: 'Load and manage molecular structures',
          badge: 'PDB'
        },
        { 
          id: 'sequences', 
          label: 'Sequences', 
          description: 'View and analyze protein sequences'
        },
        { 
          id: 'analysis', 
          label: 'Analysis', 
          description: 'Structural analysis tools'
        }
      ]
    },
    {
      id: 'tools',
      title: 'Tools',
      items: [
        { 
          id: 'isolation', 
          label: 'Isolation', 
          description: 'Isolate chains and regions'
        },
        { 
          id: 'highlighting', 
          label: 'Highlighting', 
          description: 'Highlight structural features'
        },
        { 
          id: 'export', 
          label: 'Export', 
          description: 'Export data and images'
        }
      ]
    },
    {
      id: 'ai',
      title: 'AI Assistant',
      expandable: true,
      items: [
        { 
          id: 'chat', 
          label: 'Chat', 
          description: 'AI-powered structure analysis',
          badge: 'Beta'
        },
        { 
          id: 'suggestions', 
          label: 'Suggestions', 
          description: 'Intelligent recommendations'
        }
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

  const sidebarWidth = 280;
  const expandedWidth = 400;

  return (
    <>
      {/* Main Sidebar */}
      <motion.div
        className={`fixed inset-y-0 left-0 z-50 flex ${className}`}
        style={{
          width: isExpanded ? expandedWidth : sidebarWidth,
        }}
        initial={false}
        animate={{
          width: isExpanded ? expandedWidth : sidebarWidth,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Sidebar Panel */}
        <div
          className="h-full backdrop-blur-xl border-r border-divider flex flex-col bg-background/80"
          style={{ width: sidebarWidth }}
        >
          {/* Header */}
          <div className="p-6 border-b border-divider">
            <h2 className="text-xl font-semibold text-foreground">
              Dyno Structure
            </h2>
            <p className="text-sm text-foreground-500 mt-1">
              Molecular Visualization Platform
            </p>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {sidebarSections.map((section, sectionIndex) => (
              <div key={section.id}>
                {/* Section Title */}
                <div className="mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-400 px-2">
                    {section.title}
                  </h3>
                </div>

                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Tooltip
                      key={item.id}
                      content={item.description}
                      placement="right"
                      delay={500}
                    >
                      <Button
                        variant={activeItem === item.id ? 'flat' : 'light'}
                        className={`w-full justify-start h-auto p-3 ${
                          activeItem === item.id 
                            ? 'bg-primary/10 text-primary border-r-2 border-primary' 
                            : 'text-foreground-600 hover:bg-default-100'
                        }`}
                        onClick={() => handleItemClick(item.id)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-sm">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="text-xs text-foreground-400 mt-0.5">
                                {item.description}
                              </span>
                            )}
                          </div>
                          {item.badge && (
                            <Chip 
                              size="sm" 
                              variant="flat" 
                              color="primary"
                              className="text-xs"
                            >
                              {item.badge}
                            </Chip>
                          )}
                        </div>
                      </Button>
                    </Tooltip>
                  ))}
                </div>

                {/* Divider */}
                {sectionIndex < sidebarSections.length - 1 && (
                  <Divider className="mt-4" />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-divider">
            <div className="text-xs text-foreground-400 text-center">
              Powered by Mol* & AI
            </div>
          </div>
        </div>

        {/* Expanded Content Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="flex-1 h-full backdrop-blur-sm border-r border-divider bg-background/60"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Panel Header */}
              <div className="p-4 border-b border-divider flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    AI Assistant
                  </h3>
                  <p className="text-sm text-foreground-500">
                    Intelligent molecular analysis
                  </p>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="text-foreground-400 hover:text-foreground"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
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
