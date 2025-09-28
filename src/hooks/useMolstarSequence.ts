/**
 * Hook for extracting sequence data directly from Molstar plugin
 * This is more efficient than making separate API calls since Molstar already has the data
 */

import { useState, useEffect, useCallback } from "react";
import {
  SequenceData,
  SequenceChain,
  SequenceResidue,
} from "@/components/sequence-interface/types";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

interface UseMolstarSequenceState {
  data: SequenceData | null;
  isLoading: boolean;
  error: string | null;
}

interface UseMolstarSequenceOptions {
  onDataLoaded?: (data: SequenceData) => void;
  onError?: (error: string) => void;
}

/**
 * Extract sequence data directly from loaded Molstar structures
 * This eliminates the need for separate API calls since the data is already loaded
 */
export function useMolstarSequence(
  plugin: PluginUIContext | null,
  options: UseMolstarSequenceOptions = {},
): UseMolstarSequenceState {
  const { onDataLoaded, onError } = options;

  const [state, setState] = useState<UseMolstarSequenceState>({
    data: null,
    isLoading: false,
    error: null,
  });

  const extractSequenceData = useCallback(async () => {
    if (!plugin) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Debug what's available in the plugin
      console.log("Plugin managers available:", {
        hasManagers: !!plugin.managers,
        hasStructure: !!plugin.managers?.structure,
        hasSequence: !!plugin.managers?.structure?.sequence,
        hasHierarchy: !!plugin.managers?.structure?.hierarchy,
        structureCount:
          plugin.managers?.structure?.hierarchy?.current?.structures?.length ||
          0,
      });

      // Check if sequence manager is available
      const seqMgr = plugin.managers?.structure?.sequence;
      if (!seqMgr) {
        throw new Error(
          "Sequence manager not available - plugin may not be fully initialized",
        );
      }

      const sequences = seqMgr.sequences; // Array<SequenceWrapper>
      if (!sequences) {
        throw new Error("Sequences not available from manager");
      }

      console.log(
        "Found sequences from Molstar Sequence Manager:",
        sequences.length,
      );

      if (sequences.length === 0) {
        setState({ data: null, isLoading: false, error: null });
        return;
      }

      // Extract basic information from the first structure
      const structures = plugin.managers.structure.hierarchy.current.structures;
      const structure = structures[0];
      const model = structure?.model;

      const pdbId = model?.entryId?.toUpperCase() || "UNKNOWN";
      const title = model?.label || pdbId;

      console.log("Extracting sequences:", {
        pdbId,
        title,
        sequenceCount: sequences.length,
      });

      // Convert Molstar sequences to our format
      const chains: SequenceChain[] = [];

      for (const seqWrapper of sequences) {
        const info = seqWrapper.info;

        console.log("Processing sequence:", {
          entityId: info.entityId,
          labelAsymId: info.asymId,
          authAsymId: info.authAsymId,
          entityType: info.entityType,
          length: seqWrapper.length,
          hasSequence: !!seqWrapper.sequence,
        });

        // Only process polymer sequences (proteins)
        if (info.entityType === "polymer" && seqWrapper.sequence) {
          const sequence = seqWrapper.sequence; // This is the one-letter string!
          const chainId = info.authAsymId || info.asymId || info.entityId;

          // Convert sequence string to residue array
          const residues: SequenceResidue[] = [];

          for (let i = 0; i < sequence.length; i++) {
            const code = sequence[i];

            residues.push({
              position: i + 1, // Simple 1-based numbering
              code: code,
              chainId: chainId,
              secondaryStructure: "loop", // TODO: Could be enhanced
            });
          }

          if (residues.length > 0) {
            chains.push({
              id: chainId,
              name: `Chain ${chainId}`,
              residues,
            });

            console.log(
              `Added chain ${chainId} with ${residues.length} residues:`,
              sequence.substring(0, 20) + "...",
            );
          }
        }
      }

      // Create sequence data
      const sequenceData: SequenceData = {
        id: pdbId,
        name: title,
        chains,
        metadata: {
          organism: "Extracted from Molstar Sequence Manager",
          method: "Structure Viewer",
          resolution: undefined,
        },
      };

      console.log("Final sequence data:", sequenceData);
      setState({ data: sequenceData, isLoading: false, error: null });
      onDataLoaded?.(sequenceData);
    } catch (error) {
      console.error("Error extracting sequence data:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to extract sequence data";
      setState({ data: null, isLoading: false, error: message });
      onError?.(message);
    }
  }, [plugin, onDataLoaded, onError]);

  // Watch for structure changes in the plugin
  useEffect(() => {
    if (!plugin) return;

    // Add longer delay to ensure sequence manager is ready
    const timer = setTimeout(() => {
      extractSequenceData();
    }, 2000); // Give Molstar more time to initialize sequence manager

    // Set up a polling mechanism as backup
    const pollInterval = setInterval(() => {
      if (plugin.managers?.structure?.sequence?.sequences?.length > 0) {
        extractSequenceData();
        clearInterval(pollInterval);
      }
    }, 500);

    // Try to set up subscription for future changes
    let subscription: any;

    try {
      // Try to subscribe to structure changes
      if (plugin.managers?.structure?.hierarchy?.behaviors?.selection) {
        subscription =
          plugin.managers.structure.hierarchy.behaviors.selection.subscribe(
            () => {
              // Add small delay for subscription updates too
              setTimeout(extractSequenceData, 200);
            },
          );
      }
    } catch (error) {
      console.warn("Could not subscribe to structure changes:", error);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(pollInterval);
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [plugin, extractSequenceData]);

  return state;
}

/**
 * Convert 3-letter amino acid codes to 1-letter codes
 */
function threeToOneLetterCode(threeLetterCode: string): string | null {
  const codeMap: Record<string, string> = {
    ALA: "A",
    ARG: "R",
    ASN: "N",
    ASP: "D",
    CYS: "C",
    GLU: "E",
    GLN: "Q",
    GLY: "G",
    HIS: "H",
    ILE: "I",
    LEU: "L",
    LYS: "K",
    MET: "M",
    PHE: "F",
    PRO: "P",
    SER: "S",
    THR: "T",
    TRP: "W",
    TYR: "Y",
    VAL: "V",

    // Special cases
    MSE: "M", // Selenomethionine
    SEC: "U", // Selenocysteine
    PYL: "O", // Pyrrolysine
  };

  return codeMap[threeLetterCode.toUpperCase()] || null;
}
