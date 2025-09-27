'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface DrawerLayoutContextType {
  isDrawerOpen: boolean;
  isDrawerExpanded: boolean;
  drawerWidth: number;
  sidebarWidth: number;
  overlapAmount: number;
  setDrawerState: (open: boolean, expanded: boolean) => void;
}

const DrawerLayoutContext = createContext<DrawerLayoutContextType | null>(null);

export function useDrawerLayout() {
  const context = useContext(DrawerLayoutContext);
  if (!context) {
    throw new Error('useDrawerLayout must be used within a DrawerLayoutProvider');
  }
  return context;
}

interface DrawerLayoutProps {
  children: React.ReactNode;
  drawer: React.ReactNode;
  className?: string;
  sidebarWidth?: number;
  expandedWidth?: number;
  overlapAmount?: number;
}

export function DrawerLayout({
  children,
  drawer,
  className = '',
  sidebarWidth = 64,
  expandedWidth = 400,
  overlapAmount = 32,
}: DrawerLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);

  const setDrawerState = useCallback((open: boolean, expanded: boolean) => {
    console.log('📋 DrawerLayout: Setting state - Open:', open, 'Expanded:', expanded);
    setIsDrawerOpen(open);
    setIsDrawerExpanded(expanded);
  }, []);

  // Calculate main content offset
  const mainContentOffset = isDrawerOpen 
    ? (isDrawerExpanded ? expandedWidth - overlapAmount : sidebarWidth)
    : 0;

  const contextValue: DrawerLayoutContextType = {
    isDrawerOpen,
    isDrawerExpanded,
    drawerWidth: expandedWidth,
    sidebarWidth,
    overlapAmount,
    setDrawerState,
  };

  return (
    <DrawerLayoutContext.Provider value={contextValue}>
      <div className={cn('min-h-screen bg-gray-50 flex', className)}>
        {/* Drawer */}
        {drawer}

        {/* Main Content Area */}
        <div
          className="flex-1 transition-all duration-300 ease-out relative"
          style={{
            marginLeft: mainContentOffset,
          }}
        >
          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>

          {/* Subtle shadow overlay when drawer is expanded */}
          {isDrawerOpen && isDrawerExpanded && (
            <div className="absolute inset-0 bg-black bg-opacity-5 pointer-events-none transition-opacity duration-300" />
          )}
        </div>
      </div>
    </DrawerLayoutContext.Provider>
  );
}

export default DrawerLayout;
