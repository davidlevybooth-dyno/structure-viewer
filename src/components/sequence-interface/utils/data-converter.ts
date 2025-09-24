/**
 * Utility functions to convert between old and new sequence data formats
 */

import type { SequenceData, SequenceChain, SequenceResidue } from '../types';

// Legacy types from the old sequence viewer
interface LegacyEnhancedResidue {
  position: number;
  code: string;
  chainId: string;
  secondaryStructure?: 'helix' | 'sheet' | 'loop';
}

interface LegacySequenceChain {
  id: string;
  name?: string;
  residues: LegacyEnhancedResidue[];
}

interface LegacyAdvancedSequenceData {
  id: string;
  title?: string;
  chains: LegacySequenceChain[];
  metadata?: {
    organism?: string;
    method?: string;
    resolution?: string;
    [key: string]: any;
  };
}

/**
 * Convert legacy sequence data to new SequenceInterface format
 */
export function convertLegacySequenceData(
  legacyData: LegacyAdvancedSequenceData
): SequenceData {
  return {
    id: legacyData.id,
    name: legacyData.title || legacyData.id,
    chains: legacyData.chains.map(convertLegacyChain),
    metadata: legacyData.metadata,
  };
}

/**
 * Convert legacy chain data
 */
function convertLegacyChain(legacyChain: LegacySequenceChain): SequenceChain {
  return {
    id: legacyChain.id,
    name: legacyChain.name,
    residues: legacyChain.residues.map(convertLegacyResidue),
  };
}

/**
 * Convert legacy residue data
 */
function convertLegacyResidue(legacyResidue: LegacyEnhancedResidue): SequenceResidue {
  return {
    position: legacyResidue.position,
    code: legacyResidue.code,
    chainId: legacyResidue.chainId,
    secondaryStructure: legacyResidue.secondaryStructure,
  };
}

/**
 * Create mock sequence data for testing
 */
export function createMockSequenceData(pdbId: string): SequenceData {
  // Use the same seeded random approach as the old utils
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const seed = pdbId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const aminoAcids = ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'Y'];
  const secondaryStructures: ('helix' | 'sheet' | 'loop')[] = ['helix', 'sheet', 'loop'];

  // Get realistic data based on known PDB structures
  const getStructureInfo = (pdbId: string) => {
    switch (pdbId.toUpperCase()) {
      case '1CRN':
        return { chains: [{ id: 'A', name: 'Chain A', length: 46 }] };
      case '4HHB':
        return { 
          chains: [
            { id: 'A', name: 'Alpha-1', length: 141 },
            { id: 'B', name: 'Beta-1', length: 146 },
            { id: 'C', name: 'Alpha-2', length: 141 },
            { id: 'D', name: 'Beta-2', length: 146 }
          ]
        };
      case '6M0J':
        return { chains: [{ id: 'A', name: 'Spike protein', length: 1273 }] };
      case '7MT0':
        return { 
          chains: [
            { id: 'A', name: 'VP1', length: 736 },
            { id: 'B', name: 'VP2', length: 65 },
            { id: 'C', name: 'VP3', length: 61 }
          ]
        };
      default:
        return { chains: [{ id: 'A', name: 'Chain A', length: Math.floor(seededRandom(seed) * 200) + 50 }] };
    }
  };

  const structureInfo = getStructureInfo(pdbId);
  const chains: SequenceChain[] = [];

  structureInfo.chains.forEach((chainInfo, chainIndex) => {
    
    const residues: SequenceResidue[] = [];
    for (let i = 0; i < chainLength; i++) {
      const position = i + 1;
      const codeIndex = Math.floor(seededRandom(seed + chainIndex * 1000 + i) * aminoAcids.length);
      const ssIndex = Math.floor(seededRandom(seed + chainIndex * 2000 + i) * secondaryStructures.length);
      
      residues.push({
        position,
        code: aminoAcids[codeIndex],
        chainId,
        secondaryStructure: secondaryStructures[ssIndex],
      });
    }

    chains.push({
      id: chainId,
      name: `Chain ${chainId}`,
      residues,
    });
  }

  return {
    id: pdbId,
    name: `Structure ${pdbId}`,
    chains,
    metadata: {
      organism: 'Example organism',
      method: 'X-ray crystallography',
      resolution: '2.1',
    },
  };
}
