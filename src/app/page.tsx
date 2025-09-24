'use client';

import { useState } from 'react';
import MolstarViewer from '@/components/MolstarViewer';
import { SequenceViewer } from '@/components/SequenceViewer';
import { SlidingSidebar } from '@/components/ui/SlidingSidebar';
import { StructureLoader } from '@/components/ui/StructureLoader';
import { AgentPlaceholder } from '@/components/ui/AgentPlaceholder';
import { AppHeader } from '@/components/ui/AppHeader';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

export default function Home() {
  const [pdbId, setPdbId] = useState('7MT0');
  const [isViewerReady, setIsViewerReady] = useState(false);

  const handleViewerReady = (plugin: PluginUIContext) => {
    setIsViewerReady(true);
  };

  const handleStructureLoaded = (loadedPdbId: string) => {
    console.log('Structure loaded:', loadedPdbId);
    // The sequence extraction will be triggered automatically by the useMolstarSequence hook
    // when it detects the structure change
  };

  const handleError = (error: string) => {
    // Error handling could be enhanced with user notifications
  };

  const handleLoadStructure = (newPdbId: string) => {
    if (newPdbId.trim()) {
      setPdbId(newPdbId.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sliding Sidebar */}
      <SlidingSidebar>
        <StructureLoader
          initialValue={pdbId}
          onLoadStructure={handleLoadStructure}
          isViewerReady={isViewerReady}
          currentPdbId={pdbId}
        />
        <AgentPlaceholder />
      </SlidingSidebar>

      {/* Header */}
      <AppHeader isViewerReady={isViewerReady} />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Molstar Viewer */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <MolstarViewer
              pdbId={pdbId}
              className="h-96"
              onReady={handleViewerReady}
              onStructureLoaded={handleStructureLoaded}
              onError={handleError}
            />
          </div>
          
          {/* Sequence Viewer */}
          <SequenceViewer 
            pdbId={pdbId}
            onSelectionChange={(selection) => {
              console.log('Selection changed:', selection);
              // TODO: Update structure highlighting
            }}
            onHighlightChange={(residues) => {
              console.log('Highlight changed:', residues);
              // TODO: Update structure hover highlighting
            }}
          />
        </div>
      </div>
    </div>
  );
}