"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp, HelpCircle, MousePointer, Mouse, Hand } from "lucide-react";
import { SequenceViewer } from "./SequenceViewer";
import { ChainSelector } from "./ChainSelector";
import { usePDBSequence } from "@/hooks/usePdbSequence";
import type {
  SequenceSelection,
  SequenceResidue,
} from "../../sequence-interface/types";

interface ChainInfo {
  id: string;
  name?: string;
  residueCount: number;
  description?: string;
}

interface SequenceWorkspaceProps {
  pdbId?: string;
  isViewerReady?: boolean;
  onSelectionChange?: (selection: SequenceSelection) => void;
  onHighlightChange?: (residues: SequenceResidue[]) => void;
  selectedChainIds?: string[];
  onChainSelectionChange?: (chainIds: string[]) => void;
  onChainsLoaded?: (chainIds: string[]) => void;
  onResidueAction?: (region: SelectionRegion, action: 'hide' | 'isolate' | 'highlight' | 'copy') => void;
  className?: string;
}

/**
 * SequenceWorkspace - UI orchestration component for PDB sequence viewing
 *
 * Responsibilities:
 * - UI layout and presentation (collapsible, compact view)
 * - PDB data fetching and transformation
 * - Chain selection state management
 * - Integration between ChainSelector and SequenceInterface
 */
export function SequenceWorkspace({
  pdbId,
  isViewerReady,
  onSelectionChange,
  onHighlightChange,
  selectedChainIds = [],
  onChainSelectionChange,
  onChainsLoaded,
  onResidueAction,
  className = "",
}: SequenceWorkspaceProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Start open like structure controls
  const [showTooltip, setShowTooltip] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentSelection, setCurrentSelection] =
    useState<SequenceSelection | null>(null);

  // Fetch PDB data for chain selector only
  const { data: pdbData, isLoading, error } = usePDBSequence(pdbId || "");

  // Transform PDB chains to ChainInfo format for ChainSelector
  const chainInfo = useMemo((): ChainInfo[] => {
    if (!pdbData?.chains) return [];

    return pdbData.chains.map((chain) => ({
      id: chain.id,
      name: chain.name,
      residueCount: chain.residues.length,
      description: chain.organism || "Protein chain",
    }));
  }, [pdbData]);

  // Notify parent when chains are loaded
  useEffect(() => {
    if (chainInfo.length > 0 && onChainsLoaded) {
      const chainIds = chainInfo.map(chain => chain.id);
      onChainsLoaded(chainIds);
    }
  }, [chainInfo, onChainsLoaded]);

  // Smart chain selection logic (≤3 chains: all, >3 chains: first)
  const defaultSelectedChains = useMemo(() => {
    if (chainInfo.length === 0) return [];

    if (chainInfo.length <= 3) {
      return chainInfo.map((chain) => chain.id);
    }

    return [chainInfo[0].id];
  }, [chainInfo]);

  // Handle selection changes from the SequenceInterface
  const handleSelectionChange = (selection: SequenceSelection) => {
    setCurrentSelection(selection);
    onSelectionChange?.(selection);
  };

  // Calculate selection stats for compact display
  const selectionStats = useMemo(() => {
    if (!currentSelection) {
      return { regionCount: 0, totalResidues: 0 };
    }

    const regionCount = currentSelection.regions.length;
    const totalResidues = currentSelection.regions.reduce(
      (sum, region) => sum + (region.end - region.start + 1),
      0,
    );
    return { regionCount, totalResidues };
  }, [currentSelection]);

  // Loading state
  if (!pdbId || !isViewerReady) {
    return (
      <div className={`bg-white border-t border-zinc-200 ${className}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-center h-12 bg-zinc-50 rounded border border-zinc-200">
            <div className="text-center">
              <div className="text-zinc-400 text-sm">
                Load a structure to view sequence
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-white border-t border-zinc-200 ${className}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-center h-12">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <div className="text-zinc-600 text-sm">Loading sequence...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border-t border-zinc-200 ${className}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-center h-12 bg-red-50 rounded border border-red-200">
            <div className="text-center">
              <div className="text-red-600 text-sm">
                Failed to load sequence data
              </div>
              <div className="text-red-500 text-xs mt-1">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const effectiveSelectedChains =
    selectedChainIds.length > 0 ? selectedChainIds : defaultSelectedChains;

  return (
    <div className={`bg-white border-b border-zinc-200 ${className}`}>
      {/* Accordion Header - Matching StructureControls design */}
      <div className="flex items-center justify-between">
        {/* Left side: Accordion toggle and info */}
        <div className="flex items-center gap-3 flex-1 min-w-0 px-4 py-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
          >
            <span className="flex-shrink-0">Sequence Interface</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {/* Chain Selector - Not inside button */}
          {chainInfo.length > 0 && (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-mono uppercase text-zinc-600 text-xs flex-shrink-0">
                {pdbId}
              </span>
              <div className="flex-1 min-w-0 max-w-md">
                <ChainSelector
                  chains={chainInfo}
                  selectedChainIds={effectiveSelectedChains}
                  onSelectionChange={onChainSelectionChange || (() => {})}
                />
              </div>
            </div>
          )}
          
          {/* Selection Status */}
          {selectionStats.regionCount > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs text-blue-700">•</span>
              <span className="text-xs text-blue-700">
                {selectionStats.regionCount} selection{selectionStats.regionCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        {/* Help Button with Tooltip */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowInstructions(true)}
            className="px-3 py-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
            title="Show interaction instructions"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Compact Tooltip */}
          {showTooltip && (
            <div className="absolute right-0 bottom-full mb-1 z-10 bg-zinc-900 text-white text-xs rounded-lg shadow-lg p-3 w-64">
              <div className="space-y-2">
                <div className="font-medium">Sequence Interactions:</div>
                <div className="space-y-1">
                  <div>• <strong>Click & Drag:</strong> Select ranges</div>
                  <div>• <strong>Right-click:</strong> Hide/isolate/highlight</div>
                  <div>• <strong>Hover:</strong> Preview residue</div>
                </div>
                <div className="text-zinc-300 text-xs pt-1 border-t border-zinc-700">
                  Click for detailed instructions
                </div>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-1 right-3 w-2 h-2 bg-zinc-900 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="bg-zinc-50">
          <SequenceViewer
            pdbId={pdbId}
            selectedChainIds={effectiveSelectedChains}
            onChainSelectionChange={onChainSelectionChange}
            onSelectionChange={handleSelectionChange}
            onHighlightChange={onHighlightChange}
            onResidueAction={onResidueAction}
            className="compact-sequence"
          />
        </div>
      )}

      {/* Collapsed Selection Summary */}
      {!isExpanded && selectionStats.regionCount > 0 && currentSelection && (
        <div className="px-4 py-3 bg-blue-50 border-t-2 border-blue-200">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-9 min-w-0 max-w-none">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {currentSelection.regions.map((region, index) => (
                  <span
                    key={region.id}
                    className="text-sm font-mono text-gray-800 break-words"
                  >
                    <span className="font-semibold text-blue-700">
                      {region.label}:
                    </span>
                    <span className="ml-1 bg-white px-1 py-0.5 rounded">
                      {region.sequence}
                    </span>
                    {index < currentSelection.regions.length - 1 && (
                      <span className="text-gray-500 ml-2">|</span>
                    )}
                  </span>
                ))}
              </div>
              <div className="text-xs text-blue-600 font-medium">
                {selectionStats.regionCount} region
                {selectionStats.regionCount !== 1 ? "s" : ""},{" "}
                {selectionStats.totalResidues} residue
                {selectionStats.totalResidues !== 1 ? "s" : ""} selected
              </div>
            </div>

            <div className="col-span-3 flex items-center justify-end">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-blue-700 hover:text-blue-900 transition-colors px-2 py-1 rounded bg-white hover:bg-blue-100 border border-blue-300"
                title="Expand sequence interface"
              >
                Expand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">Sequence Interactions</h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-zinc-600">
                  The sequence interface allows you to interact with protein sequences and automatically 
                  sync selections with the 3D structure viewer.
                </p>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-900">Click & Drag</h4>
                      <p className="text-sm text-zinc-600">Click and drag across residues to select a range</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-900">Right-Click</h4>
                      <p className="text-sm text-zinc-600">Right-click on selected residues for hide/isolate/highlight options</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-900">Hover</h4>
                      <p className="text-sm text-zinc-600">Hover over residues to see details and temporary highlighting</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 mt-4">
                  <h4 className="font-medium text-blue-900 mb-1">Context Menu Actions</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><strong>Hide:</strong> Hide selected residues in 3D viewer</li>
                    <li><strong>Isolate:</strong> Show only selected residues</li>
                    <li><strong>Highlight:</strong> Emphasize residues in 3D viewer</li>
                    <li><strong>Copy:</strong> Copy sequence to clipboard</li>
                  </ul>
                </div>

                <div className="bg-amber-50 rounded-lg p-3">
                  <h4 className="font-medium text-amber-900 mb-1">Pro Tips</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Selections persist when right-clicking</li>
                    <li>• Use "Show All" in Structure Controls to reset</li>
                    <li>• Multiple chain selections are supported</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
