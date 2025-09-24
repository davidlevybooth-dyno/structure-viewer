import React from 'react';
import { ChainSelector } from '../ChainSelector';
import type { SequenceChain } from '../types';

interface ChainControlsProps {
  chains: SequenceChain[];
  selectedChainIds: string[];
  onSelectionChange: (chainIds: string[]) => void;
  isLargeStructure?: boolean;
  totalResidues?: number;
}

export function ChainControls({
  chains,
  selectedChainIds,
  onSelectionChange,
  isLargeStructure = false,
  totalResidues = 0,
}: ChainControlsProps) {
  if (chains.length <= 1) {
    return null;
  }

  return (
    <div className="border-b bg-gray-50 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <ChainSelector
            chains={chains}
            selectedChainIds={selectedChainIds}
            onSelectionChange={onSelectionChange}
          />
        </div>
        <div className="text-xs text-gray-500">
          {selectedChainIds.length} of {chains.length} chains selected
          {chains.length > 6 && (
            <span className="ml-2 text-amber-600">• Large structure detected</span>
          )}
          {totalResidues > 0 && (
            <span className="ml-2">• {totalResidues.toLocaleString()} residues</span>
          )}
        </div>
      </div>
    </div>
  );
}