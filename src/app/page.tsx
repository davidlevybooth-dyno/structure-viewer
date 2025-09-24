'use client';

import { useState } from 'react';
import MolstarViewer from '@/components/MolstarViewer';
import { SequenceInterface } from '@/components/sequence-interface';
import { usePDBSequence } from '@/hooks/use-pdb-sequence';
import { SlidingSidebar } from '@/components/ui/SlidingSidebar';
import { StructureLoader } from '@/components/ui/StructureLoader';
import { AgentPlaceholder } from '@/components/ui/AgentPlaceholder';
import { AppHeader } from '@/components/ui/AppHeader';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

export default function Home() {
  const [pdbId, setPdbId] = useState('1CRN');
  const [inputValue, setInputValue] = useState('1CRN');
  const [isViewerReady, setIsViewerReady] = useState(false);

  const { data: sequenceData, isLoading: isSequenceLoading, error: sequenceError } = usePDBSequence(pdbId, {
    onDataLoaded: (data) => {
      console.log('PDB sequence data loaded:', data);
    },
    onError: (error) => {
      console.error('Failed to load PDB sequence data:', error);
    },
  });

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

  const handleLoadStructure = () => {
    if (inputValue.trim()) {
      setPdbId(inputValue.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sliding Sidebar */}
      <SlidingSidebar>
        <StructureLoader
          inputValue={inputValue}
          onInputChange={setInputValue}
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
          
          {/* Sequence Interface */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {sequenceError ? (
              <div className="p-6 text-center">
                <div className="text-red-600 mb-2">Failed to load sequence data</div>
                <div className="text-sm text-gray-500">{sequenceError}</div>
              </div>
            ) : isSequenceLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600">Loading sequence data from PDB...</div>
              </div>
            ) : sequenceData ? (
              <SequenceInterface 
                data={sequenceData}
                initialConfig={{
                  colorScheme: 'default',
                  showChainLabels: true,
                }}
                callbacks={{
                  onSelectionChange: (selection) => {
                    console.log('Selection changed:', selection);
                    // TODO: Update structure highlighting
                  },
                  onHighlightChange: (residues) => {
                    console.log('Highlight changed:', residues);
                    // TODO: Update structure hover highlighting
                  },
                  onSequenceCopy: (sequence, region) => {
                    console.log('Sequence copied:', sequence, region);
                  },
                  onRegionAction: (action, region) => {
                    console.log('Region action:', action, region);
                  },
                }}
                className="min-h-96"
              />
            ) : (
              <div className="p-6 text-center text-gray-500">
                No sequence data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}