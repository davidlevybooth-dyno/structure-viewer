"use client";

import React, { useRef, useEffect, useState } from "react";
import { molstarWrapper } from "@/lib/molstar/molstarWrapper";
import { Script } from "molstar/lib/mol-script/script";
import { StructureSelection } from "molstar/lib/mol-model/structure";

export interface MolstarViewerProps {
  pdbId?: string;
  className?: string;
  onStructureLoaded?: (pdbId: string) => void;
  onError?: (error: string) => void;
  showControls?: boolean;
  // Expose wrapper methods for external controls
  onWrapperReady?: (wrapper: molstarWrapper) => void;
  // Highlighting props for sequence→structure integration
  selectedRegions?: Array<{
    chainId: string;
    startSeq: number;
    endSeq: number;
  }>;
  hoveredResidues?: Array<{ chainId: string; residueNumber: number }>;
}

/**
 * Clean, simple MolstarViewer using our proven wrapper
 * Focused interface based on what we actually need
 */
export function MolstarViewer({
  pdbId = "1grm",
  className = "",
  onStructureLoaded,
  onError,
  showControls = false,
  onWrapperReady,
  selectedRegions = [],
  hoveredResidues = [],
}: MolstarViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<molstarWrapper | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPdbId, setCurrentPdbId] = useState(pdbId);

  // Initialize wrapper once
  useEffect(() => {
    if (!containerRef.current || wrapperRef.current) return;

    let isMounted = true; // Track if component is still mounted

    const initWrapper = async () => {
      try {
        if (!isMounted) return; // Bail if component unmounted during async operation

        setIsLoading(true);
        setError(null);

        // Ensure container is completely clean
        if (containerRef.current) {
          // Clear any existing content and React roots
          containerRef.current.innerHTML = "";
          // Small delay to ensure DOM is clean
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        if (!isMounted || !containerRef.current) return;

        // Initialize new wrapper
        const wrapper = new molstarWrapper();
        await wrapper.init(containerRef.current);

        if (!isMounted) {
          // If component unmounted during init, clean up
          wrapper.destroy();
          return;
        }

        wrapperRef.current = wrapper;

        // Notify parent that wrapper is ready
        onWrapperReady?.(wrapper);

        // Load initial structure immediately after initialization
        if (pdbId) {
          try {
            await wrapper.loadPDB(pdbId);
            setCurrentPdbId(pdbId);
            onStructureLoaded?.(pdbId);
            setIsLoading(false);
          } catch (loadErr) {
            const errorMsg =
              loadErr instanceof Error
                ? loadErr.message
                : "Failed to load initial structure";
            console.error(
              `Failed to load initial structure ${pdbId}:`,
              loadErr,
            );
            setError(errorMsg);
            onError?.(errorMsg);
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        if (!isMounted) return;
        const errorMsg =
          err instanceof Error ? err.message : "Failed to initialize viewer";
        console.error("Molstar initialization failed:", err);
        setError(errorMsg);
        onError?.(errorMsg);
        setIsLoading(false);
      }
    };

    initWrapper();

    // Cleanup function
    return () => {
      isMounted = false;
      if (wrapperRef.current) {
        wrapperRef.current.destroy();
        wrapperRef.current = null;
      }
    };
  }, []); // No dependencies - init only once

  // Handle PDB ID changes (not initial load)
  useEffect(() => {
    if (!wrapperRef.current || !pdbId || pdbId === currentPdbId) return;

    const loadNewStructure = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await wrapperRef.current!.loadPDB(pdbId);
        setCurrentPdbId(pdbId);
        onStructureLoaded?.(pdbId);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load structure";
        console.error(`Failed to load new structure ${pdbId}:`, err);
        setError(errorMsg);
        onError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadNewStructure();
  }, [pdbId, currentPdbId, onStructureLoaded, onError]); // Only when pdbId actually changes

  // Handle highlighting from sequence selections
  useEffect(() => {
    if (!wrapperRef.current) return;

    // Combine selected regions and hovered residues for highlighting
    const allHighlights: Array<{
      chainId: string;
      startSeq: number;
      endSeq: number;
    }> = [];

    // Add selected regions
    selectedRegions.forEach((region) => {
      allHighlights.push({
        chainId: region.chainId,
        startSeq: region.startSeq,
        endSeq: region.endSeq,
      });
    });

    // Convert hovered residues to single-residue ranges
    hoveredResidues.forEach((residue) => {
      allHighlights.push({
        chainId: residue.chainId,
        startSeq: residue.residueNumber,
        endSeq: residue.residueNumber,
      });
    });

    // Apply highlighting
    if (allHighlights.length > 0) {
      wrapperRef.current.highlightResidues(allHighlights);
    } else {
      wrapperRef.current.clearHighlight();
    }
  }, [selectedRegions, hoveredResidues]);

  // Basic control handlers (only if showControls is true)
  const handleResetCamera = () => {
    wrapperRef.current?.resetCamera();
  };

  const handleToggleSpin = () => {
    wrapperRef.current?.toggleSpin();
  };

  return (
    <div className={`molstar-viewer ${className}`}>
      {/* Basic controls (minimal) */}
      {showControls && (
        <div className="mb-2 flex gap-2 text-xs">
          <button
            onClick={handleResetCamera}
            disabled={isLoading}
            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-xs"
          >
            Reset
          </button>

          <button
            onClick={handleToggleSpin}
            disabled={isLoading}
            className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-xs"
          >
            Spin
          </button>

          {isLoading && (
            <span className="px-2 py-1 text-xs text-gray-600">Loading...</span>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          Error: {error}
        </div>
      )}

      {/* Molstar container */}
      <div
        ref={containerRef}
        className="molstar-container border rounded w-full h-full"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
