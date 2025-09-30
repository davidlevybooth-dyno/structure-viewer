/**
 * Core sequence data management
 * Handles fetching, caching, and processing of PDB sequence data
 */

import type { 
  SequenceData, 
  SequenceApiResponse, 
  PdbApiResponse,
  SequenceMetadata,
  ChainMetadata,
  SequenceChain,
  SequenceResidue 
} from '@/types/sequence';

/**
 * Sequence data manager class
 * Provides robust data fetching with caching, error handling, and data processing
 */
export class SequenceDataManager {
  private cache = new Map<string, SequenceData>();
  private pendingRequests = new Map<string, Promise<SequenceApiResponse<SequenceData>>>();

  /**
   * Fetch PDB sequence data with caching
   */
  async fetchPDBSequence(pdbId: string): Promise<SequenceApiResponse<SequenceData>> {
    const normalizedId = pdbId.toLowerCase();
    
    // Check cache first
    const cached = this.cache.get(normalizedId);
    if (cached) {
      return {
        success: true,
        data: cached,
        metadata: {
          requestId: `cache-${normalizedId}`,
          timestamp: Date.now(),
          duration: 0,
        },
      };
    }

    // Check for pending request
    const pending = this.pendingRequests.get(normalizedId);
    if (pending) {
      return pending;
    }

    // Create new request
    const requestPromise = this.performFetch(normalizedId);
    this.pendingRequests.set(normalizedId, requestPromise);

    try {
      const result = await requestPromise;
      
      // Cache successful results
      if (result.success && result.data) {
        this.cache.set(normalizedId, result.data);
      }
      
      return result;
    } finally {
      this.pendingRequests.delete(normalizedId);
    }
  }

  /**
   * Get cached sequence data
   */
  getCachedSequence(pdbId: string): SequenceData | null {
    return this.cache.get(pdbId.toLowerCase()) || null;
  }

  /**
   * Clear cache for specific PDB or all
   */
  clearCache(pdbId?: string): void {
    if (pdbId) {
      this.cache.delete(pdbId.toLowerCase());
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Perform the actual fetch operation
   */
  private async performFetch(pdbId: string): Promise<SequenceApiResponse<SequenceData>> {
    const startTime = Date.now();
    const requestId = `fetch-${pdbId}-${startTime}`;

    try {
      const response = await fetch(`https://www.ebi.ac.uk/pdbe/api/pdb/entry/molecules/${pdbId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData = await response.json();
      
      if (!rawData[pdbId]) {
        throw new Error(`No data found for PDB ID: ${pdbId}`);
      }

      const processedData = this.processRawData(pdbId, rawData[pdbId]);
      
      return {
        success: true,
        data: processedData,
        metadata: {
          requestId,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: { pdbId, originalError: error },
        },
        metadata: {
          requestId,
          timestamp: Date.now(),
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Process raw API data into our standardized format
   */
  private processRawData(pdbId: string, rawData: any[]): SequenceData {
    const chains: SequenceChain[] = [];
    
    for (const molecule of rawData) {
      if (molecule.molecule_type === 'polypeptide(L)' && molecule.sequence) {
        const chainId = molecule.chain_ids?.[0] || 'A';
        
        // Process residues
        const residues: SequenceResidue[] = [];
        const sequence = molecule.sequence;
        
        for (let i = 0; i < sequence.length; i++) {
          residues.push({
            position: i + 1,
            code: sequence[i],
            chainId,
          });
        }

        // Create chain metadata
        const chainMetadata: ChainMetadata = {
          type: 'protein',
          length: sequence.length,
          molecularWeight: molecule.molecular_weight,
          organism: molecule.source?.[0]?.organism_scientific_name,
          description: molecule.molecule_name?.[0],
        };

        chains.push({
          id: chainId,
          name: molecule.molecule_name?.[0] || `Chain ${chainId}`,
          residues,
          metadata: chainMetadata,
        });
      }
    }

    // Create sequence metadata
    const metadata: SequenceMetadata = {
      organism: chains[0]?.metadata?.organism,
      title: `PDB Structure ${pdbId.toUpperCase()}`,
    };

    return {
      id: pdbId.toUpperCase(),
      name: `PDB ${pdbId.toUpperCase()}`,
      chains,
      metadata,
    };
  }

  /**
   * Validate sequence data structure
   */
  validateSequenceData(data: any): data is SequenceData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      Array.isArray(data.chains) &&
      data.chains.every((chain: any) =>
        typeof chain.id === 'string' &&
        typeof chain.name === 'string' &&
        Array.isArray(chain.residues) &&
        chain.residues.every((residue: any) =>
          typeof residue.position === 'number' &&
          typeof residue.code === 'string' &&
          typeof residue.chainId === 'string'
        )
      )
    );
  }

  /**
   * Get sequence statistics
   */
  getSequenceStats(data: SequenceData): {
    totalChains: number;
    totalResidues: number;
    chainLengths: Record<string, number>;
    averageChainLength: number;
  } {
    const chainLengths: Record<string, number> = {};
    let totalResidues = 0;

    for (const chain of data.chains) {
      chainLengths[chain.id] = chain.residues.length;
      totalResidues += chain.residues.length;
    }

    return {
      totalChains: data.chains.length,
      totalResidues,
      chainLengths,
      averageChainLength: data.chains.length > 0 ? totalResidues / data.chains.length : 0,
    };
  }
}
