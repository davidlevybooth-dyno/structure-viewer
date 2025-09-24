/**
 * Hook for loading real PDB sequence data
 */

import { useState, useEffect, useCallback } from 'react';
import { getPDBSequenceData } from '@/lib/pdb-sequence-api';
import type { SequenceData } from '@/components/sequence-interface/types';

interface UsePDBSequenceState {
  data: SequenceData | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePDBSequenceOptions {
  onDataLoaded?: (data: SequenceData) => void;
  onError?: (error: string) => void;
}

/**
 * Hook to fetch and manage PDB sequence data
 */
export function usePDBSequence(
  pdbId: string | null, 
  options: UsePDBSequenceOptions = {}
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
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const data = await getPDBSequenceData(pdbId);
        
        if (!cancelled) {
          setState({ data, isLoading: false, error: null });
          onDataLoaded?.(data);
        }
      } catch (error) {
        if (!cancelled) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load sequence data';
          setState({ data: null, isLoading: false, error: errorMessage });
          onError?.(errorMessage);
        }
      }
    };

    loadSequenceData();

    return () => {
      cancelled = true;
    };
  }, [pdbId]); // Only depend on pdbId to prevent infinite loops

  const refetch = () => {
    if (pdbId) {
      // Force re-fetch by clearing cache entry
      const { sequenceCache } = require('@/lib/pdb-sequence-api');
      if (sequenceCache?.delete) {
        sequenceCache.delete(pdbId.toUpperCase());
      }
      
      // Trigger re-load
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }
  };

  return {
    ...state,
    refetch,
  };
}
