/**
 * StructureWorkspace - Professional container for 3D structure viewer and sequence interface
 * Orchestrates bidirectional communication between structure and sequence views
 */

"use client";

import React, { useState, useCallback, useMemo } from "react";
import { MolstarViewer } from "../viewers/MolstarViewer";
import { SequenceWorkspace } from "../sequence/SequenceWorkspace";
import { PDBLoader } from "../controls/PDBLoader";
import { DEFAULT_STRUCTURE_ID } from "@/config/constants";
import type {
  SelectionRegion,
  SequenceResidue,
  SequenceSelection,
} from "../../sequence-interface/types";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

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
  const [chains, setChains] = useState<any[]>([]);
  const [selectedChainIds, setSelectedChainIds] = useState<string[]>([]);

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

  const handleViewerReady = useCallback((plugin: PluginUIContext) => {
    setIsViewerReady(true);
    console.log("Molstar viewer ready");
  }, []);

  // Bidirectional highlighting handlers
  const handleSequenceSelectionChange = useCallback(
    (selection: SequenceSelection) => {
      setSelectedRegions(selection.regions);
      // TODO: Highlight regions in 3D structure
    },
    [],
  );

  const handleSequenceHighlightChange = useCallback(
    (residues: SequenceResidue[]) => {
      setHoveredResidues(residues);
      // TODO: Highlight residues in 3D structure
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

  // Memoized viewer configuration for performance
  const viewerConfig = useMemo(
    () => ({
      hideSequencePanel: true,
      hideLogPanel: true,
      hideLeftPanel: true,
      showRightPanel: false,
    }),
    [],
  );

  return (
    <div className={`flex-1 flex flex-col bg-zinc-50 ${className}`}>
      {/* PDB Loader Header */}
      <div className="p-4 bg-white border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <PDBLoader
            currentPdbId={pdbId}
            onLoadStructure={handleLoadStructure}
            isLoading={isLoading}
          />
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col">
          {/* 3D Structure Viewer - Fixed height for better scrolling */}
          <div className="h-[60vh] min-h-[400px] relative bg-white">
            <MolstarViewer
              pdbId={pdbId}
              className="h-full w-full"
              config={viewerConfig}
              onReady={handleViewerReady}
              onStructureLoaded={handleStructureLoaded}
              onError={handleError}
              selectedRegions={selectedRegions}
              hoveredResidues={hoveredResidues}
              onStructureSelectionChange={handleStructureSelectionChange}
            />
          </div>

          {/* Compact Sequence Interface */}
          <SequenceWorkspace
            pdbId={pdbId}
            isViewerReady={isViewerReady}
            selectedChainIds={selectedChainIds}
            onSelectionChange={handleSequenceSelectionChange}
            onHighlightChange={handleSequenceHighlightChange}
            onChainSelectionChange={handleChainSelectionChange}
          />
        </div>
      </div>
    </div>
  );
}
