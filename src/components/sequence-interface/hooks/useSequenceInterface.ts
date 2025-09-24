import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSequenceSelection } from '../context/SequenceSelectionContext';
import type { SequenceInterfaceProps, SequenceData } from '../types';

/**
 * Custom hook to manage sequence interface state and logic
 */
export function useSequenceInterface({
  data,
  callbacks,
  readOnly,
}: Pick<SequenceInterfaceProps, 'data' | 'callbacks' | 'readOnly'>) {
  const {
    state,
    setData,
    setHighlightedResidues,
    clearSelection,
    copyToClipboard,
  } = useSequenceSelection();

  // Chain selection state
  const [selectedChainIds, setSelectedChainIds] = useState<string[]>([]);

  // Always ensure data is properly initialized to prevent undefined access
  const safeData = useMemo((): SequenceData => ({
    id: data.id || '',
    name: data.name || '',
    chains: data.chains || [],
    metadata: data.metadata,
  }), [data]);

  // Filter data to only show selected chains (single source of truth)
  const viewData = useMemo((): SequenceData => {
    if (selectedChainIds.length === 0) {
      return safeData;
    }
    
    return {
      ...safeData,
      chains: safeData.chains.filter(chain => selectedChainIds.includes(chain.id)),
    };
  }, [safeData, selectedChainIds]);

  // Derived state (memoized for performance)
  const derivedState = useMemo(() => ({
    isMultiChain: safeData.chains.length > 1,
    isLargeStructure: safeData.chains.length > 6,
    totalResidues: safeData.chains.reduce((sum, chain) => sum + chain.residues.length, 0),
  }), [safeData.chains]);

  // Update data when prop changes or chain selection changes
  useEffect(() => {
    setData(viewData);
  }, [viewData, setData]);

  // Clear selection when chain selection changes
  useEffect(() => {
    clearSelection();
  }, [selectedChainIds, clearSelection]);

  // Set initial selected chains based on logic:
  // - If > 3 chains, select only the first one
  // - Otherwise, select all chains
  useEffect(() => {
    if (safeData.chains.length > 0 && selectedChainIds.length === 0) {
      if (safeData.chains.length > 3) {
        setSelectedChainIds([safeData.chains[0].id]);
      } else {
        setSelectedChainIds(safeData.chains.map(chain => chain.id));
      }
    }
  }, [safeData.chains, selectedChainIds.length]);

  // Stable callbacks (memoized to prevent child re-renders)
  const handleChainSelectionChange = useCallback((chainIds: string[]) => {
    setSelectedChainIds(chainIds);
  }, []);

  const handleHighlightChange = useCallback((residues: any[]) => {
    callbacks?.onHighlightChange?.(residues);
  }, [callbacks]);

  // Trigger onSelectionChange callback when selection state changes
  useEffect(() => {
    callbacks?.onSelectionChange?.(state.selection);
  }, [state.selection, callbacks]);

  return {
    // State (single source of truth)
    state,
    selectedChainIds,
    originalData: safeData, // Unfiltered data for ChainControls
    
    // Derived state (memoized)
    ...derivedState,
    
    // Stable handlers
    handleChainSelectionChange,
    handleHighlightChange,
    setHighlightedResidues,
    clearSelection,
    copyToClipboard,
  };
}