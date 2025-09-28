import React from 'react';
import { SequenceInterface } from '@/components/sequence-interface';
import { usePDBSequence } from '@/hooks/use-pdb-sequence';

interface SequenceViewerProps {
  pdbId: string;
  className?: string;
  onSelectionChange?: (selection: any) => void;
  onHighlightChange?: (residues: any[]) => void;
  selectedChainIds?: string[];
  onChainSelectionChange?: (chainIds: string[]) => void;
}

export function SequenceViewer({
  pdbId,
  className = '',
  onSelectionChange,
  onHighlightChange,
  selectedChainIds,
  onChainSelectionChange,
}: SequenceViewerProps) {
  const { data: sequenceData, isLoading: isSequenceLoading, error: sequenceError } = usePDBSequence(pdbId);

  if (sequenceError) {
    return (
      <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
        <div className="p-6 text-center">
          <div className="text-red-600 mb-2">Failed to load sequence data</div>
          <div className="text-sm text-gray-500">{sequenceError}</div>
        </div>
      </div>
    );
  }

  if (isSequenceLoading) {
    return (
      <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading sequence data from PDB...</div>
        </div>
      </div>
    );
  }

  if (!sequenceData) {
    return (
      <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
        <div className="p-6 text-center text-gray-500">
          No sequence data available
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <SequenceInterface 
        data={sequenceData}
        selectedChainIds={selectedChainIds}
        onChainSelectionChange={onChainSelectionChange}
        callbacks={{
          onSelectionChange,
          onHighlightChange,
        }}
        className="min-h-96"
      />
    </div>
  );
}

export default SequenceViewer;
