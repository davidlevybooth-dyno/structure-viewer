import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSequenceSelection } from './context/SequenceSelectionContext';
import { getResidueColor, getResidueInfo } from '@/lib/amino-acid-colors';
import type {
  SequenceData,
  SequenceSelection,
  SequenceResidue,
  SelectionRegion,
} from './types';

// Constants - these are hardcoded values that don't need to be configurable
const DEFAULT_RESIDUES_PER_ROW = 40;
const SHOW_CHAIN_LABELS = true;
const SHOW_POSITIONS = true;
const DEFAULT_COLOR_SCHEME = 'default';

interface ResidueGridProps {
  data: SequenceData;
  selection: SequenceSelection;
  highlightedResidues: SequenceResidue[];
  readOnly?: boolean;
}

/**
 * Enhanced ResidueGrid component with improved layout and multi-selection
 * Features:
 * - Every 5th position numbering
 * - No AA labels for more space
 * - Modern scrollbar styling
 * - Multi-region selection support
 * - Copy/paste functionality
 * - Memoized for performance with large structures
 */
export const ResidueGrid = React.memo(function ResidueGrid({
  data,
  selection,
  highlightedResidues,
  readOnly = false,
}: ResidueGridProps) {
  const {
    addSelectionRegion,
    removeSelectionRegion,
    setActiveRegion,
    setHighlightedResidues,
    copyToClipboard,
    getSelectionSequence,
    replaceSelection,
  } = useSequenceSelection();

  const [dragStart, setDragStart] = useState<{ chainId: string; position: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRegion, setDragRegion] = useState<SelectionRegion | null>(null);
  const [residuesPerRow, setResiduesPerRow] = useState(DEFAULT_RESIDUES_PER_ROW);
  const gridRef = useRef<HTMLDivElement>(null);

  // Responsive residues per row based on container width
  useEffect(() => {
    const updateResiduesPerRow = () => {
      if (gridRef.current) {
        const containerWidth = gridRef.current.clientWidth;
        const padding = 48; // 6 * 8px padding on each side
        const availableWidth = containerWidth - padding;
        
        // Each residue needs ~25px (24px + 1px gap)
        const residueWidth = 25;
        const calculatedResidues = Math.floor(availableWidth / residueWidth);
        
        console.log('Responsive calculation:', {
          containerWidth,
          availableWidth,
          calculatedResidues,
          currentConfig: DEFAULT_RESIDUES_PER_ROW,
          currentState: residuesPerRow
        });
        
        // For now, let's just use default value and ensure scrolling works
        // We can make this truly responsive later
        if (residuesPerRow !== DEFAULT_RESIDUES_PER_ROW) {
          console.log('Resetting to default value:', DEFAULT_RESIDUES_PER_ROW);
          setResiduesPerRow(DEFAULT_RESIDUES_PER_ROW);
        }
      }
    };

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(updateResiduesPerRow, 100);

    // Update on resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateResiduesPerRow, 50);
    });
    
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, []); // No dependencies needed since we use constants

  // Optimize lookups with Sets/Maps for O(1) performance
  const residueKey = useCallback((r: SequenceResidue) => `${r.chainId}:${r.position}`, []);

  // Pre-compute selection regions by chain for fast lookups
  const regionsByChain = useMemo(() => {
    const byChain = new Map<string, SelectionRegion[]>();
    for (const region of selection.regions) {
      const existing = byChain.get(region.chainId) ?? [];
      existing.push(region);
      byChain.set(region.chainId, existing);
    }
    return byChain;
  }, [selection.regions]);

  // Pre-compute highlighted residues as Set for O(1) lookups
  const highlightedSet = useMemo(
    () => new Set(highlightedResidues.map(residueKey)),
    [highlightedResidues, residueKey]
  );

  // Optimized selection check using Map lookup
  const isResidueSelected = useCallback((residue: SequenceResidue) => {
    // Check actual selections
    const chainRegions = regionsByChain.get(residue.chainId);
    const inSelection = chainRegions?.some((region: SelectionRegion) =>
      residue.position >= region.start && residue.position <= region.end
    ) || false;
    
    // Check temporary drag region
    const inDragRegion = dragRegion &&
      dragRegion.chainId === residue.chainId &&
      residue.position >= dragRegion.start &&
      residue.position <= dragRegion.end;
    
    return inSelection || !!inDragRegion;
  }, [regionsByChain, dragRegion]);

  // Optimized highlight check using Set lookup
  const isResidueHighlighted = useCallback((residue: SequenceResidue) => {
    return highlightedSet.has(residueKey(residue));
  }, [highlightedSet, residueKey]);

  // Optimized region lookup using Map
  const getResidueRegion = useCallback((residue: SequenceResidue) => {
    const chainRegions = regionsByChain.get(residue.chainId);
    return chainRegions?.find((region: SelectionRegion) =>
      residue.position >= region.start && residue.position <= region.end
    );
  }, [regionsByChain]);

  // Handle residue click
  const handleResidueClick = useCallback((residue: SequenceResidue, event: React.MouseEvent) => {
    if (readOnly) return;
    
    event.preventDefault();

    // Range selection mode - always enabled
    const newRegion: SelectionRegion = {
      id: `${residue.chainId}-${residue.position}`,
      chainId: residue.chainId,
      start: residue.position,
      end: residue.position,
      sequence: residue.code,
      label: `${residue.chainId}:${residue.position}`,
    };
    addSelectionRegion(newRegion);
  }, [readOnly, addSelectionRegion]);

  // Handle mouse down for drag selection
  const handleMouseDown = useCallback((residue: SequenceResidue) => {
    if (readOnly) return;
    
    setIsDragging(true);
    setDragStart(residue);
  }, [readOnly]);

  // Track if modifier key is pressed for multi-selection
  const [isAddMode, setIsAddMode] = useState(false);

  // Handle mouse enter during drag or hover
  const handleMouseEnter = useCallback((residue: SequenceResidue, event?: React.MouseEvent) => {
    if (isDragging && dragStart && dragStart.chainId === residue.chainId) {
      // Calculate range selection
      const start = Math.min(dragStart.position, residue.position);
      const end = Math.max(dragStart.position, residue.position);

      // Find all residues in range
      const chain = data.chains.find(c => c.id === residue.chainId);
      if (chain) {
        const residuesInRange = chain.residues.filter(r => r.position >= start && r.position <= end);
        const sequence = residuesInRange.map(r => r.code).join('');
        
        // Update temporary drag region (don't commit to selection yet)
        const newDragRegion: SelectionRegion = {
          id: `drag-${residue.chainId}-${start}-${end}`,
          chainId: residue.chainId,
          start,
          end,
          sequence,
          label: `${residue.chainId}:${start}-${end}`,
        };
        
        setDragRegion(newDragRegion);
      }
    } else if (!isDragging && !readOnly) {
      // Simple hover highlighting
      setHighlightedResidues([residue]);
    }
  }, [isDragging, dragStart, data.chains, setHighlightedResidues, readOnly]);

  // Handle mouse up - commit the drag selection
  const handleMouseUp = useCallback(() => {
    // Commit the drag region to actual selection
    if (dragRegion) {
      if (isAddMode) {
        addSelectionRegion(dragRegion);
      } else {
        replaceSelection(dragRegion);
      }
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragRegion(null);
  }, [dragRegion, isAddMode, addSelectionRegion, replaceSelection]);

  // Handle mouse leave (for individual residues)
  const handleResidueMouseLeave = useCallback(() => {
    if (!isDragging && !readOnly) {
      setHighlightedResidues([]);
    }
  }, [isDragging, setHighlightedResidues, readOnly]);

  // Handle mouse leave (for entire grid)
  const handleMouseLeave = useCallback(() => {
    if (!isDragging && !readOnly) {
      setHighlightedResidues([]);
    }
  }, [isDragging, setHighlightedResidues, readOnly]);

  // Handle keyboard events for modifier keys
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey) {
        setIsAddMode(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.shiftKey) {
        setIsAddMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseUp]);

  // Handle double-click to copy sequence
  const handleDoubleClick = useCallback(async (residue: SequenceResidue) => {
    if (readOnly) return;
    
    const region = getResidueRegion(residue);
    if (region) {
      const sequence = getSelectionSequence(region);
      try {
        await copyToClipboard(sequence);
      } catch (error) {
        console.warn('Failed to copy sequence:', error);
      }
    }
  }, [readOnly, getResidueRegion, getSelectionSequence, copyToClipboard]);

  return (
    <div
      ref={gridRef}
      className="sequence-grid p-6 overflow-x-auto custom-scrollbar"
      onMouseLeave={handleMouseLeave}
      style={{
        // Custom scrollbar styling
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e1 #f1f5f9',
      }}
    >
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #f8fafc;
        }
      `}</style>

          {data.chains.map((chain) => {
            // Split residues into rows using dynamic residuesPerRow
            const rows: SequenceResidue[][] = [];
            for (let i = 0; i < chain.residues.length; i += residuesPerRow) {
              rows.push(chain.residues.slice(i, i + residuesPerRow));
            }

        return (
          <div key={chain.id} className="chain-section mb-8">
            {/* Chain header */}
            {SHOW_CHAIN_LABELS && (
              <div className="chain-header mb-3 pb-2 border-b border-gray-200">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-base font-semibold text-gray-800">
                    Chain {chain.id}
                    {chain.name && <span className="text-gray-600 ml-2 font-normal">({chain.name})</span>}
                  </h3>
                  <div className="text-xs text-gray-500">
                    {chain.residues.length} residues
                  </div>
                </div>
              </div>
            )}

                {/* Sequence rows */}
                <div className="space-y-3">
              {rows.map((row, rowIndex) => {
                return (
                  <div key={rowIndex} className="sequence-row">
                    {/* Position numbers - every odd number, aligned above residues */}
                    {SHOW_POSITIONS && (
                        <div className="mb-1">
                          <div className="text-xs text-gray-400 text-center" style={{ 
                            display: 'grid',
                            gridTemplateColumns: `repeat(${row.length}, 24px)`,
                            gap: '1px',
                            fontSize: '10px', // Smaller text for position numbers
                            minWidth: `${row.length * 25}px` // Ensure full width
                          }}>
                            {row.map((residue, i) => (
                              <span 
                                key={i} 
                                className="text-center overflow-hidden text-ellipsis whitespace-nowrap"
                                style={{ width: '24px' }}
                              >
                                {residue.position % 2 === 1 ? residue.position : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                    )}

                    {/* Amino acid sequence */}
                    <div>
                      <div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${row.length}, 24px)`,
                          gap: '1px',
                          minWidth: `${row.length * 25}px` // Ensure full width for scrolling
                        }}>
                          {row.map((residue) => {
                            const selected = isResidueSelected(residue);
                            const highlighted = isResidueHighlighted(residue);
                            const region = getResidueRegion(residue);
                            const isActive = region?.id === selection.activeRegion;
                            const residueInfo = getResidueInfo(residue.code);

                            return (
                              <div
                                key={`${residue.chainId}-${residue.position}`}
                                className={`
                                  flex items-center justify-center font-mono
                                  transition-all duration-150 text-white font-medium
                                  ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                                `}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  fontSize: '11px', // Smaller text (about 15% reduction from 13px)
                                  backgroundColor: selected 
                                    ? '#FFD700' // Gold for selection
                                    : highlighted 
                                      ? '#245F73' // Your specified hover color
                                      : getResidueColor(residue.code, DEFAULT_COLOR_SCHEME),
                                }}
                                onClick={(e) => handleResidueClick(residue, e)}
                                onMouseDown={() => handleMouseDown(residue)}
                                onMouseEnter={() => handleMouseEnter(residue)}
                                onMouseLeave={handleResidueMouseLeave}
                                onDoubleClick={() => handleDoubleClick(residue)}
                                title={`${residueInfo.name} (${residue.code}${residue.position}) - Chain ${residue.chainId}${region ? ` - Region: ${region.label}` : ''}`}
                              >
                                {residue.code}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
