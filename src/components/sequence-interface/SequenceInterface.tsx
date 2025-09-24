'use client';

import React, { useEffect } from 'react';
import { SequenceSelectionProvider, useSequenceSelection } from './context/SequenceSelectionContext';
import type { SequenceInterfaceProps } from './types';
import { ResidueGrid } from './ResidueGrid';
import { SelectionSummary } from './SelectionSummary';
import { DEFAULT_SEQUENCE_CONFIG } from '@/config/sequence-interface';

// Internal component that uses the context
function SequenceInterfaceInternal({
  data,
  initialConfig = {},
  callbacks = {},
  className = '',
  readOnly = false,
}: SequenceInterfaceProps) {
  const {
    state,
    setData,
    updateConfig,
    setHighlightedResidues,
    clearSelection,
  } = useSequenceSelection();

  // Update data when prop changes
  useEffect(() => {
    setData(data);
  }, [data, setData]);

  // Update config when initialConfig changes, merging with defaults
  useEffect(() => {
    const mergedConfig = { ...DEFAULT_SEQUENCE_CONFIG, ...initialConfig };
    updateConfig(mergedConfig);
  }, [initialConfig, updateConfig]);

  // Trigger callbacks when state changes
  useEffect(() => {
    callbacks.onSelectionChange?.(state.selection);
  }, [state.selection, callbacks]);

  useEffect(() => {
    callbacks.onHighlightChange?.(state.highlightedResidues);
  }, [state.highlightedResidues, callbacks]);

  // Handle copy/paste operations
  const handleCopy = (sequence: string, region: any) => {
    navigator.clipboard.writeText(sequence).then(() => {
      callbacks.onSequenceCopy?.(sequence, region);
    }).catch(console.warn);
  };

  const handlePaste = async (position?: { chainId: string; position: number }) => {
    try {
      const text = await navigator.clipboard.readText();
      callbacks.onSequencePaste?.(text, position);
    } catch (error) {
      console.warn('Failed to read from clipboard:', error);
    }
  };

  if (state.isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sequence...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`p-8 text-center text-red-600 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Sequence</h3>
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      </div>
    );
  }

  if (!state.data.chains.length) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sequence Data</h3>
          <p className="text-sm text-gray-600">Load a structure to view sequence interface</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`sequence-interface bg-white ${className}`}>
      {/* Minimal header */}
      <div className="border-b bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-800">
              {state.data.name || state.data.id}
            </h2>
            {state.data.metadata && (
              <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
                {state.data.metadata.organism && (
                  <span>{state.data.metadata.organism}</span>
                )}
                {state.data.metadata.method && (
                  <span>• {state.data.metadata.method}</span>
                )}
                {state.data.metadata.resolution && (
                  <span>• {state.data.metadata.resolution}Å</span>
                )}
              </div>
            )}
          </div>
          
          {/* Selection mode indicator */}
          {!readOnly && (
            <div className="text-xs text-gray-400 font-mono">
              {state.selection.regions.length === 0 
                ? "Click and drag to select • Hold Shift to add regions"
                : `${state.selection.regions.length} region${state.selection.regions.length !== 1 ? 's' : ''} selected • Hold Shift to add more`
              }
            </div>
          )}
        </div>
      </div>

      {/* Main sequence grid */}
      <div className="w-full">
        <ResidueGrid
          data={state.data}
          config={state.config}
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

/**
 * SequenceInterface - Interactive sequence visualization and manipulation component
 * 
 * Features:
 * - Multi-region selection with visual feedback
 * - Copy/paste sequence functionality
 * - Multiple color schemes based on amino acid properties
 * - Configurable layout and display options
 * - Context-based state management with localStorage persistence
 * - Standalone component library architecture
 */
export function SequenceInterface(props: SequenceInterfaceProps) {
  return (
    <SequenceSelectionProvider>
      <SequenceInterfaceInternal {...props} />
    </SequenceSelectionProvider>
  );
}

export default SequenceInterface;
