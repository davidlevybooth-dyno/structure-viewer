'use client';

import { useEffect } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

// Custom hooks (business logic)
import { useMolstarPlugin } from '@/hooks/use-molstar-plugin';
import { useStructureLoader, type LoadStructureOptions } from '@/hooks/use-structure-loader';

// UI Components (presentation)
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { MolstarContainer } from '@/components/ui/MolstarContainer';
import { StatusIndicator } from '@/components/ui/StatusIndicator';

export interface MolstarViewerProps {
  /** PDB ID to load initially */
  pdbId?: string;
  /** CSS class name for the container */
  className?: string;
  /** Configuration for the Molstar plugin */
  config?: {
    hideSequencePanel?: boolean;
    hideLogPanel?: boolean;
    hideLeftPanel?: boolean;
    showRightPanel?: boolean;
  };
  /** Structure loading options */
  loadOptions?: Omit<LoadStructureOptions, 'pdbId'>;
  /** Called when the Molstar plugin is ready */
  onReady?: (plugin: PluginUIContext) => void;
  /** Called when a structure is successfully loaded */
  onStructureLoaded?: (pdbId: string) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
}

/* Main Molstar viewer component */
export function MolstarViewer({
  pdbId,
  className = '',
  config = {
    hideSequencePanel: false,
    hideLogPanel: true,
    hideLeftPanel: true,
    showRightPanel: false,
  },
  loadOptions = {},
  onReady,
  onStructureLoaded,
  onError,
}: MolstarViewerProps) {
  // Plugin lifecycle management
  const { containerRef, state: pluginState, plugin } = useMolstarPlugin({
    config,
    onReady,
    onError,
  });

  // Structure loading management  
  const { state: loadingState, loadStructure } = useStructureLoader(plugin, {
    onStructureLoaded,
    onError,
  });

  // Load initial structure when plugin is ready and pdbId is provided
  useEffect(() => {
    // Simple condition check - only load if everything is ready and we don't have this structure loaded
    if (
      pluginState.isInitialized && 
      pdbId && 
      plugin && 
      !loadingState.isLoading &&
      loadingState.currentPdbId !== pdbId.toUpperCase()
    ) {
      // Add a delay to ensure plugin is fully ready and reference is passed down
      const timer = setTimeout(() => {
        loadStructure({
          pdbId,
          representation: 'cartoon',
          colorScheme: 'chain-id',
          autoFocus: true,
          ...loadOptions,
        }).catch(() => {
          // Error handled by useStructureLoader
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [pluginState.isInitialized, pdbId]);

  // Handle retry functionality
  const handleRetry = () => {
    if (pdbId && plugin) {
      loadStructure({
        pdbId,
        representation: 'cartoon',
        colorScheme: 'chain-id',
        autoFocus: true,
        ...loadOptions,
      }).catch(() => {
        // Error handled by useStructureLoader
      });
    } else {
      window.location.reload();
    }
  };

  // Error state - prioritize plugin errors over loading errors
  if (pluginState.error) {
    return (
      <ErrorDisplay
        error={pluginState.error}
        title="Failed to Initialize Viewer"
        onRetry={() => window.location.reload()}
        className={className}
      />
    );
  }

  if (loadingState.error) {
    return (
      <ErrorDisplay
        error={loadingState.error}
        title="Failed to Load Structure"
        onRetry={handleRetry}
        className={className}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading overlay */}
      {(pluginState.isLoading || loadingState.isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <LoadingSpinner 
            message={
              pluginState.isLoading 
                ? 'Initializing Molstar...' 
                : `Loading ${pdbId}...`
            }
            size="md"
          />
        </div>
      )}
      
      {/* Molstar container */}
      <MolstarContainer 
        ref={containerRef}
        className="w-full h-full"
      />
      
      {/* Status indicator */}
      <StatusIndicator
        isReady={pluginState.isInitialized}
        currentStructure={loadingState.currentPdbId || undefined}
      />
    </div>
  );
}

export default MolstarViewer;