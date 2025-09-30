/**
 * React hook for sequence manager integration
 * Provides a clean React interface to the sequence management system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SequenceManager } from '@/lib/sequence/SequenceManager';

import type { 
  SequenceData,
  SequenceApiResponse,
  SelectionRegion,
  SequenceSelection,
  SequenceConfig,
  SequenceResidue,
  SequenceEvent,
  SequenceMolstarIntegration
} from '@/types/sequence';

interface UseSequenceManagerOptions {
  config?: Partial<SequenceConfig>;
  molstarIntegration?: SequenceMolstarIntegration;
  autoLoad?: string; // PDB ID to auto-load
}

interface UseSequenceManagerResult {
  // Data state
  data: SequenceData | null;
  loading: boolean;
  error: string | null;
  
  // Selection state
  selection: SequenceSelection;
  
  // Actions
  loadSequence: (pdbId: string) => Promise<SequenceApiResponse<SequenceData>>;
  addSelection: (region: SelectionRegion) => boolean;
  removeSelection: (regionId: string) => boolean;
  replaceSelection: (regions: SelectionRegion[]) => boolean;
  clearSelection: () => void;
  performResidueAction: (action: 'hide' | 'isolate' | 'highlight' | 'copy', region: SelectionRegion) => Promise<boolean>;
  
  // Utilities
  isResidueSelected: (residue: SequenceResidue) => boolean;
  getResidueRegion: (residue: SequenceResidue) => SelectionRegion | null;
  getAvailableChains: () => string[];
  updateConfig: (config: Partial<SequenceConfig>) => void;
  
  // Manager instance (for advanced use)
  manager: SequenceManager;
}

/**
 * React hook for sequence manager
 * Provides a complete interface to sequence data and selection management
 */
export function useSequenceManager(options: UseSequenceManagerOptions = {}): UseSequenceManagerResult {
  const { config = {}, molstarIntegration, autoLoad } = options;
  
  // Create manager instance (stable reference)
  const managerRef = useRef<SequenceManager | null>(null);
  if (!managerRef.current) {
    managerRef.current = new SequenceManager(config);
  }
  const manager = managerRef.current;

  // State
  const [data, setData] = useState<SequenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<SequenceSelection>({ regions: [], isEmpty: true });

  // Set up Molstar integration
  useEffect(() => {
    if (molstarIntegration) {
      manager.setMolstarIntegration(molstarIntegration);
    } else {
      manager.removeMolstarIntegration();
    }
  }, [manager, molstarIntegration]);

  // Set up event listeners
  useEffect(() => {
    const handleSelectionChange = (event: SequenceEvent) => {
      if (event.data?.selection) {
        setSelection(event.data.selection);
      }
    };

    manager.addEventListener('selection-changed', handleSelectionChange);

    return () => {
      manager.removeEventListener('selection-changed', handleSelectionChange);
    };
  }, [manager]);

  // Auto-load sequence if specified
  useEffect(() => {
    if (autoLoad && !data && !loading) {
      loadSequence(autoLoad);
    }
  }, [autoLoad, data, loading]);

  // Actions
  const loadSequence = useCallback(async (pdbId: string): Promise<SequenceApiResponse<SequenceData>> => {
    setLoading(true);
    setError(null);

    try {
      const result = await manager.loadSequence(pdbId);
      
      if (result.success && result.data) {
        setData(result.data);
        setSelection(manager.getSelection());
      } else {
        setError(result.error?.message || 'Failed to load sequence');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      return {
        success: false,
        error: {
          code: 'HOOK_ERROR',
          message: errorMessage,
        },
      };
    } finally {
      setLoading(false);
    }
  }, [manager]);

  const addSelection = useCallback((region: SelectionRegion): boolean => {
    const success = manager.addSelection(region);
    if (success) {
      setSelection(manager.getSelection());
    }
    return success;
  }, [manager]);

  const removeSelection = useCallback((regionId: string): boolean => {
    const success = manager.removeSelection(regionId);
    if (success) {
      setSelection(manager.getSelection());
    }
    return success;
  }, [manager]);

  const replaceSelection = useCallback((regions: SelectionRegion[]): boolean => {
    const success = manager.replaceSelection(regions);
    if (success) {
      setSelection(manager.getSelection());
    }
    return success;
  }, [manager]);

  const clearSelection = useCallback((): void => {
    manager.clearSelection();
    setSelection(manager.getSelection());
  }, [manager]);

  const performResidueAction = useCallback(async (
    action: 'hide' | 'isolate' | 'highlight' | 'copy',
    region: SelectionRegion
  ): Promise<boolean> => {
    return manager.performResidueAction(action, region);
  }, [manager]);

  // Utilities
  const isResidueSelected = useCallback((residue: SequenceResidue): boolean => {
    return manager.isResidueSelected(residue);
  }, [manager]);

  const getResidueRegion = useCallback((residue: SequenceResidue): SelectionRegion | null => {
    return manager.getResidueRegion(residue);
  }, [manager]);

  const getAvailableChains = useCallback((): string[] => {
    return manager.getAvailableChains();
  }, [manager]);

  const updateConfig = useCallback((newConfig: Partial<SequenceConfig>): void => {
    manager.updateConfig(newConfig);
  }, [manager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        managerRef.current.destroy();
        managerRef.current = null;
      }
    };
  }, []);

  return {
    // State
    data,
    loading,
    error,
    selection,
    
    // Actions
    loadSequence,
    addSelection,
    removeSelection,
    replaceSelection,
    clearSelection,
    performResidueAction,
    
    // Utilities
    isResidueSelected,
    getResidueRegion,
    getAvailableChains,
    updateConfig,
    
    // Manager instance
    manager,
  };
}

/**
 * Hook for simple sequence loading without selection management
 */
export function useSequenceData(pdbId?: string) {
  const { data, loading, error, loadSequence } = useSequenceManager({
    config: { interactionMode: 'readonly' },
  });

  useEffect(() => {
    if (pdbId) {
      loadSequence(pdbId);
    }
  }, [pdbId, loadSequence]);

  return { data, loading, error, loadSequence };
}

/**
 * Hook for sequence selection without data management
 */
export function useSequenceSelection(initialConfig?: Partial<SequenceConfig>) {
  const { 
    selection, 
    addSelection, 
    removeSelection, 
    replaceSelection, 
    clearSelection,
    isResidueSelected,
    getResidueRegion,
    updateConfig,
    manager
  } = useSequenceManager({ config: initialConfig });

  return {
    selection,
    addSelection,
    removeSelection,
    replaceSelection,
    clearSelection,
    isResidueSelected,
    getResidueRegion,
    updateConfig,
    manager,
  };
}
