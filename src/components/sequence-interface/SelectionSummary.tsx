import React from 'react';
import type { SequenceSelection, SelectionRegion, RegionAction } from './types';

interface SelectionSummaryProps {
  selection: SequenceSelection;
  onClearSelection: () => void;
  onRegionAction?: (region: SelectionRegion | null, action: RegionAction) => void;
  onCopy?: (text: string) => Promise<void>;
  readOnly?: boolean;
}

// Helper to sort regions consistently
const sortRegions = (regions: SelectionRegion[]) =>
  [...regions].sort((a, b) => 
    a.chainId === b.chainId ? a.start - b.start : a.chainId.localeCompare(b.chainId)
  );

/**
 * Selection summary footer showing selected regions and actions
 */
export function SelectionSummary({
  selection,
  onClearSelection,
  onRegionAction,
  onCopy,
  readOnly = false,
}: SelectionSummaryProps) {
  if (selection.regions.length === 0) {
    return null; // No selection, no display
  }

  const totalResidues = selection.regions.reduce((sum, region) => 
    sum + (region.end - region.start + 1), 0
  );

  const handleCopyAllRegions = async () => {
    const sorted = sortRegions(selection.regions);
    const allSequences = sorted.map(r => r.sequence).join('');
    try {
      await onCopy?.(allSequences);
      onRegionAction?.(null, 'copy'); // null indicates "all regions"
    } catch (error) {
      console.warn('Failed to copy:', error);
    }
  };

  const handleCopyRegion = async (region: SelectionRegion) => {
    try {
      await onCopy?.(region.sequence);
      onRegionAction?.(region, 'copy');
    } catch (error) {
      console.warn('Failed to copy:', error);
    }
  };

  // Single region display
  if (selection.regions.length === 1) {
    const region = selection.regions[0];
    return (
      <div className="border-t bg-gray-50 px-6 py-2 mb-8">
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Single sequence display - takes up 9 columns with more breathing room */}
          <div className="col-span-9 min-w-0 max-w-none">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-mono text-gray-700 break-words">
                {region.label}: {region.sequence}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                ({totalResidues} residue{totalResidues !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {/* Single region actions - takes up 3 columns */}
          {!readOnly && (
            <div className="col-span-3 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleCopyRegion(region)}
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-50 whitespace-nowrap"
                title="Copy sequence"
              >
                Copy
              </button>
              <button
                onClick={onClearSelection}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50 whitespace-nowrap"
                title="Clear selection"
              >
                Clear
              </button>
            </div>
          )}
          
          {/* Spacer when readOnly */}
          {readOnly && <div className="col-span-3"></div>}
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
    <div className="border-t bg-gray-50 px-6 py-4 mb-8">
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Sequence display - takes up 9 columns with more breathing room */}
        <div className="col-span-9 min-w-0 max-w-none">
          <div className="flex flex-wrap items-start gap-2 mb-2 leading-relaxed">
            {sortedRegions.map((region, index) => (
              <span key={region.id} className="text-sm font-mono text-gray-700 break-words inline-block">
                <span className="font-medium">{region.label}:</span>
                <span className="ml-1">{region.sequence}</span>
                {index < sortedRegions.length - 1 && <span className="text-gray-400 ml-2">|</span>}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            {selection.regions.length} region{selection.regions.length !== 1 ? 's' : ''}, {totalResidues} residue{totalResidues !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Actions - takes up 3 columns, positioned at absolute right */}
        {!readOnly && (
          <div className="col-span-3 flex items-start justify-end space-x-2 pt-0.5">
            <button
              onClick={handleCopyAllRegions}
              className="text-xs text-gray-600 hover:text-blue-600 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-50 whitespace-nowrap"
              title="Copy all sequences concatenated"
            >
              Copy All
            </button>
            <button
              onClick={onClearSelection}
              className="text-xs text-gray-600 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50 whitespace-nowrap"
              title="Clear all selections"
            >
              Clear
            </button>
          </div>
        )}
        
        {/* Spacer when readOnly */}
        {readOnly && <div className="col-span-3"></div>}
      </div>
    </div>
  );
}
