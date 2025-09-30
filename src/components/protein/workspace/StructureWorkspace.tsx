/**
 * StructureWorkspace - Professional container for 3D structure viewer and sequence interface
 * Orchestrates bidirectional communication between structure and sequence views
 */

"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { MolstarViewer } from "../viewers/MolstarViewer";
import { SequenceWorkspace } from "../sequence/SequenceWorkspace";
import { PDBLoader } from "../controls/PDBLoader";
import { StructureSettingsDropdown } from "../controls/StructureSettingsDropdown";
import { StructureControls } from "../controls/StructureControls";
import { DEFAULT_STRUCTURE_ID } from "@/config/constants";
import type { MolstarWrapper } from "@/lib/molstar/MolstarWrapper";
import type {
  SelectionRegion,
  SequenceResidue,
  SequenceSelection,
} from "../../sequence-interface/types";

interface StructureWorkspaceProps {
  className?: string;
  initialPdbId?: string;
}

export function StructureWorkspace({
  className = "",
  initialPdbId = DEFAULT_STRUCTURE_ID,
}: StructureWorkspaceProps) {
  // Core state
  const [pdbId, setPdbId] = useState<string>(initialPdbId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isViewerReady, setIsViewerReady] = useState(false);

  // Bidirectional highlighting state
  const [selectedRegions, setSelectedRegions] = useState<SelectionRegion[]>([]);
  const [hoveredResidues, setHoveredResidues] = useState<SequenceResidue[]>([]);

  // Chain selection state
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [selectedChainIds, setSelectedChainIds] = useState<string[]>([]);

  // Molstar wrapper reference for controls
  const [molstarWrapper, setMolstarWrapper] = useState<MolstarWrapper | null>(null);

  // Structure loading handlers
  const handleStructureLoaded = useCallback((loadedPdbId: string) => {
    setIsLoading(false);
    setError(null);
    console.log(`Structure loaded: ${loadedPdbId}`);
  }, []);

  const handleError = useCallback((err: unknown) => {
    setIsLoading(false);
    setError(err instanceof Error ? err.message : "Failed to load structure");
    console.error("Structure workspace error:", err);
  }, []);

  const handleLoadStructure = useCallback(
    (newPdbId: string) => {
      if (newPdbId && newPdbId !== pdbId) {
        setIsLoading(true);
        setError(null);
        setPdbId(newPdbId.toLowerCase());
        // Clear previous selections when loading new structure
        setSelectedRegions([]);
        setHoveredResidues([]);
      }
    },
    [pdbId],
  );

  // Remove unused handleViewerReady - we'll set isViewerReady when structure loads
  useEffect(() => {
    if (pdbId) {
      setIsViewerReady(true);
    }
  }, [pdbId]);

  // Bidirectional highlighting handlers
  const handleSequenceSelectionChange = useCallback(
    (selection: SequenceSelection) => {
      setSelectedRegions(selection.regions);
      // Highlighting will be handled by MolstarViewer via props
    },
    [],
  );

  const handleSequenceHighlightChange = useCallback(
    (residues: SequenceResidue[]) => {
      setHoveredResidues(residues);
      // Highlighting will be handled by MolstarViewer via props
    },
    [],
  );

  const handleStructureSelectionChange = useCallback(
    (regions: SelectionRegion[]) => {
      setSelectedRegions(regions);
      // TODO: Highlight regions in sequence interface
    },
    [],
  );

  // Chain selection handler
  const handleChainSelectionChange = useCallback((chainIds: string[]) => {
    setSelectedChainIds(chainIds);
  }, []);

  const handleChainsLoaded = useCallback((chainIds: string[]) => {
    setAvailableChains(chainIds);
  }, []);

  // Handle residue-level operations from sequence interface
  const handleResidueAction = useCallback(async (region: SelectionRegion, action: 'hide' | 'isolate' | 'highlight' | 'copy') => {
    if (!molstarWrapper) return;
    
    try {
      switch (action) {
        case 'hide':
          await molstarWrapper.hideResidueRange(region.chainId, region.start, region.end);
          break;
        case 'isolate':
          await molstarWrapper.isolateResidueRange(region.chainId, region.start, region.end);
          break;
        case 'highlight':
          await molstarWrapper.showResidueRange(region.chainId, region.start, region.end);
          break;
        case 'copy':
          // Copy action is handled locally in ResidueGrid, so we don't need to do anything here
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action} on residue range:`, error);
    }
  }, [molstarWrapper]);

  // Handle wrapper ready callback
  const handleWrapperReady = useCallback((wrapper: MolstarWrapper) => {
    setMolstarWrapper(wrapper);
  }, []);

  // Memoized viewer configuration for performance
  // Removed viewerConfig - no longer needed with simplified interface

  return (
    <div className={`flex-1 flex flex-col bg-zinc-50 ${className}`}>
      {/* PDB Loader */}
      <div className="p-4 bg-white border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <PDBLoader
            currentPdbId={pdbId}
            onLoadStructure={handleLoadStructure}
            isLoading={isLoading}
          />
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md ml-auto">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Unified Scrolling */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {/* Structure Controls - Accordion */}
          <StructureControls 
            wrapper={molstarWrapper}
            isLoading={isLoading}
            availableChains={availableChains}
          />
          
          {/* 3D Structure Viewer - Fixed height */}
          <div className="h-[420px] bg-white border-b border-zinc-200 flex-shrink-0">
            <MolstarViewer
              pdbId={pdbId}
              className="h-full w-full"
              onStructureLoaded={handleStructureLoaded}
              onError={handleError}
              onWrapperReady={handleWrapperReady}
              selectedRegions={selectedRegions.map(region => ({
                chainId: region.chainId,
                startSeq: region.start,
                endSeq: region.end
              }))}
              hoveredResidues={hoveredResidues.map(residue => ({
                chainId: residue.chainId,
                residueNumber: residue.position
              }))}
            />
          </div>

          {/* Sequence Interface - Natural height */}
          <div className="bg-zinc-50">
            <SequenceWorkspace
              pdbId={pdbId}
              isViewerReady={isViewerReady}
              selectedChainIds={selectedChainIds}
              onSelectionChange={handleSequenceSelectionChange}
              onHighlightChange={handleSequenceHighlightChange}
              onChainSelectionChange={handleChainSelectionChange}
              onChainsLoaded={handleChainsLoaded}
              onResidueAction={handleResidueAction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
