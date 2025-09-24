import { useState, useEffect, useMemo } from 'react';
import { useSequenceSelection } from '../context/SequenceSelectionContext';
import type { SequenceInterfaceProps, SequenceData } from '../types';

/**
 * Custom hook to manage sequence interface state and logic
 */
export function useSequenceInterface({
  data,
  callbacks = {},
}: Pick<SequenceInterfaceProps, 'data' | 'callbacks'>) {
  const {
    state,
    setData,
    setHighlightedResidues,
    clearSelection,
  } = useSequenceSelection();

  // Chain selection state
  const [selectedChainIds, setSelectedChainIds] = useState<string[]>([]);

  // Original data (before chain filtering)
  const originalData = data;

  // Filter data to only show selected chains
  const filteredData = useMemo((): SequenceData => {
    if (selectedChainIds.length === 0) {
      return originalData;
    }
    
    return {
      ...originalData,
      chains: originalData.chains.filter(chain => selectedChainIds.includes(chain.id)),
    };
  }, [originalData, selectedChainIds]);

  // Derived state
  const isMultiChain = originalData.chains.length > 1;
  const isLargeStructure = originalData.chains.length > 6;
  const totalResidues = originalData.chains.reduce((sum, chain) => sum + chain.residues.length, 0);

  // Update data when prop changes or chain selection changes
  useEffect(() => {
    setData(filteredData);
  }, [filteredData, setData]);

  // Clear selection when chain selection changes
  useEffect(() => {
    clearSelection();
  }, [selectedChainIds, clearSelection]);

  // No config to update since we use constants

  // Set initial selected chains based on logic:
  // - If > 3 chains, select only the first one
  // - Otherwise, select all chains
  useEffect(() => {
    if (originalData.chains.length > 0 && selectedChainIds.length === 0) {
      if (originalData.chains.length > 3) {
        setSelectedChainIds([originalData.chains[0].id]);
      } else {
        setSelectedChainIds(originalData.chains.map(chain => chain.id));
      }
    }
  }, [originalData.chains, selectedChainIds.length]);

  // Handle chain selection change
  const handleChainSelectionChange = (chainIds: string[]) => {
    setSelectedChainIds(chainIds);
  };

  // Handle highlight change callback
  const handleHighlightChange = (residues: any[]) => {
    if (callbacks.onHighlightChange) {
      callbacks.onHighlightChange(residues);
    }
  };

  return {
    // State
    state,
    selectedChainIds,
    originalData,
    
    // Derived state
    isMultiChain,
    isLargeStructure,
    totalResidues,
    
    // Handlers
    handleChainSelectionChange,
    handleHighlightChange,
    setHighlightedResidues,
    clearSelection,
  };
}