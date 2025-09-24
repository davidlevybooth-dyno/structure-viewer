/**
 * Utilities to convert our sequence interface types to Mol* highlighting ranges
 * This bridges our existing SelectionRegion/SequenceResidue types with the working Mol* API
 */

import type { SelectionRegion, SequenceResidue } from '@/components/sequence-interface/types';
import type { ResidueRange } from './highlighting';
import { HIGHLIGHTING_CONFIG } from './config';

/**
 * Convert SelectionRegion objects to ResidueRange objects for Mol* highlighting
 */
export function selectionRegionsToResidueRanges(regions: SelectionRegion[]): ResidueRange[] {
  return regions.map(region => ({
    chain: region.chainId,
    start: region.start,
    end: region.end,
    auth: HIGHLIGHTING_CONFIG.USE_AUTH_NUMBERING,
  }));
}

/**
 * Convert individual SequenceResidue objects to ResidueRange objects (for hover highlighting)
 */
export function sequenceResiduesToResidueRanges(residues: SequenceResidue[]): ResidueRange[] {
  // Group consecutive residues by chain to create efficient ranges
  const rangesByChain = new Map<string, { start: number; end: number; positions: number[] }>();
  
  for (const residue of residues) {
    if (!rangesByChain.has(residue.chainId)) {
      rangesByChain.set(residue.chainId, {
        start: residue.position,
        end: residue.position,
        positions: [residue.position],
      });
    } else {
      const existing = rangesByChain.get(residue.chainId)!;
      existing.positions.push(residue.position);
      existing.start = Math.min(existing.start, residue.position);
      existing.end = Math.max(existing.end, residue.position);
    }
  }
  
  // Convert to ResidueRange objects
  const ranges: ResidueRange[] = [];
  for (const [chainId, { start, end, positions }] of rangesByChain) {
    // For hover highlighting, we might want individual residues rather than ranges
    // If positions are not consecutive, create separate ranges
    const sortedPositions = positions.sort((a, b) => a - b);
    
    let rangeStart = sortedPositions[0];
    let rangeEnd = sortedPositions[0];
    
    for (let i = 1; i < sortedPositions.length; i++) {
      const current = sortedPositions[i];
      const previous = sortedPositions[i - 1];
      
      if (current === previous + 1) {
        // Consecutive, extend the range
        rangeEnd = current;
      } else {
        // Gap found, save current range and start a new one
        ranges.push({
          chain: chainId,
          start: rangeStart,
          end: rangeEnd,
          auth: HIGHLIGHTING_CONFIG.USE_AUTH_NUMBERING,
        });
        rangeStart = current;
        rangeEnd = current;
      }
    }
    
    // Add the final range
    ranges.push({
      chain: chainId,
      start: rangeStart,
      end: rangeEnd,
      auth: HIGHLIGHTING_CONFIG.USE_AUTH_NUMBERING,
    });
  }
  
  return ranges;
}

/**
 * Convert a single SequenceResidue to a ResidueRange (point selection)
 */
export function sequenceResidueToResidueRange(residue: SequenceResidue): ResidueRange {
  return {
    chain: residue.chainId,
    start: residue.position,
    end: residue.position,
    auth: HIGHLIGHTING_CONFIG.USE_AUTH_NUMBERING,
  };
}

/**
 * Utility to merge overlapping or adjacent ranges for better performance
 */
export function mergeResidueRanges(ranges: ResidueRange[]): ResidueRange[] {
  if (ranges.length <= 1) return ranges;
  
  // Group by chain
  const rangesByChain = new Map<string, ResidueRange[]>();
  for (const range of ranges) {
    if (!rangesByChain.has(range.chain)) {
      rangesByChain.set(range.chain, []);
    }
    rangesByChain.get(range.chain)!.push(range);
  }
  
  const mergedRanges: ResidueRange[] = [];
  
  for (const [chainId, chainRanges] of rangesByChain) {
    // Sort by start position
    const sorted = chainRanges.sort((a, b) => a.start - b.start);
    
    let currentRange = sorted[0];
    
    for (let i = 1; i < sorted.length; i++) {
      const nextRange = sorted[i];
      
      // Check if ranges overlap or are adjacent
      if (nextRange.start <= currentRange.end + 1) {
        // Merge ranges
        currentRange.end = Math.max(currentRange.end, nextRange.end);
      } else {
        // Gap found, save current range and start new one
        mergedRanges.push(currentRange);
        currentRange = nextRange;
      }
    }
    
    // Add the final range
    mergedRanges.push(currentRange);
  }
  
  return mergedRanges;
}
