/**
 * Main sequence interface manager
 * Orchestrates data management, selection, and integration with Molstar
 */

import { SequenceDataManager } from './core/SequenceDataManager';
import { SelectionManager } from './core/SelectionManager';

import type { 
  SequenceData,
  SequenceApiResponse,
  SelectionRegion,
  SequenceSelection,
  SelectionMode,
  SelectionConstraints,
  SequenceConfig,
  SequenceResidue,
  SequenceEvent,
  SequenceEventType,
  SequenceMolstarIntegration,
  ResidueRange
} from '@/types/sequence';

/**
 * Main sequence manager class
 * Provides a unified API for all sequence interface operations
 */
export class SequenceManager {
  private dataManager: SequenceDataManager;
  private selectionManager: SelectionManager;
  private molstarIntegration: SequenceMolstarIntegration | null = null;
  private config: SequenceConfig;
  private currentData: SequenceData | null = null;

  constructor(config: Partial<SequenceConfig> = {}) {
    this.config = {
      residuesPerRow: 40,
      showRuler: true,
      showChainLabels: true,
      colorScheme: 'default',
      interactionMode: 'select',
      selectionMode: 'range',
      constraints: {},
      ...config,
    };

    this.dataManager = new SequenceDataManager();
    this.selectionManager = new SelectionManager(
      this.config.selectionMode,
      this.config.constraints
    );

    // Forward selection events
    this.selectionManager.addEventListener('selection-changed', (event) => {
      this.handleSelectionChange(event);
    });
  }

  // === Data Management ===

  /**
   * Load sequence data for a PDB ID
   */
  async loadSequence(pdbId: string): Promise<SequenceApiResponse<SequenceData>> {
    const result = await this.dataManager.fetchPDBSequence(pdbId);
    
    if (result.success && result.data) {
      this.currentData = result.data;
      this.selectionManager.clearSelection();
      
      // Update Molstar integration with available chains
      if (this.molstarIntegration) {
        try {
          const chains = await this.molstarIntegration.getAvailableChains();
          // Could emit event here for chain availability
        } catch (error) {
          console.warn('Failed to sync chains with Molstar:', error);
        }
      }
    }
    
    return result;
  }

  /**
   * Get current sequence data
   */
  getCurrentSequence(): SequenceData | null {
    return this.currentData;
  }

  /**
   * Get cached sequence data
   */
  getCachedSequence(pdbId: string): SequenceData | null {
    return this.dataManager.getCachedSequence(pdbId);
  }

  // === Selection Management ===

  /**
   * Get current selection
   */
  getSelection(): SequenceSelection {
    return this.selectionManager.getSelection();
  }

  /**
   * Add a selection region
   */
  addSelection(region: SelectionRegion): boolean {
    // Populate sequence if missing
    if (!region.sequence && this.currentData) {
      region.sequence = this.getSequenceForRegion(region);
    }
    
    const success = this.selectionManager.addRegion(region);
    
    if (success && this.molstarIntegration) {
      this.syncSelectionWithMolstar();
    }
    
    return success;
  }

  /**
   * Remove a selection region
   */
  removeSelection(regionId: string): boolean {
    const success = this.selectionManager.removeRegion(regionId);
    
    if (success && this.molstarIntegration) {
      this.syncSelectionWithMolstar();
    }
    
    return success;
  }

  /**
   * Replace entire selection
   */
  replaceSelection(regions: SelectionRegion[]): boolean {
    // Populate sequences if missing
    const populatedRegions = regions.map(region => ({
      ...region,
      sequence: region.sequence || this.getSequenceForRegion(region),
    }));
    
    const success = this.selectionManager.replaceSelection(populatedRegions);
    
    if (success && this.molstarIntegration) {
      this.syncSelectionWithMolstar();
    }
    
    return success;
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectionManager.clearSelection();
    
    if (this.molstarIntegration) {
      this.molstarIntegration.highlightResidues([]);
    }
  }

  /**
   * Check if a residue is selected
   */
  isResidueSelected(residue: SequenceResidue): boolean {
    return this.selectionManager.isResidueSelected(residue);
  }

  /**
   * Get the region containing a specific residue
   */
  getResidueRegion(residue: SequenceResidue): SelectionRegion | null {
    return this.selectionManager.getResidueRegion(residue);
  }

  // === Molstar Integration ===

  /**
   * Set Molstar integration
   */
  setMolstarIntegration(integration: SequenceMolstarIntegration): void {
    this.molstarIntegration = integration;
    
    // Sync current selection
    this.syncSelectionWithMolstar();
  }

  /**
   * Remove Molstar integration
   */
  removeMolstarIntegration(): void {
    this.molstarIntegration = null;
  }

  /**
   * Perform residue action (hide, isolate, highlight)
   */
  async performResidueAction(
    action: 'hide' | 'isolate' | 'highlight' | 'copy',
    region: SelectionRegion
  ): Promise<boolean> {
    if (!this.molstarIntegration) {
      return false;
    }

    try {
      const range: ResidueRange = {
        chainId: region.chainId,
        start: region.start,
        end: region.end,
      };

      switch (action) {
        case 'hide':
          await this.molstarIntegration.hideResidues([range]);
          break;
        case 'isolate':
          await this.molstarIntegration.isolateResidues([range]);
          break;
        case 'highlight':
          await this.molstarIntegration.highlightResidues([range]);
          break;
        case 'copy':
          await this.copySequenceToClipboard(region);
          break;
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to perform ${action} action:`, error);
      return false;
    }
  }

  // === Configuration ===

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SequenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update selection manager if relevant config changed
    if (newConfig.selectionMode) {
      this.selectionManager.setMode(newConfig.selectionMode);
    }
    
    if (newConfig.constraints) {
      this.selectionManager.setConstraints(newConfig.constraints);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<SequenceConfig> {
    return { ...this.config };
  }

  // === Event Management ===

  /**
   * Add event listener
   */
  addEventListener(type: SequenceEventType, callback: (event: SequenceEvent) => void): void {
    this.selectionManager.addEventListener(type, callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: SequenceEventType, callback: (event: SequenceEvent) => void): void {
    this.selectionManager.removeEventListener(type, callback);
  }

  // === Utility Methods ===

  /**
   * Get sequence string for a region
   */
  getSequenceForRegion(region: SelectionRegion): string {
    if (!this.currentData) {
      return '';
    }

    const chain = this.currentData.chains.find(c => c.id === region.chainId);
    if (!chain) {
      return '';
    }

    const residues = chain.residues.filter(
      r => r.position >= region.start && r.position <= region.end
    );
    
    return residues.map(r => r.code).join('');
  }

  /**
   * Copy sequence to clipboard
   */
  async copySequenceToClipboard(region: SelectionRegion): Promise<void> {
    const sequence = region.sequence || this.getSequenceForRegion(region);
    
    if (sequence) {
      try {
        await navigator.clipboard.writeText(sequence);
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = sequence;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  }

  /**
   * Get available chains
   */
  getAvailableChains(): string[] {
    if (!this.currentData) {
      return [];
    }
    
    return this.currentData.chains.map(chain => chain.id);
  }

  /**
   * Get sequence statistics
   */
  getSequenceStats() {
    if (!this.currentData) {
      return null;
    }
    
    return this.dataManager.getSequenceStats(this.currentData);
  }

  /**
   * Validate sequence data
   */
  validateSequenceData(data: any): data is SequenceData {
    return this.dataManager.validateSequenceData(data);
  }

  // === Private Methods ===

  /**
   * Handle selection change events
   */
  private handleSelectionChange(event: SequenceEvent): void {
    // Sync with Molstar if available
    if (this.molstarIntegration) {
      this.syncSelectionWithMolstar();
    }
  }

  /**
   * Sync current selection with Molstar
   */
  private async syncSelectionWithMolstar(): void {
    if (!this.molstarIntegration) {
      return;
    }

    try {
      const selection = this.selectionManager.getSelection();
      const ranges: ResidueRange[] = selection.regions.map(region => ({
        chainId: region.chainId,
        start: region.start,
        end: region.end,
      }));
      
      await this.molstarIntegration.highlightResidues(ranges);
    } catch (error) {
      console.warn('Failed to sync selection with Molstar:', error);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.dataManager.clearCache();
    this.selectionManager.clearSelection();
    this.molstarIntegration = null;
    this.currentData = null;
  }
}
