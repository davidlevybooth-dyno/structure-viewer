import { useMemo } from 'react';
import type { SequenceData, SequenceResidue } from '../types';

interface PerformanceOptimizations {
  shouldVirtualize: boolean;
  highlightedResiduesSet: Set<string>;
  totalResidueCount: number;
  maxChainLength: number;
}

/**
 * Hook to determine performance optimizations needed for large structures
 */
export function usePerformanceOptimization(
  data: SequenceData,
  highlightedResidues: SequenceResidue[]
): PerformanceOptimizations {
  return useMemo(() => {
    const totalResidueCount = data.chains.reduce(
      (sum, chain) => sum + chain.residues.length, 
      0
    );
    
    const maxChainLength = Math.max(
      0,
      ...data.chains.map(chain => chain.residues.length)
    );

    // Convert highlighted residues to Set for O(1) lookups
    const highlightedResiduesSet = new Set(
      highlightedResidues.map(r => `${r.chainId}:${r.position}`)
    );

    // Threshold for virtualization - structures with >2000 residues
    const shouldVirtualize = totalResidueCount > 2000;

    return {
      shouldVirtualize,
      highlightedResiduesSet,
      totalResidueCount,
      maxChainLength,
    };
  }, [data.chains, highlightedResidues]);
}
