/**
 * Core Molstar viewer initialization and management
 * Handles plugin lifecycle, loading, and basic configuration
 */

import { createPluginUI } from 'molstar/lib/mol-plugin-ui';
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import { Asset } from 'molstar/lib/mol-util/assets';
import { BuiltInTrajectoryFormat } from 'molstar/lib/mol-plugin-state/formats/trajectory';

import type { 
  MolstarPlugin, 
  MolstarConfig, 
  MolstarState, 
  MolstarError, 
  OperationResult,
  MolstarCallbacks,
  MolstarEvent
} from '@/types/molstar';

/**
 * Core Molstar viewer class
 * Responsible for plugin initialization, structure loading, and basic lifecycle management
 */
export class MolstarViewer {
  private plugin: MolstarPlugin | null = null;
  private container: HTMLElement | null = null;
  private state: MolstarState;
  private callbacks: MolstarCallbacks;

  constructor(callbacks: MolstarCallbacks = {}) {
    this.callbacks = callbacks;
    this.state = {
      isInitialized: false,
      isLoading: false,
      loadedStructures: [],
      currentRepresentation: 'cartoon',
      hiddenChains: new Set(),
      hiddenComponents: new Set(),
      activeOperations: [],
    };
  }

  /**
   * Initialize the Molstar plugin in the given container
   */
  async init(container: HTMLElement, config: MolstarConfig = {}): Promise<OperationResult> {
    try {
      if (this.plugin) {
        await this.destroy();
      }

      this.container = container;
      
      // Clear container
      container.innerHTML = '';

      // Create plugin with configuration
      const spec = {
        ...DefaultPluginUISpec(),
        layout: {
          initial: {
            isExpanded: config.layoutIsExpanded ?? false,
            showControls: config.layoutShowControls ?? false,
            regionState: {
              bottom: 'hidden',
              left: 'hidden',
              right: 'hidden',
              top: 'hidden',
            },
          },
        },
        canvas3d: {
          camera: {
            helper: { axes: { name: 'off', params: {} } },
          },
          renderer: {
            backgroundColor: 'white',
          },
        },
        components: {
          remoteState: config.layoutShowRemoteState ?? 'none',
          viewport: {
            canvas3d: {
              controls: {
                showExpand: config.viewportShowExpand ?? false,
                showSelectionMode: config.viewportShowSelectionMode ?? false,
                showAnimation: config.viewportShowAnimation ?? false,
              },
            },
          },
        },
      };

      this.plugin = await createPluginUI(container, spec);
      
      // Render the UI
      renderReact18(this.plugin.render, container);

      // Configure canvas settings
      await PluginCommands.Canvas3D.SetSettings(this.plugin, {
        settings: {
          renderer: { backgroundColor: 'white' },
          camera: { helper: { axes: { name: 'off', params: {} } } },
        },
      });

      // Force windowed mode
      await PluginCommands.Layout.Update(this.plugin, {
        state: {
          regionState: {
            bottom: 'hidden',
            left: 'hidden', 
            right: 'hidden',
            top: 'hidden',
          },
          isExpanded: false,
        },
      });

      this.state.isInitialized = true;
      this.emitEvent('initialized');

      return { success: true };
    } catch (error) {
      const molstarError: MolstarError = {
        name: 'MolstarError',
        message: `Failed to initialize Molstar: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'INITIALIZATION_ERROR',
        details: { originalError: error },
      };

      this.emitEvent('operation-failed', { 
        id: 'init', 
        type: 'initialization', 
        status: 'failed', 
        error: molstarError 
      });

      return { success: false, error: molstarError };
    }
  }

  /**
   * Load a PDB structure
   */
  async loadPDB(pdbId: string): Promise<OperationResult> {
    if (!this.plugin) {
      return { 
        success: false, 
        error: { 
          name: 'MolstarError',
          message: 'Plugin not initialized', 
          type: 'OPERATION_ERROR' 
        } 
      };
    }

    try {
      this.state.isLoading = true;
      this.emitEvent('operation-started', {
        id: `load-${pdbId}`,
        type: 'structure-loading',
        status: 'running'
      });

      const url = `https://www.ebi.ac.uk/pdbe/static/entry/${pdbId.toLowerCase()}_updated.cif`;

      // Download data
      const data = await this.plugin.builders.data.download(
        { url: Asset.Url(url), isBinary: false },
        { state: { isGhost: false } }
      );

      // Parse structure
      const trajectory = await this.plugin.builders.structure.parseTrajectory(data, 'mmcif');

      // Create model
      const model = await this.plugin.builders.structure.createModel(trajectory);

      // Create structure
      const structure = await this.plugin.builders.structure.createStructure(model);

      // Apply cartoon representation
      await this.plugin.builders.structure.representation.addRepresentation(structure, {
        type: 'cartoon',
        colorTheme: { name: 'chain-id' },
      });

      this.state.currentPdbId = pdbId;
      this.state.isLoading = false;
      
      if (!this.state.loadedStructures.includes(pdbId)) {
        this.state.loadedStructures.push(pdbId);
      }

      this.emitEvent('structure-loaded', { pdbId });
      this.emitEvent('operation-completed', {
        id: `load-${pdbId}`,
        type: 'structure-loading',
        status: 'completed'
      });

      return { success: true, data: { pdbId } };
    } catch (error) {
      this.state.isLoading = false;
      
      const molstarError: MolstarError = {
        name: 'MolstarError',
        message: `Failed to load PDB ${pdbId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'LOADING_ERROR',
        details: { pdbId, originalError: error },
      };

      this.emitEvent('structure-failed', { pdbId, error: molstarError });
      this.emitEvent('operation-failed', {
        id: `load-${pdbId}`,
        type: 'structure-loading',
        status: 'failed',
        error: molstarError
      });

      return { success: false, error: molstarError };
    }
  }

  /**
   * Reset camera to default position
   */
  resetCamera(): void {
    if (!this.plugin) return;
    
    PluginCommands.Camera.Reset(this.plugin, {});
  }

  /**
   * Toggle camera spinning
   */
  toggleSpin(): void {
    if (!this.plugin) return;
    
    const spinning = this.plugin.canvas3d?.props.camera.spinning ?? false;
    PluginCommands.Camera.SetSpin(this.plugin, { value: !spinning });
  }

  /**
   * Destroy the plugin and clean up resources
   */
  async destroy(): Promise<void> {
    if (this.plugin) {
      this.plugin.dispose();
      this.plugin = null;
    }
    
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }

    this.state.isInitialized = false;
    this.state.isLoading = false;
    this.state.loadedStructures = [];
    this.state.activeOperations = [];
  }

  /**
   * Get the current plugin instance
   */
  getPlugin(): MolstarPlugin | null {
    return this.plugin;
  }

  /**
   * Get the current state
   */
  getState(): Readonly<MolstarState> {
    return { ...this.state };
  }

  /**
   * Check if plugin is ready for operations
   */
  isReady(): boolean {
    return this.state.isInitialized && !this.state.isLoading && this.plugin !== null;
  }

  /**
   * Emit events to registered callbacks
   */
  private emitEvent<T = unknown>(type: string, data?: T): void {
    const event: MolstarEvent<T> = {
      type: type as any,
      timestamp: Date.now(),
      data,
    };

    // Call appropriate callback
    switch (type) {
      case 'initialized':
        this.callbacks.onInitialized?.(event);
        break;
      case 'structure-loaded':
        this.callbacks.onStructureLoaded?.(event);
        break;
      case 'structure-failed':
        this.callbacks.onStructureFailed?.(event);
        break;
      case 'operation-started':
        this.callbacks.onOperationStarted?.(event);
        break;
      case 'operation-completed':
        this.callbacks.onOperationCompleted?.(event);
        break;
      case 'operation-failed':
        this.callbacks.onOperationFailed?.(event);
        break;
    }
  }
}
