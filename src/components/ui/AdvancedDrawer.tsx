'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useDrawerLayout } from './DrawerLayout';

interface DrawerSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  defaultExpanded?: boolean;
}

interface AdvancedDrawerProps {
  sections: DrawerSection[];
  className?: string;
  defaultOpen?: boolean;
  sidebarWidth?: number;
  expandedWidth?: number;
  overlapAmount?: number;
}

export function AdvancedDrawer({
  sections,
  className = '',
  defaultOpen = true,
  sidebarWidth = 64, // Narrow sidebar width
  expandedWidth = 400, // Full drawer width
  overlapAmount = 32, // How much drawer overlaps main content
}: AdvancedDrawerProps) {
  const { isDrawerOpen, isDrawerExpanded, setDrawerState } = useDrawerLayout();
  const [activeSection, setActiveSection] = useState<string | null>(
    sections.length > 0 ? sections[0].id : null
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.filter(s => s.defaultExpanded).map(s => s.id))
  );

  // Initialize drawer state on mount
  useEffect(() => {
    console.log('🚀 Initializing drawer - defaultOpen:', defaultOpen);
    setDrawerState(defaultOpen, false);
  }, [defaultOpen, setDrawerState]);

  // Use layout state instead of local state
  const isOpen = isDrawerOpen;
  const isExpanded = isDrawerExpanded;

  // Handle section expansion in sidebar
  const toggleSectionExpansion = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleDrawerCollapse = useCallback(() => {
    console.log('🔒 Collapsing drawer');
    setDrawerState(isOpen, false);
  }, [isOpen, setDrawerState]);

  const handleDrawerToggle = useCallback(() => {
    console.log('🔄 Toggling drawer - Current open:', isOpen);
    setDrawerState(!isOpen, false);
  }, [isOpen, setDrawerState]);

  // Handle section selection in expanded mode
  const handleSectionSelect = useCallback((sectionId: string) => {
    console.log('🎯 Section selected:', sectionId, 'Current expanded:', isExpanded);
    setActiveSection(sectionId);
    if (!isExpanded) {
      console.log('🚀 Expanding drawer...');
      setDrawerState(isOpen, true);
    }
  }, [isExpanded, isOpen, setDrawerState]);

  // Get active section content
  const activeSectionData = sections.find(s => s.id === activeSection);

  return (
    <>
      {/* Main Drawer Container */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex bg-white shadow-xl transition-all duration-300 ease-out',
          className
        )}
        style={{
          width: isExpanded ? expandedWidth : sidebarWidth,
        }}
        onTransitionEnd={() => console.log('🎨 Drawer transition ended - Width:', isExpanded ? expandedWidth : sidebarWidth)}
      >
        {/* Sidebar (Always Visible) */}
        <div
          className="flex flex-col bg-gray-900 text-white"
          style={{ width: sidebarWidth }}
        >
          {/* Header */}
          <div className="flex items-center justify-center h-16 border-b border-gray-700">
            <button
              onClick={handleDrawerToggle}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
              aria-label={isOpen ? 'Close drawer' : 'Open drawer'}
            >
              {isOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-2 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section.id)}
                className={cn(
                  'w-full p-3 rounded-lg transition-all duration-200 group relative',
                  'hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500',
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                )}
                title={section.title}
              >
                <div className="flex flex-col items-center space-y-1">
                  {section.icon && (
                    <div className="w-5 h-5 flex items-center justify-center">
                      {section.icon}
                    </div>
                  )}
                  <span className="text-[10px] font-medium truncate w-full text-center leading-tight">
                    {section.title}
                  </span>
                </div>

                {/* Active indicator */}
                {activeSection === section.id && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                )}
              </button>
            ))}
          </nav>

        </div>

        {/* Expanded Content Panel */}
        <div
          className={cn(
            'flex-1 bg-white border-l border-gray-200 transition-all duration-300 ease-out',
            isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
          )}
        >
          {activeSectionData && (
            <div className="h-full flex flex-col">
              {/* Section Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeSectionData.title}
                </h2>
                <button
                  onClick={handleDrawerCollapse}
                  className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                  aria-label="Collapse drawer"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Section Content */}
              <div className="flex-1 overflow-y-auto">
                {activeSectionData.content}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={handleDrawerCollapse}
        />
      )}
    </>
  );
}

export default AdvancedDrawer;
