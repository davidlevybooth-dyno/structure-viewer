import { useRef, useEffect, useState, useCallback } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import type { 
  MolstarViewerProps, 
  MolstarConfig, 
  LoadStructureOptions,
  PDBStructure,
  SelectionTarget,
  RepresentationType,
  ColorScheme 
} from '@/types/molstar';
import { 
  createMolstarSpec,
  loadPDBStructure,
  clearStructures,
  getCurrentStructures,
  applyRepresentation,
  resetCamera,
  focusSelection 
} from '@/lib/molstar-utils';

interface UseMolstarState {
  plugin: PluginUIContext | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  currentStructures: PDBStructure[];
}

interface UseMolstarActions {
  loadStructure: (options: LoadStructureOptions) => Promise<void>;
  clearStructures: () => Promise<void>;
  applyRepresentation: (type: RepresentationType, colorScheme?: ColorScheme) => Promise<void>;
  createSelection: (target: SelectionTarget, label?: string) => Promise<void>;
  focusSelection: (target: SelectionTarget) => void;
  resetCamera: (duration?: number) => void;
  exportStructure: (format?: 'cif' | 'pdb') => Promise<string>;
}

interface UseMolstarReturn {
  state: UseMolstarState;
  actions: UseMolstarActions;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Custom hook for managing Molstar plugin lifecycle and operations
 */
export function useMolstar(
  config: MolstarConfig = {},
  events: Pick<MolstarViewerProps, 'onReady' | 'onError' | 'onStructureLoaded'> = {}
): UseMolstarReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<PluginUIContext | null>(null);
  const rootRef = useRef<any>(null);
  
  const [state, setState] = useState<UseMolstarState>({
    plugin: null,
    isInitialized: false,
    isLoading: false,
    error: null,
    currentStructures: [],
  });

  // Initialize Molstar plugin
  const initializePlugin = useCallback(async () => {
    if (!containerRef.current || pluginRef.current) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Dynamic imports to avoid SSR issues
      const { PluginUIContext } = await import('molstar/lib/mol-plugin-ui/context');
      const { Plugin } = await import('molstar/lib/mol-plugin-ui/plugin');
      const { createRoot } = await import('react-dom/client');
      const React = await import('react');

      // Create plugin with custom spec
      const spec = createMolstarSpec(config);
      const plugin = new PluginUIContext(spec);
      await plugin.init();

      // Mount React component
      const root = createRoot(containerRef.current);
      root.render(React.createElement(Plugin, { plugin }));

      // Store references
      pluginRef.current = plugin;
      rootRef.current = root;

      // Update state
      setState(prev => ({
        ...prev,
        plugin,
        isInitialized: true,
        isLoading: false,
        currentStructures: getCurrentStructures(plugin),
      }));

      // Trigger ready event
      events.onReady?.(plugin);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize Molstar';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: message 
      }));
      events.onError?.(message);
    }
  }, [config, events]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
      }
      if (pluginRef.current) {
        pluginRef.current.dispose();
      }
    };
  }, []);

  // Initialize when container is available
  useEffect(() => {
    if (containerRef.current && !pluginRef.current) {
      initializePlugin();
    }
  }, [initializePlugin]);

  // Actions
  const actions: UseMolstarActions = {
    loadStructure: useCallback(async (options: LoadStructureOptions) => {
      if (!pluginRef.current) throw new Error('Plugin not initialized');
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        await loadPDBStructure(pluginRef.current, options);
        
        const structures = getCurrentStructures(pluginRef.current);
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          currentStructures: structures 
        }));
        
        // Trigger structure loaded event
        if (structures.length > 0) {
          events.onStructureLoaded?.(structures[0]);
        }
        
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load structure';
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: message 
        }));
        events.onError?.(message);
        throw error;
      }
    }, [events]),

    clearStructures: useCallback(async () => {
      if (!pluginRef.current) throw new Error('Plugin not initialized');
      
      await clearStructures(pluginRef.current);
      setState(prev => ({ 
        ...prev, 
        currentStructures: [] 
      }));
    }, []),

    applyRepresentation: useCallback(async (type: RepresentationType, colorScheme?: ColorScheme) => {
      if (!pluginRef.current) throw new Error('Plugin not initialized');
      
      await applyRepresentation(pluginRef.current, type, colorScheme);
    }, []),

    createSelection: useCallback(async (target: SelectionTarget, label?: string) => {
      if (!pluginRef.current) throw new Error('Plugin not initialized');
      
      // TODO: Implement full selection creation
      console.log('Creating selection:', target, label);
    }, []),

    focusSelection: useCallback((target: SelectionTarget) => {
      if (!pluginRef.current) throw new Error('Plugin not initialized');
      
      focusSelection(pluginRef.current, target);
    }, []),

    resetCamera: useCallback((duration = 1000) => {
      if (!pluginRef.current) throw new Error('Plugin not initialized');
      
      resetCamera(pluginRef.current, duration);
    }, []),

    exportStructure: useCallback(async (format: 'cif' | 'pdb' = 'cif') => {
      if (!pluginRef.current) throw new Error('Plugin not initialized');
      
      // TODO: Implement actual export
      return `Export would return ${format} data here`;
    }, []),
  };

  return {
    state,
    actions,
    containerRef,
  };
}
