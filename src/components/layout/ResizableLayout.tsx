'use client';

import React from 'react';
import { Panel, PanelGroup } from 'react-resizable-panels';
import { CustomResizeHandle } from '../ui/layout/CustomResizeHandle';
import { usePanelResize } from '../../hooks/usePanelResize';

interface ResizableLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  defaultSizes?: [number, number];
  minSize?: number;
  maxSize?: number;
}
/**
 * Resizable two-panel layout with persistence
 */
export function ResizableLayout({ 
  sidebar, 
  main, 
  defaultSizes = [30, 70],
  minSize = 20,
  maxSize = 60 
}: ResizableLayoutProps) {
  const { panelSizes, handleResize, constraints } = usePanelResize({
    defaultSizes,
    minSize,
    maxSize,
  });

  return (
    <PanelGroup 
      direction="horizontal" 
      onLayout={handleResize}
      id="main-layout-panels"
    >
      <Panel 
        defaultSize={panelSizes[0]} 
        minSize={constraints.minSize} 
        maxSize={constraints.maxSize}
        className="flex"
        id="sidebar-panel"
      >
        {sidebar}
      </Panel>

      <CustomResizeHandle />

      <Panel 
        className="flex flex-col"
        id="main-panel"
      >
        {main}
      </Panel>
    </PanelGroup>
  );
}
