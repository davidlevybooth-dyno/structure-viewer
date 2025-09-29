import { useEffect, useCallback, useRef } from "react";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import type {
  SelectionRegion,
  SequenceResidue,
} from "@/components/sequence-interface/types";
import {
  buildResidueRangeLoci,
  highlightOnly,
  selectOnly,
  clearAllHighlights,
  clearAllSelections,
} from "@/lib/molstar/highlighting";
import {
  selectionRegionsToResidueRanges,
  sequenceResiduesToResidueRanges,
} from "@/lib/molstar/sequence-to-molstar";
import { HIGHLIGHTING_CONFIG } from "@/lib/molstar/config";

interface UseBidirectionalHighlightingOptions {
  onStructureSelectionChange?: (regions: SelectionRegion[]) => void;
  hoverDebounceMs?: number;
}

interface UseBidirectionalHighlightingReturn {
  highlightSelection: (regions: SelectionRegion[]) => Promise<void>;
  highlightHover: (residues: SequenceResidue[]) => Promise<void>;
  clearStructureHighlights: () => void;
  isHighlighting: boolean;
}
export function useBidirectionalHighlighting(
  plugin: PluginUIContext | null,
  options: UseBidirectionalHighlightingOptions = {},
): UseBidirectionalHighlightingReturn {
  const {
    onStructureSelectionChange,
    hoverDebounceMs = HIGHLIGHTING_CONFIG.HOVER_DEBOUNCE_MS,
  } = options;

  const isHighlightingRef = useRef(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    // TODO: Implement structure → sequence highlighting when bidirectional support is ready
    // This would subscribe to 3D structure selection events and update sequence viewer
    return () => {}; // No-op cleanup for now
  }, []);

  // Highlight selected regions in 3D structure
  const highlightSelection = useCallback(
    async (regions: SelectionRegion[]) => {
      if (!plugin) return;

      if (regions.length === 0) {
        clearAllSelections(plugin);
        return;
      }

      try {
        isHighlightingRef.current = true;

        // Convert sequence regions to residue ranges
        const residueRanges = selectionRegionsToResidueRanges(regions);

        // Build loci for the ranges
        const loci = buildResidueRangeLoci(plugin, residueRanges);

        if (!loci) return;

        // Try both highlighting and selection for visibility
        highlightOnly(plugin, loci);
        selectOnly(plugin, loci);
      } catch (error) {
        console.error("Failed to highlight selection:", error);
      } finally {
        isHighlightingRef.current = false;
      }
    },
    [plugin],
  );

  // Highlight hovered residues in 3D structure (with debouncing)
  const highlightHover = useCallback(
    async (residues: SequenceResidue[]) => {
      if (!plugin) return;

      // Clear any existing hover timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      if (residues.length === 0) {
        // Clear hover highlighting immediately if no residues (but keep selections)
        clearAllHighlights(plugin);
        return;
      }

      // Debounce hover highlighting
      hoverTimeoutRef.current = setTimeout(async () => {
        try {
          isHighlightingRef.current = true;

          // Convert residues to residue ranges
          const residueRanges = sequenceResiduesToResidueRanges(residues);

          // Build loci for the ranges
          const loci = buildResidueRangeLoci(plugin, residueRanges);

          if (!loci) return;

          // Apply transient highlighting
          highlightOnly(plugin, loci);
        } catch (error) {
          console.warn("Failed to highlight hover:", error);
        } finally {
          isHighlightingRef.current = false;
          hoverTimeoutRef.current = null;
        }
      }, hoverDebounceMs);
    },
    [plugin, hoverDebounceMs],
  );

  // Clear all highlighting in 3D structure
  const clearStructureHighlights = useCallback(() => {
    if (!plugin) return;

    // Clear any pending hover timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    clearAllHighlights(plugin);
    clearAllSelections(plugin);
    isHighlightingRef.current = false;
  }, [plugin]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    highlightSelection,
    highlightHover,
    clearStructureHighlights,
    isHighlighting: isHighlightingRef.current,
  };
}

export type {
  UseBidirectionalHighlightingOptions,
  UseBidirectionalHighlightingReturn,
};
