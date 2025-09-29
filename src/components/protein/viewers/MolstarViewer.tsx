"use client";

import { useEffect, useMemo, useCallback } from "react";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { useMolstarPlugin } from "@/hooks/useMolstarPlugin";
import {
  useStructureLoader,
  type LoadStructureOptions,
} from "@/hooks/useStructureLoader";
import { useBidirectionalHighlighting } from "@/hooks/useBidirectionalHighlighting";
import { LoadingSpinner } from "@/components/ui/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/ui/common/ErrorDisplay";
import { MolstarContainer } from "./MolstarContainer";
import { StatusIndicator } from "@/components/ui/common/StatusIndicator";
import { useMolstar } from "@/contexts/MolstarContext";
import type {
  SelectionRegion,
  SequenceResidue,
} from "@/components/sequence-interface/types";

type ViewerConfig = {
  hideSequencePanel?: boolean;
  hideLogPanel?: boolean;
  hideLeftPanel?: boolean;
  showRightPanel?: boolean;
};

export interface MolstarViewerProps {
  pdbId?: string;
  className?: string;
  config?: ViewerConfig;
  loadOptions?: Omit<LoadStructureOptions, "pdbId">;
  onReady?: (plugin: PluginUIContext) => void;
  onStructureLoaded?: (pdbId: string) => void;
  onError?: (error: unknown) => void;
  // Bidirectional highlighting props
  selectedRegions?: SelectionRegion[];
  hoveredResidues?: SequenceResidue[];
  onStructureSelectionChange?: (regions: SelectionRegion[]) => void;
}

const DEFAULT_CONFIG: Required<ViewerConfig> = {
  hideSequencePanel: false,
  hideLogPanel: true,
  hideLeftPanel: true,
  showRightPanel: false,
};

export function MolstarViewer({
  pdbId,
  className = "",
  config,
  loadOptions,
  onReady,
  onStructureLoaded,
  onError,
  selectedRegions = [],
  hoveredResidues = [],
  onStructureSelectionChange,
}: MolstarViewerProps) {
  const { setPlugin } = useMolstar();
  
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...(config ?? {}) }),
    [config],
  );

  const {
    containerRef,
    state: pluginState,
    plugin,
  } = useMolstarPlugin({
    config: mergedConfig,
    onReady: (plugin) => {
      setPlugin(plugin);
      onReady?.(plugin);
    },
    onError,
  });

  const { state: loadingState, loadStructure } = useStructureLoader(plugin, {
    onStructureLoaded,
    onError,
  });

  // Set up bidirectional highlighting
  const { highlightSelection, highlightHover, clearStructureHighlights } =
    useBidirectionalHighlighting(plugin, {
      onStructureSelectionChange,
    });

  const mergedLoadOptions = useMemo<Omit<LoadStructureOptions, "pdbId">>(
    () => ({
      representation: "cartoon",
      colorScheme: "chain-id",
      autoFocus: true,
      ...(loadOptions ?? {}),
    }),
    [loadOptions],
  );

  useEffect(() => {
    if (!pluginState.isInitialized || !plugin || !pdbId) return;
    if (loadingState.isLoading) return;

    const nextId = pdbId.toUpperCase();
    if (loadingState.currentPdbId === nextId) return;

    void loadStructure({ pdbId: nextId, ...mergedLoadOptions });
  }, [
    pdbId,
    plugin,
    pluginState.isInitialized,
    loadingState.isLoading,
    loadingState.currentPdbId,
    loadStructure,
    mergedLoadOptions,
  ]);

  // Handle sequence selection → structure highlighting
  useEffect(() => {
    if (!plugin || !pluginState.isInitialized) return;

    // Highlighting selection regions
    void highlightSelection(selectedRegions);
  }, [selectedRegions, plugin, pluginState.isInitialized, highlightSelection]);

  // Handle sequence hover → structure highlighting
  useEffect(() => {
    if (!plugin || !pluginState.isInitialized) return;

    void highlightHover(hoveredResidues);
  }, [hoveredResidues, plugin, pluginState.isInitialized, highlightHover]);

  const handleRetry = useCallback(() => {
    if (!plugin || !pdbId) {
      window.location.reload();
      return;
    }
    const nextId = pdbId.toUpperCase();
    void loadStructure({ pdbId: nextId, ...mergedLoadOptions });
  }, [plugin, pdbId, loadStructure, mergedLoadOptions]);

  if (pluginState.error) {
    return (
      <ErrorDisplay
        error={pluginState.error}
        title="Failed to Initialize Viewer"
        onRetry={handleRetry}
        className={className}
      />
    );
  }

  if (loadingState.error) {
    return (
      <ErrorDisplay
        error={loadingState.error}
        title="Failed to Load Structure"
        onRetry={handleRetry}
        className={className}
      />
    );
  }

  const isBusy = pluginState.isLoading || loadingState.isLoading;

  return (
    <div
      className={`relative ${className}`}
      aria-busy={isBusy}
      aria-live="polite"
    >
      {isBusy && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <LoadingSpinner
            message={
              pluginState.isLoading
                ? "Initializing Mol*…"
                : pdbId
                  ? `Loading ${pdbId}…`
                  : "Loading…"
            }
            size="md"
          />
        </div>
      )}

      <MolstarContainer ref={containerRef} className="w-full h-full" />

      <StatusIndicator
        isReady={pluginState.isInitialized}
        currentStructure={loadingState.currentPdbId || undefined}
      />
    </div>
  );
}

export default MolstarViewer;
