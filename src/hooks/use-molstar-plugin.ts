import { useRef, useEffect, useState } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

interface MolstarPluginState {
  plugin: PluginUIContext | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

interface MolstarPluginConfig {
  hideSequencePanel?: boolean;
  hideLogPanel?: boolean;
  hideLeftPanel?: boolean;
  showRightPanel?: boolean;
}

interface UseMolstarPluginOptions {
  config?: MolstarPluginConfig;
  onReady?: (plugin: PluginUIContext) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for managing Molstar plugin lifecycle
 * Simplified to avoid infinite loops
 */
export function useMolstarPlugin(options: UseMolstarPluginOptions = {}) {
  const { config = {}, onReady, onError } = options;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<PluginUIContext | null>(null);
  const rootRef = useRef<any>(null);
  const initializationStartedRef = useRef(false);
  
  const [state, setState] = useState<MolstarPluginState>({
    plugin: null,
    isInitialized: false,
    isLoading: true,
    error: null,
  });

  // Initialize plugin - runs only once
  useEffect(() => {
    // Prevent multiple initializations
    if (initializationStartedRef.current || !containerRef.current) return;
    initializationStartedRef.current = true;

    let mounted = true;

    const initialize = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Dynamic imports
        const [
          { PluginUIContext },
          { DefaultPluginUISpec },
          { Plugin },
          { createRoot },
          React
        ] = await Promise.all([
          import('molstar/lib/mol-plugin-ui/context'),
          import('molstar/lib/mol-plugin-ui/spec'),
          import('molstar/lib/mol-plugin-ui/plugin'),
          import('react-dom/client'),
          import('react')
        ]);

        if (!mounted) return;

        // Create plugin spec
        const spec = DefaultPluginUISpec();
        spec.components = {
          ...spec.components,
          controls: {
            ...spec.components?.controls,
            top: config.hideSequencePanel ? 'none' : undefined,
            bottom: config.hideLogPanel ? 'none' : undefined,
            left: config.hideLeftPanel ? 'none' : undefined,
            right: config.showRightPanel ? undefined : 'none',
          },
        };

        // Initialize plugin
        const plugin = new PluginUIContext(spec);
        await plugin.init();

        if (!mounted) return;

        // Mount React component
        const root = createRoot(containerRef.current!);
        root.render(React.createElement(Plugin, { plugin }));

        // Store references
        pluginRef.current = plugin;
        rootRef.current = root;

        if (mounted) {
          setState(prev => ({
            ...prev,
            plugin,
            isInitialized: true,
            isLoading: false,
          }));
          onReady?.(plugin);
        }

      } catch (err) {
        if (mounted) {
          const message = err instanceof Error ? err.message : 'Failed to initialize Molstar';
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: message 
          }));
          onError?.(message);
        }
      }
    };

    initialize();

    // Cleanup function
    return () => {
      mounted = false;
      
      if (rootRef.current) {
        try {
          rootRef.current.unmount();
        } catch (e) {
          console.warn('Error unmounting React root:', e);
        }
      }
      
      if (pluginRef.current) {
        try {
          pluginRef.current.dispose();
        } catch (e) {
          console.warn('Error disposing Molstar plugin:', e);
        }
      }
    };
  }, []); // Empty dependency array - only run once

  return {
    containerRef,
    state,
    plugin: pluginRef.current,
  };
}