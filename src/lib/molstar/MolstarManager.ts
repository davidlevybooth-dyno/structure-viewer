/**
 * Main Molstar manager class
 * Orchestrates all Molstar operations through a clean, unified API
 */

import { MolstarViewer } from './core/MolstarViewer';
import { StructureOperations } from './operations/StructureOperations';
import { SelectionOperations } from './operations/SelectionOperations';

import type { 
  MolstarConfig, 
  MolstarCallbacks, 
  RepresentationType, 
  ResidueRange, 
  HighlightOptions,
  OperationResult,
  MolstarState
} from '@/types/molstar';

/**
 * Main Molstar manager class
 * Provides a clean, production-ready API for all Molstar functionality
 */
export class MolstarManager {
  private viewer: MolstarViewer;
  private structureOps: StructureOperations | null = null;
  private selectionOps: SelectionOperations | null = null;

  constructor(callbacks: MolstarCallbacks = {}) {
    this.viewer = new MolstarViewer(callbacks);
  }

  /**
   * Initialize Molstar in the given container
   */
  async init(container: HTMLElement, config: MolstarConfig = {}): Promise<OperationResult> {
    const result = await this.viewer.init(container, config);
    
    if (result.success) {
      const plugin = this.viewer.getPlugin();
      if (plugin) {
        this.structureOps = new StructureOperations(plugin);
        this.selectionOps = new SelectionOperations(plugin);
      }
    }
    
    return result;
  }

  /**
   * Load a PDB structure
   */
  async loadPDB(pdbId: string): Promise<OperationResult> {
    return this.viewer.loadPDB(pdbId);
  }

  // === Camera Operations ===

  /**
   * Reset camera to default position
   */
  resetCamera(): void {
    this.viewer.resetCamera();
  }

  /**
   * Toggle camera spinning
   */
  toggleSpin(): void {
    this.viewer.toggleSpin();
  }

  // === Representation Operations ===

  /**
   * Update the visual representation
   */
  async updateRepresentation(representation: RepresentationType): Promise<OperationResult> {
    if (!this.structureOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'OPERATION_ERROR' } };
    }
    return this.structureOps.updateRepresentation(representation);
  }

  /**
   * Set cartoon representation
   */
  async setCartoon(): Promise<OperationResult> {
    return this.updateRepresentation('cartoon');
  }

  /**
   * Set surface representation
   */
  async setSurface(): Promise<OperationResult> {
    return this.updateRepresentation('surface');
  }

  /**
   * Set ball-and-stick representation
   */
  async setBallAndStick(): Promise<OperationResult> {
    return this.updateRepresentation('ball-stick');
  }

  /**
   * Set spacefill representation
   */
  async setSpacefill(): Promise<OperationResult> {
    return this.updateRepresentation('spacefill');
  }

  // === Chain Operations ===

  /**
   * Get available chains in the current structure
   */
  async getAvailableChains(): Promise<OperationResult<string[]>> {
    if (!this.structureOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'OPERATION_ERROR' } };
    }
    return this.structureOps.getAvailableChains();
  }

  /**
   * Hide a specific chain
   */
  async hideChain(chainId: string): Promise<OperationResult> {
    if (!this.structureOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'OPERATION_ERROR' } };
    }
    return this.structureOps.hideChain(chainId);
  }

  /**
   * Isolate a specific chain
   */
  async isolateChain(chainId: string): Promise<OperationResult> {
    if (!this.structureOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'OPERATION_ERROR' } };
    }
    return this.structureOps.isolateChain(chainId);
  }

  /**
   * Show all chains (reload structure)
   */
  async showAllChains(): Promise<OperationResult> {
    if (!this.structureOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'OPERATION_ERROR' } };
    }
    
    // Get current state and reload
    const state = this.viewer.getState();
    if (state.currentPdbId) {
      return this.loadPDB(state.currentPdbId);
    }
    
    return this.structureOps.showAllChains();
  }

  // === Component Operations ===

  /**
   * Remove water molecules
   */
  async removeWater(): Promise<OperationResult> {
    if (!this.structureOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'OPERATION_ERROR' } };
    }
    return this.structureOps.removeWater();
  }

  /**
   * Remove ligands
   */
  async removeLigands(): Promise<OperationResult> {
    if (!this.structureOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'OPERATION_ERROR' } };
    }
    return this.structureOps.removeLigands();
  }

  /**
   * Remove ions
   */
  async removeIons(): Promise<OperationResult> {
    if (!this.structureOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'OPERATION_ERROR' } };
    }
    return this.structureOps.removeIons();
  }

  // === Selection and Highlighting Operations ===

  /**
   * Highlight multiple residue ranges
   */
  async highlightResidues(ranges: ResidueRange[], options?: HighlightOptions): Promise<OperationResult> {
    if (!this.selectionOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'SELECTION_ERROR' } };
    }
    return this.selectionOps.highlightResidues(ranges, options);
  }

  /**
   * Clear all highlights
   */
  clearHighlight(): void {
    this.selectionOps?.clearHighlight();
  }

  /**
   * Hide a residue range
   */
  async hideResidueRange(chainId: string, startSeq: number, endSeq: number): Promise<OperationResult> {
    if (!this.selectionOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'SELECTION_ERROR' } };
    }
    return this.selectionOps.hideResidueRange(chainId, startSeq, endSeq);
  }

  /**
   * Isolate a residue range
   */
  async isolateResidueRange(chainId: string, startSeq: number, endSeq: number): Promise<OperationResult> {
    if (!this.selectionOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'SELECTION_ERROR' } };
    }
    return this.selectionOps.isolateResidueRange(chainId, startSeq, endSeq);
  }

  /**
   * Show/highlight a residue range
   */
  async showResidueRange(chainId: string, startSeq: number, endSeq: number): Promise<OperationResult> {
    if (!this.selectionOps) {
      return { success: false, error: { name: 'MolstarError', message: 'Not initialized', type: 'SELECTION_ERROR' } };
    }
    return this.selectionOps.showResidueRange(chainId, startSeq, endSeq);
  }

  // === State and Lifecycle ===

  /**
   * Get the current state
   */
  getState(): Readonly<MolstarState> {
    return this.viewer.getState();
  }

  /**
   * Check if ready for operations
   */
  isReady(): boolean {
    return this.viewer.isReady();
  }

  /**
   * Destroy and clean up resources
   */
  async destroy(): Promise<void> {
    this.structureOps = null;
    this.selectionOps = null;
    await this.viewer.destroy();
  }

  /**
   * Get the raw plugin instance (for advanced use cases)
   */
  getPlugin() {
    return this.viewer.getPlugin();
  }
}
