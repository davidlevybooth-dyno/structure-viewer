/**
 * Custom hook for managing bidirectional highlighting between sequence interface and 3D structure
 * Follows our established patterns of clean, performant, and type-safe code
 */

import { useEffect, useCallback, useRef } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import type { SelectionRegion, SequenceResidue } from '@/components/sequence-interface/types';
import {
  buildResidueRangeLoci,
  highlightOnly,
  selectOnly,
  clearAllHighlights,
  clearAllSelections,
} from '@/lib/molstar/highlighting';
import { selectionRegionsToResidueRanges, sequenceResiduesToResidueRanges } from '@/lib/molstar/sequence-to-molstar';
import { HIGHLIGHTING_CONFIG } from '@/lib/molstar/config';

interface UseBidirectionalHighlightingOptions {
  /** Callback when 3D structure selection changes */
  onStructureSelectionChange?: (regions: SelectionRegion[]) => void;
  /** Debounce delay for hover highlighting (ms) */
  hoverDebounceMs?: number;
}

interface UseBidirectionalHighlightingReturn {
  /** Highlight selected regions in 3D structure */
  highlightSelection: (regions: SelectionRegion[]) => Promise<void>;
  /** Highlight hovered residues in 3D structure */
  highlightHover: (residues: SequenceResidue[]) => Promise<void>;
  /** Clear all highlighting in 3D structure */
  clearStructureHighlights: () => void;
  /** Whether highlighting is currently active */
  isHighlighting: boolean;
}

/**
 * Hook for managing bidirectional highlighting between sequence and structure
 */
export function useBidirectionalHighlighting(
  plugin: PluginUIContext | null,
  options: UseBidirectionalHighlightingOptions = {}
): UseBidirectionalHighlightingReturn {
  const {
    onStructureSelectionChange,
    hoverDebounceMs = HIGHLIGHTING_CONFIG.HOVER_DEBOUNCE_MS,
  } = options;

  // Refs for managing state and cleanup
  const isHighlightingRef = useRef(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Subscribe to 3D structure selection events (currently disabled)
  useEffect(() => {
    // TODO: Implement structure → sequence highlighting when bidirectional support is ready
    // This would subscribe to 3D structure selection events and update sequence viewer
    return () => {}; // No-op cleanup for now
  }, []);

  // Highlight selected regions in 3D structure
  const highlightSelection = useCallback(async (regions: SelectionRegion[]) => {
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

      // Apply persistent selection (won't disappear on mouseover)
      selectOnly(plugin, loci);
    } catch (error) {
      console.error('Failed to highlight selection:', error);
    } finally {
      isHighlightingRef.current = false;
    }
  }, [plugin]);

  // Highlight hovered residues in 3D structure (with debouncing)
  const highlightHover = useCallback(async (residues: SequenceResidue[]) => {
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
        console.warn('Failed to highlight hover:', error);
      } finally {
        isHighlightingRef.current = false;
        hoverTimeoutRef.current = null;
      }
    }, hoverDebounceMs);
  }, [plugin, hoverDebounceMs]);

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

export type { UseBidirectionalHighlightingOptions, UseBidirectionalHighlightingReturn };
