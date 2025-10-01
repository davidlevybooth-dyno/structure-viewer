import { useState, useEffect } from "react";
import { getPDBSequenceData } from "@/lib/pdbSequenceApi";
import type { SequenceData } from "@/types/sequence";

interface UsePDBSequenceState {
  data: SequenceData | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePDBSequenceOptions {
  onDataLoaded?: (data: SequenceData) => void;
  onError?: (error: string) => void;
}
export function usePDBSequence(
  pdbId: string | null,
  options: UsePDBSequenceOptions = {},
) {
  const { onDataLoaded, onError } = options;

  const [state, setState] = useState<UsePDBSequenceState>({
    data: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!pdbId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    let cancelled = false;

    const loadSequenceData = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await getPDBSequenceData(pdbId);

        if (!cancelled) {
          setState({ data, isLoading: false, error: null });
          onDataLoaded?.(data);
        }
      } catch (error) {
        if (!cancelled) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to load sequence data";
          setState({ data: null, isLoading: false, error: errorMessage });
          onError?.(errorMessage);
        }
      }
    };

    loadSequenceData();

    return () => {
      cancelled = true;
    };
  }, [pdbId, onDataLoaded, onError]);

  const refetch = async () => {
    if (pdbId) {
      const { sequenceCache } = await import("@/lib/pdbSequenceApi");
      if (sequenceCache?.delete) {
        sequenceCache.delete(pdbId.toUpperCase());
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    }
  };

  return {
    ...state,
    refetch,
  };
}
