'use client';

import { useState, useCallback } from 'react';
import MolstarViewer from '@/components/MolstarViewer';
import { SequenceViewer } from '@/components/SequenceViewer';
import { SlidingSidebar } from '@/components/ui/SlidingSidebar';
import { StructureLoader } from '@/components/ui/StructureLoader';
import { AgentPlaceholder } from '@/components/ui/AgentPlaceholder';
import { AppHeader } from '@/components/ui/AppHeader';
import type { SelectionRegion, SequenceResidue, SequenceSelection } from '@/components/sequence-interface/types';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

export default function Home() {
  const [pdbId, setPdbId] = useState('1CRN');
  const [isViewerReady, setIsViewerReady] = useState(false);

  // State for bidirectional highlighting
  const [selectedRegions, setSelectedRegions] = useState<SelectionRegion[]>([]);
  const [hoveredResidues, setHoveredResidues] = useState<SequenceResidue[]>([]);

  const handleViewerReady = (plugin: PluginUIContext) => {
    setIsViewerReady(true);
  };

  const handleStructureLoaded = (loadedPdbId: string) => {
    // Structure loaded successfully - sequence data will be fetched automatically
  };

  const handleError = (error: unknown) => {
    console.error('Structure loading error:', error);
  };

  const handleLoadStructure = (newPdbId: string) => {
    if (newPdbId.trim()) {
      setPdbId(newPdbId.trim().toUpperCase());
    }
  };

  // Stable callbacks to prevent infinite re-renders
  const handleStructureSelectionChange = useCallback((regions: SelectionRegion[]) => {
    // TODO: Implement structure → sequence highlighting when bidirectional support is ready
  }, []);

  const handleSequenceSelectionChange = useCallback((selection: SequenceSelection) => {
    setSelectedRegions(selection.regions);
  }, []);

  const handleHighlightChange = useCallback((residues: SequenceResidue[]) => {
    setHoveredResidues(residues);
  }, []);

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
              selectedRegions={selectedRegions}
              hoveredResidues={hoveredResidues}
              onStructureSelectionChange={handleStructureSelectionChange}
            />
          </div>
          
          
          {/* Sequence Viewer */}
          <SequenceViewer 
            pdbId={pdbId}
            onSelectionChange={handleSequenceSelectionChange}
            onHighlightChange={handleHighlightChange}
          />
        </div>
      </div>
    </div>
  );
}