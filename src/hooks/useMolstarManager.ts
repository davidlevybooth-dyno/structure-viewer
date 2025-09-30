/**
 * React hook for Molstar manager integration
 * Provides a clean React interface to the Molstar management system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MolstarManager } from '@/lib/molstar/MolstarManager';

import type { 
  MolstarConfig, 
  MolstarCallbacks, 
  RepresentationType, 
  ResidueRange, 
  OperationResult,
  MolstarState,
  MolstarEvent
} from '@/types/molstar';

interface UseMolstarManagerOptions {
  config?: MolstarConfig;
  callbacks?: MolstarCallbacks;
  autoInit?: boolean;
}

interface UseMolstarManagerResult {
  // State
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  state: MolstarState | null;
  
  // Core actions
  init: (container: HTMLElement) => Promise<OperationResult>;
  loadPDB: (pdbId: string) => Promise<OperationResult>;
  destroy: () => Promise<void>;
  
  // Camera actions
  resetCamera: () => void;
  toggleSpin: () => void;
  
  // Representation actions
  setCartoon: () => Promise<OperationResult>;
  setSurface: () => Promise<OperationResult>;
  setBallAndStick: () => Promise<OperationResult>;
  setSpacefill: () => Promise<OperationResult>;
  updateRepresentation: (representation: RepresentationType) => Promise<OperationResult>;
  
  // Chain actions
  getAvailableChains: () => Promise<OperationResult<string[]>>;
  hideChain: (chainId: string) => Promise<OperationResult>;
  isolateChain: (chainId: string) => Promise<OperationResult>;
  showAllChains: () => Promise<OperationResult>;
  
  // Component actions
  removeWater: () => Promise<OperationResult>;
  removeLigands: () => Promise<OperationResult>;
  removeIons: () => Promise<OperationResult>;
  
  // Selection actions
  highlightResidues: (ranges: ResidueRange[]) => Promise<OperationResult>;
  clearHighlight: () => void;
  hideResidueRange: (chainId: string, start: number, end: number) => Promise<OperationResult>;
  isolateResidueRange: (chainId: string, start: number, end: number) => Promise<OperationResult>;
  showResidueRange: (chainId: string, start: number, end: number) => Promise<OperationResult>;
  
  // Utilities
  isReady: () => boolean;
  getPlugin: () => any;
  
  // Manager instance
  manager: MolstarManager;
}

/**
 * React hook for Molstar manager
 * Provides a complete interface to Molstar functionality with React state management
 */
export function useMolstarManager(options: UseMolstarManagerOptions = {}): UseMolstarManagerResult {
  const { config = {}, callbacks = {}, autoInit = false } = options;
  
  // Create manager instance (stable reference)
  const managerRef = useRef<MolstarManager | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  
  if (!managerRef.current) {
    // Enhanced callbacks to update React state
    const enhancedCallbacks: MolstarCallbacks = {
      ...callbacks,
      onInitialized: (event: MolstarEvent) => {
        setIsInitialized(true);
        setError(null);
        callbacks.onInitialized?.(event);
      },
      onStructureLoaded: (event: MolstarEvent) => {
        setIsLoading(false);
        setError(null);
        updateState();
        callbacks.onStructureLoaded?.(event);
      },
      onStructureFailed: (event: MolstarEvent) => {
        setIsLoading(false);
        setError(event.data?.error?.message || 'Failed to load structure');
        callbacks.onStructureFailed?.(event);
      },
      onOperationStarted: (event: MolstarEvent) => {
        if (event.data?.type === 'structure-loading') {
          setIsLoading(true);
        }
        callbacks.onOperationStarted?.(event);
      },
      onOperationCompleted: (event: MolstarEvent) => {
        if (event.data?.type === 'structure-loading') {
          setIsLoading(false);
        }
        updateState();
        callbacks.onOperationCompleted?.(event);
      },
      onOperationFailed: (event: MolstarEvent) => {
        if (event.data?.type === 'structure-loading') {
          setIsLoading(false);
        }
        setError(event.data?.error?.message || 'Operation failed');
        callbacks.onOperationFailed?.(event);
      },
    };
    
    managerRef.current = new MolstarManager(enhancedCallbacks);
  }
  const manager = managerRef.current;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<MolstarState | null>(null);

  // Update state helper
  const updateState = useCallback(() => {
    if (manager.isReady()) {
      setState(manager.getState());
    }
  }, [manager]);

  // Auto-initialize if container is available
  useEffect(() => {
    if (autoInit && containerRef.current && !isInitialized) {
      init(containerRef.current);
    }
  }, [autoInit, isInitialized]);

  // Core actions
  const init = useCallback(async (container: HTMLElement): Promise<OperationResult> => {
    containerRef.current = container;
    setError(null);
    
    try {
      const result = await manager.init(container, config);
      
      if (result.success) {
        setIsInitialized(true);
        updateState();
      } else {
        setError(result.error?.message || 'Failed to initialize');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      return {
        success: false,
        error: {
          name: 'MolstarError',
          message: errorMessage,
          type: 'INITIALIZATION_ERROR',
        },
      };
    }
  }, [manager, config, updateState]);

  const loadPDB = useCallback(async (pdbId: string): Promise<OperationResult> => {
    setIsLoading(true);
    setError(null);
    
    const result = await manager.loadPDB(pdbId);
    
    if (!result.success) {
      setIsLoading(false);
      setError(result.error?.message || 'Failed to load PDB');
    }
    
    return result;
  }, [manager]);

  const destroy = useCallback(async (): Promise<void> => {
    await manager.destroy();
    setIsInitialized(false);
    setIsLoading(false);
    setError(null);
    setState(null);
    containerRef.current = null;
  }, [manager]);

  // Camera actions
  const resetCamera = useCallback((): void => {
    manager.resetCamera();
  }, [manager]);

  const toggleSpin = useCallback((): void => {
    manager.toggleSpin();
  }, [manager]);

  // Representation actions
  const setCartoon = useCallback(async (): Promise<OperationResult> => {
    const result = await manager.setCartoon();
    updateState();
    return result;
  }, [manager, updateState]);

  const setSurface = useCallback(async (): Promise<OperationResult> => {
    const result = await manager.setSurface();
    updateState();
    return result;
  }, [manager, updateState]);

  const setBallAndStick = useCallback(async (): Promise<OperationResult> => {
    const result = await manager.setBallAndStick();
    updateState();
    return result;
  }, [manager, updateState]);

  const setSpacefill = useCallback(async (): Promise<OperationResult> => {
    const result = await manager.setSpacefill();
    updateState();
    return result;
  }, [manager, updateState]);

  const updateRepresentation = useCallback(async (representation: RepresentationType): Promise<OperationResult> => {
    const result = await manager.updateRepresentation(representation);
    updateState();
    return result;
  }, [manager, updateState]);

  // Chain actions
  const getAvailableChains = useCallback(async (): Promise<OperationResult<string[]>> => {
    return manager.getAvailableChains();
  }, [manager]);

  const hideChain = useCallback(async (chainId: string): Promise<OperationResult> => {
    const result = await manager.hideChain(chainId);
    updateState();
    return result;
  }, [manager, updateState]);

  const isolateChain = useCallback(async (chainId: string): Promise<OperationResult> => {
    const result = await manager.isolateChain(chainId);
    updateState();
    return result;
  }, [manager, updateState]);

  const showAllChains = useCallback(async (): Promise<OperationResult> => {
    const result = await manager.showAllChains();
    updateState();
    return result;
  }, [manager, updateState]);

  // Component actions
  const removeWater = useCallback(async (): Promise<OperationResult> => {
    const result = await manager.removeWater();
    updateState();
    return result;
  }, [manager, updateState]);

  const removeLigands = useCallback(async (): Promise<OperationResult> => {
    const result = await manager.removeLigands();
    updateState();
    return result;
  }, [manager, updateState]);

  const removeIons = useCallback(async (): Promise<OperationResult> => {
    const result = await manager.removeIons();
    updateState();
    return result;
  }, [manager, updateState]);

  // Selection actions
  const highlightResidues = useCallback(async (ranges: ResidueRange[]): Promise<OperationResult> => {
    return manager.highlightResidues(ranges);
  }, [manager]);

  const clearHighlight = useCallback((): void => {
    manager.clearHighlight();
  }, [manager]);

  const hideResidueRange = useCallback(async (chainId: string, start: number, end: number): Promise<OperationResult> => {
    const result = await manager.hideResidueRange(chainId, start, end);
    updateState();
    return result;
  }, [manager, updateState]);

  const isolateResidueRange = useCallback(async (chainId: string, start: number, end: number): Promise<OperationResult> => {
    const result = await manager.isolateResidueRange(chainId, start, end);
    updateState();
    return result;
  }, [manager, updateState]);

  const showResidueRange = useCallback(async (chainId: string, start: number, end: number): Promise<OperationResult> => {
    return manager.showResidueRange(chainId, start, end);
  }, [manager]);

  // Utilities
  const isReady = useCallback((): boolean => {
    return manager.isReady();
  }, [manager]);

  const getPlugin = useCallback(() => {
    return manager.getPlugin();
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
    isInitialized,
    isLoading,
    error,
    state,
    
    // Core actions
    init,
    loadPDB,
    destroy,
    
    // Camera actions
    resetCamera,
    toggleSpin,
    
    // Representation actions
    setCartoon,
    setSurface,
    setBallAndStick,
    setSpacefill,
    updateRepresentation,
    
    // Chain actions
    getAvailableChains,
    hideChain,
    isolateChain,
    showAllChains,
    
    // Component actions
    removeWater,
    removeLigands,
    removeIons,
    
    // Selection actions
    highlightResidues,
    clearHighlight,
    hideResidueRange,
    isolateResidueRange,
    showResidueRange,
    
    // Utilities
    isReady,
    getPlugin,
    
    // Manager instance
    manager,
  };
}
