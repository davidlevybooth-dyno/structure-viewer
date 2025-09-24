import React from 'react';
import type { SequenceSelection, SelectionRegion } from './types';

interface SelectionSummaryProps {
  selection: SequenceSelection;
  onClearSelection: () => void;
  onRegionAction?: (action: string, region: SelectionRegion) => void;
  readOnly?: boolean;
}

/**
 * Selection summary footer showing selected regions and actions
 */
export function SelectionSummary({
  selection,
  onClearSelection,
  onRegionAction,
  readOnly = false,
}: SelectionSummaryProps) {
  if (selection.regions.length === 0) {
    return null; // No selection, no display
  }

  const totalResidues = selection.regions.reduce((sum, region) => 
    sum + (region.end - region.start + 1), 0
  );

  const handleCopyAllRegions = () => {
    // Sort regions by position before copying
    const sortedRegions = [...selection.regions].sort((a, b) => {
      if (a.chainId !== b.chainId) {
        return a.chainId.localeCompare(b.chainId);
      }
      return a.start - b.start;
    });
    
    const allSequences = sortedRegions.map(r => r.sequence).join('');
    navigator.clipboard.writeText(allSequences).then(() => {
      onRegionAction?.('copy-all', sortedRegions[0]);
    }).catch(console.warn);
  };

  const handleCopyRegion = (region: SelectionRegion) => {
    navigator.clipboard.writeText(region.sequence).then(() => {
      onRegionAction?.('copy', region);
    }).catch(console.warn);
  };

  // Single region display
  if (selection.regions.length === 1) {
    const region = selection.regions[0];
    return (
      <div className="border-t bg-gray-50 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-mono text-gray-700">
              {region.label}: {region.sequence}
            </span>
            <span className="text-xs text-gray-500">
              ({totalResidues} residue{totalResidues !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Single region actions */}
          {!readOnly && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopyRegion(region)}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                title="Copy sequence"
              >
                Copy
              </button>
              <button
                onClick={onClearSelection}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                title="Clear selection"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Multiple regions display - show each region separately like single region format
  // Sort regions by position for logical display
  const sortedRegions = [...selection.regions].sort((a, b) => {
    // First sort by chain ID, then by start position
    if (a.chainId !== b.chainId) {
      return a.chainId.localeCompare(b.chainId);
    }
    return a.start - b.start;
  });

  return (
    <div className="border-t bg-gray-50 px-6 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex flex-wrap items-center gap-3">
            {sortedRegions.map((region, index) => (
              <span key={region.id} className="text-sm font-mono text-gray-700">
                {region.label}: {region.sequence}
                {index < sortedRegions.length - 1 && <span className="text-gray-400 ml-2">|</span>}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500">
            ({selection.regions.length} region{selection.regions.length !== 1 ? 's' : ''}, {totalResidues} residue{totalResidues !== 1 ? 's' : ''})
          </span>
        </div>

        {/* Multiple regions actions */}
        {!readOnly && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyAllRegions}
              className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
              title="Copy all sequences concatenated"
            >
              Copy All
            </button>
            <button
              onClick={onClearSelection}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
              title="Clear all selections"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
