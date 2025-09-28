"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";
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
  className = "",
}: SequenceWorkspaceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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
    <div className={`bg-white border-t border-zinc-200 ${className}`}>
      {/* Compact Header - Fixed height to prevent scrolling */}
      <div className="px-4 py-2 border-b border-zinc-100 min-h-[44px] max-h-[44px] overflow-hidden">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 transition-colors flex-shrink-0"
            >
              <span>Sequence</span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Chain Info with Interactive Selector */}
            <div className="flex items-center gap-3 text-xs text-zinc-500 min-w-0 flex-1">
              <span className="font-mono uppercase text-zinc-600 flex-shrink-0">
                {pdbId}
              </span>

              {/* Interactive Chain Selector - constrained width */}
              {chainInfo.length > 0 && (
                <div className="min-w-0 flex-1 max-w-md">
                  <ChainSelector
                    chains={chainInfo}
                    selectedChainIds={effectiveSelectedChains}
                    onSelectionChange={onChainSelectionChange || (() => {})}
                  />
                </div>
              )}

              {selectionStats.regionCount > 0 && (
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 text-xs rounded flex-shrink-0">
                  {selectionStats.regionCount} selected
                </span>
              )}
            </div>
          </div>

          {/* Compact Actions */}
          <div className="flex items-center gap-1">
            {selectionStats.regionCount > 0 && (
              <button
                className="p-1.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded transition-colors"
                title="Copy selection"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 py-3">
          <div className="rounded border border-zinc-200 overflow-hidden">
            <SequenceViewer
              pdbId={pdbId}
              selectedChainIds={effectiveSelectedChains}
              onChainSelectionChange={onChainSelectionChange}
              onSelectionChange={handleSelectionChange}
              onHighlightChange={onHighlightChange}
              className="compact-sequence"
            />
          </div>
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
    </div>
  );
}
