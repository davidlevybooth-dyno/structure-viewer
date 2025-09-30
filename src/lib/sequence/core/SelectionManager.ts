/**
 * Selection state management for sequence interface
 * Handles selection logic, validation, and state updates
 */

import type { 
  SelectionRegion, 
  SequenceSelection, 
  SelectionState,
  SelectionMode,
  SelectionConstraints,
  SequenceResidue,
  SequenceEvent,
  SequenceEventType
} from '@/types/sequence';

/**
 * Selection manager class
 * Provides robust selection state management with validation and events
 */
export class SelectionManager {
  private state: SelectionState;
  private listeners = new Map<SequenceEventType, Set<(event: SequenceEvent) => void>>();

  constructor(
    mode: SelectionMode = 'range',
    constraints: SelectionConstraints = {}
  ) {
    this.state = {
      regions: [],
      mode,
      constraints,
      lastModified: Date.now(),
    };
  }

  /**
   * Get current selection state
   */
  getSelection(): SequenceSelection {
    return {
      regions: [...this.state.regions],
      isEmpty: this.state.regions.length === 0,
    };
  }

  /**
   * Get full selection state
   */
  getState(): Readonly<SelectionState> {
    return { ...this.state };
  }

  /**
   * Add a selection region
   */
  addRegion(region: SelectionRegion): boolean {
    if (!this.validateRegion(region)) {
      return false;
    }

    // Check constraints
    if (!this.checkConstraints([...this.state.regions, region])) {
      return false;
    }

    // Handle different selection modes
    switch (this.state.mode) {
      case 'single':
        this.state.regions = [region];
        break;
      
      case 'range':
        // Replace existing selection in same chain or add new
        const existingIndex = this.state.regions.findIndex(r => r.chainId === region.chainId);
        if (existingIndex >= 0) {
          this.state.regions[existingIndex] = region;
        } else {
          this.state.regions.push(region);
        }
        break;
      
      case 'multiple':
        // Check for overlap and merge if necessary
        const merged = this.mergeOverlappingRegions([...this.state.regions, region]);
        this.state.regions = merged;
        break;
    }

    this.updateState();
    this.emitEvent('selection-changed', { selection: this.getSelection() });
    return true;
  }

  /**
   * Remove a selection region
   */
  removeRegion(regionId: string): boolean {
    const initialLength = this.state.regions.length;
    this.state.regions = this.state.regions.filter(r => r.id !== regionId);
    
    if (this.state.regions.length !== initialLength) {
      this.updateState();
      this.emitEvent('selection-changed', { selection: this.getSelection() });
      return true;
    }
    
    return false;
  }

  /**
   * Replace entire selection with new regions
   */
  replaceSelection(regions: SelectionRegion[]): boolean {
    // Validate all regions
    if (!regions.every(region => this.validateRegion(region))) {
      return false;
    }

    // Check constraints
    if (!this.checkConstraints(regions)) {
      return false;
    }

    this.state.regions = [...regions];
    this.updateState();
    this.emitEvent('selection-changed', { selection: this.getSelection() });
    return true;
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    if (this.state.regions.length > 0) {
      this.state.regions = [];
      this.updateState();
      this.emitEvent('selection-changed', { selection: this.getSelection() });
    }
  }

  /**
   * Check if a residue is selected
   */
  isResidueSelected(residue: SequenceResidue): boolean {
    return this.state.regions.some(region =>
      region.chainId === residue.chainId &&
      residue.position >= region.start &&
      residue.position <= region.end
    );
  }

  /**
   * Get the region containing a specific residue
   */
  getResidueRegion(residue: SequenceResidue): SelectionRegion | null {
    return this.state.regions.find(region =>
      region.chainId === residue.chainId &&
      residue.position >= region.start &&
      residue.position <= region.end
    ) || null;
  }

  /**
   * Get all selected residues
   */
  getSelectedResidues(): Array<{ chainId: string; position: number }> {
    const residues: Array<{ chainId: string; position: number }> = [];
    
    for (const region of this.state.regions) {
      for (let pos = region.start; pos <= region.end; pos++) {
        residues.push({ chainId: region.chainId, position: pos });
      }
    }
    
    return residues;
  }

  /**
   * Update selection mode
   */
  setMode(mode: SelectionMode): void {
    if (this.state.mode !== mode) {
      this.state.mode = mode;
      
      // Adjust current selection to fit new mode
      if (mode === 'single' && this.state.regions.length > 1) {
        this.state.regions = this.state.regions.slice(0, 1);
      }
      
      this.updateState();
      this.emitEvent('selection-changed', { selection: this.getSelection() });
    }
  }

  /**
   * Update selection constraints
   */
  setConstraints(constraints: SelectionConstraints): void {
    this.state.constraints = { ...constraints };
    
    // Validate current selection against new constraints
    const validRegions = this.state.regions.filter(region => this.validateRegion(region));
    
    if (validRegions.length !== this.state.regions.length) {
      this.state.regions = validRegions;
      this.updateState();
      this.emitEvent('selection-changed', { selection: this.getSelection() });
    }
  }

  /**
   * Add event listener
   */
  addEventListener(type: SequenceEventType, callback: (event: SequenceEvent) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(type: SequenceEventType, callback: (event: SequenceEvent) => void): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Validate a selection region
   */
  private validateRegion(region: SelectionRegion): boolean {
    // Basic validation
    if (!region.chainId || region.start < 1 || region.end < region.start) {
      return false;
    }

    // Check constraints
    const { constraints } = this.state;
    
    if (constraints.allowedChains && !constraints.allowedChains.includes(region.chainId)) {
      return false;
    }
    
    if (constraints.maxRangeSize && (region.end - region.start + 1) > constraints.maxRangeSize) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if regions satisfy constraints
   */
  private checkConstraints(regions: SelectionRegion[]): boolean {
    const { constraints } = this.state;
    
    if (constraints.maxSelections && regions.length > constraints.maxSelections) {
      return false;
    }
    
    return true;
  }

  /**
   * Merge overlapping regions in the same chain
   */
  private mergeOverlappingRegions(regions: SelectionRegion[]): SelectionRegion[] {
    const merged: SelectionRegion[] = [];
    const byChain = new Map<string, SelectionRegion[]>();
    
    // Group by chain
    for (const region of regions) {
      if (!byChain.has(region.chainId)) {
        byChain.set(region.chainId, []);
      }
      byChain.get(region.chainId)!.push(region);
    }
    
    // Merge overlapping regions in each chain
    for (const [chainId, chainRegions] of byChain) {
      const sorted = chainRegions.sort((a, b) => a.start - b.start);
      let current = sorted[0];
      
      for (let i = 1; i < sorted.length; i++) {
        const next = sorted[i];
        
        if (current.end >= next.start - 1) {
          // Merge regions
          current = {
            id: `${current.id}-merged-${next.id}`,
            chainId,
            start: current.start,
            end: Math.max(current.end, next.end),
            sequence: '', // Will be updated by caller
            label: `${chainId}:${current.start}-${Math.max(current.end, next.end)}`,
          };
        } else {
          merged.push(current);
          current = next;
        }
      }
      
      merged.push(current);
    }
    
    return merged;
  }

  /**
   * Update internal state
   */
  private updateState(): void {
    this.state.lastModified = Date.now();
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(type: SequenceEventType, data?: any): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const event: SequenceEvent = {
        type,
        timestamp: Date.now(),
        source: 'api',
        data,
      };
      
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in sequence event listener for ${type}:`, error);
        }
      });
    }
  }
}
