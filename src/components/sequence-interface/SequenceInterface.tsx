'use client';

import React from 'react';
import { SequenceSelectionProvider } from './context/SequenceSelectionContext';
import { ResidueGrid } from './ResidueGrid';
import { SelectionSummary } from './SelectionSummary';
import { SequenceHeader } from './components/SequenceHeader';
import { ChainControls } from './components/ChainControls';
import { ErrorState, EmptyState, LoadingState } from './components/ErrorStates';
import { useSequenceInterface } from './hooks/useSequenceInterface';
import type { SequenceInterfaceProps } from './types';

function SequenceInterfaceInternal(props: SequenceInterfaceProps) {
  const {
    className = '',
    readOnly = false,
    callbacks = {},
  } = props;

  const {
    state,
    selectedChainIds,
    originalData,
    isMultiChain,
    isLargeStructure,
    totalResidues,
    
    handleChainSelectionChange,
    handleHighlightChange,
    clearSelection,
  } = useSequenceInterface(props);

  // Loading state
  if (state.isLoading) {
    return <LoadingState className={className} />;
  }

  // Error state
  if (state.error) {
    return <ErrorState error={state.error} className={className} />;
  }

  // Empty state
  if (!state.data.chains.length) {
    return <EmptyState className={className} />;
  }

  return (
    <div className={`sequence-interface bg-white ${className}`}>
      {/* Header */}
      <SequenceHeader 
        data={state.data} 
        selection={state.selection} 
        readOnly={readOnly} 
      />

      {/* Chain controls for multi-chain structures */}
      {isMultiChain && (
        <ChainControls
          chains={originalData.chains}
          selectedChainIds={selectedChainIds}
          onSelectionChange={handleChainSelectionChange}
          isLargeStructure={isLargeStructure}
          totalResidues={totalResidues}
        />
      )}

      {/* Main sequence grid */}
      <div className="w-full">
        <ResidueGrid
          data={state.data}
          selection={state.selection}
          highlightedResidues={state.highlightedResidues}
          readOnly={readOnly}
        />
      </div>

      {/* Selection summary footer */}
      {state.selection.regions.length > 0 && (
        <SelectionSummary
          selection={state.selection}
          onClearSelection={clearSelection}
          onRegionAction={callbacks.onRegionAction}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

export function SequenceInterface(props: SequenceInterfaceProps) {
  return (
    <SequenceSelectionProvider>
      <SequenceInterfaceInternal {...props} />
    </SequenceSelectionProvider>
  );
}