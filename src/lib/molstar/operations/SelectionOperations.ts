/**
 * Selection and highlighting operations for Molstar
 * Handles residue-level selections, highlighting, and range operations
 */

import { Script } from 'molstar/lib/mol-script/script';
import { StructureSelection } from 'molstar/lib/mol-model/structure';
import { Color } from 'molstar/lib/mol-util/color';

import type { 
  MolstarPlugin, 
  ResidueRange, 
  ResidueOperation, 
  HighlightOptions,
  OperationResult,
  MolstarError 
} from '@/types/molstar';

/**
 * Selection operations class
 * Provides methods for selecting, highlighting, and manipulating residue ranges
 */
export class SelectionOperations {
  constructor(private plugin: MolstarPlugin) {}

  /**
   * Highlight multiple residue ranges
   */
  async highlightResidues(ranges: ResidueRange[], options: HighlightOptions = {}): Promise<OperationResult> {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      if (!hierarchy.structures.length) {
        return { success: false, error: this.createError('No structures loaded', 'SELECTION_ERROR') };
      }

      const structure = hierarchy.structures[0];
      const data = structure.cell?.obj?.data;
      if (!data) {
        return { success: false, error: this.createError('No structure data available', 'SELECTION_ERROR') };
      }

      // Clear existing highlights if requested
      if (options.clearExisting !== false) {
        this.clearHighlight();
      }

      // Highlight each range
      for (const range of ranges) {
        const selection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
          'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), range.chainId]),
          'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), range.start, range.end]),
          'group-by': Q.struct.atomProperty.macromolecular.residueKey()
        }), data);

        const loci = StructureSelection.toLociWithSourceUnits(selection);
        
        if (!loci.isEmpty) {
          const color = options.color ? Color.fromHex(options.color) : Color.fromHex('#FF6B35');
          this.plugin.managers.interactivity.lociHighlights.highlight({ loci }, color);
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: this.createError(`Failed to highlight residues: ${error}`, 'SELECTION_ERROR', { ranges, options, originalError: error })
      };
    }
  }

  /**
   * Clear all highlights
   */
  clearHighlight(): void {
    try {
      this.plugin.managers.interactivity.lociHighlights.clearHighlights();
    } catch (error) {
      console.warn('Failed to clear highlights:', error);
    }
  }

  /**
   * Hide a residue range
   */
  async hideResidueRange(chainId: string, startSeq: number, endSeq: number): Promise<OperationResult> {
    return this.performResidueOperation({ chainId, start: startSeq, end: endSeq }, 'hide');
  }

  /**
   * Isolate a residue range (hide everything else)
   */
  async isolateResidueRange(chainId: string, startSeq: number, endSeq: number): Promise<OperationResult> {
    return this.performResidueOperation({ chainId, start: startSeq, end: endSeq }, 'isolate');
  }

  /**
   * Show/highlight a residue range
   */
  async showResidueRange(chainId: string, startSeq: number, endSeq: number): Promise<OperationResult> {
    return this.highlightResidues([{ chainId, start: startSeq, end: endSeq }]);
  }

  /**
   * Perform residue-level operations
   */
  private async performResidueOperation(range: ResidueRange, operation: ResidueOperation): Promise<OperationResult> {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      if (!hierarchy.structures.length) {
        return { success: false, error: this.createError('No structures loaded', 'SELECTION_ERROR') };
      }

      const structure = hierarchy.structures[0];
      const data = structure.cell?.obj?.data;
      if (!data) {
        return { success: false, error: this.createError('No structure data available', 'SELECTION_ERROR') };
      }

      switch (operation) {
        case 'hide':
          return this.hideResidueRangeInternal(range, data, hierarchy);
        
        case 'isolate':
          return this.isolateResidueRangeInternal(range, data, hierarchy);
        
        case 'highlight':
          return this.highlightResidues([range]);
        
        default:
          return { success: false, error: this.createError(`Unknown operation: ${operation}`, 'SELECTION_ERROR') };
      }
    } catch (error) {
      return { 
        success: false, 
        error: this.createError(`Failed to perform ${operation} on residue range: ${error}`, 'SELECTION_ERROR', { range, operation, originalError: error })
      };
    }
  }

  /**
   * Internal method to hide a residue range
   */
  private async hideResidueRangeInternal(range: ResidueRange, data: any, hierarchy: any): Promise<OperationResult> {
    try {
      const selection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
        'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), range.chainId]),
        'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), range.start, range.end])
      }), data);

      const loci = StructureSelection.toLociWithSourceUnits(selection);
      
      if (!loci.isEmpty) {
        this.plugin.managers.structure.selection.fromLoci('set', loci);
        const allComponents = hierarchy.structures.flatMap((s: any) => s.components);
        await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
        this.plugin.managers.structure.selection.clear();
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: this.createError(`Failed to hide residue range: ${error}`, 'SELECTION_ERROR', { range, originalError: error })
      };
    }
  }

  /**
   * Internal method to isolate a residue range
   */
  private async isolateResidueRangeInternal(range: ResidueRange, data: any, hierarchy: any): Promise<OperationResult> {
    try {
      // Get all available chains
      const chainIds = new Set<string>();
      for (const unit of data.units) {
        const chains = unit.model.atomicHierarchy.chains;
        for (let i = 0; i < chains.count; i++) {
          const chainId = chains.auth_asym_id.value(i);
          chainIds.add(chainId);
        }
      }

      const allChains = Array.from(chainIds);

      // Hide everything except the target residue range
      for (const currentChain of allChains) {
        if (currentChain !== range.chainId) {
          // Hide entire other chains
          const hideChainSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
            'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), currentChain])
          }), data);

          const hideChainLoci = StructureSelection.toLociWithSourceUnits(hideChainSelection);
          
          if (!hideChainLoci.isEmpty) {
            this.plugin.managers.structure.selection.fromLoci('set', hideChainLoci);
            const allComponents = hierarchy.structures.flatMap((s: any) => s.components);
            await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
            this.plugin.managers.structure.selection.clear();
          }
        } else {
          // For the target chain, hide residues before startSeq
          if (range.start > 1) {
            const hideBeforeSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
              'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), range.chainId]),
              'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), 1, range.start - 1])
            }), data);

            const hideBeforeLoci = StructureSelection.toLociWithSourceUnits(hideBeforeSelection);
            
            if (!hideBeforeLoci.isEmpty) {
              this.plugin.managers.structure.selection.fromLoci('set', hideBeforeLoci);
              const allComponents = hierarchy.structures.flatMap((s: any) => s.components);
              await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
              this.plugin.managers.structure.selection.clear();
            }
          }

          // For the target chain, hide residues after endSeq
          // Use a reasonable upper bound (most proteins don't exceed 10000 residues)
          const maxResidue = 10000;
          
          if (range.end < maxResidue) {
            const hideAfterSelection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
              'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), range.chainId]),
              'residue-test': Q.core.rel.inRange([Q.struct.atomProperty.macromolecular.auth_seq_id(), range.end + 1, maxResidue])
            }), data);

            const hideAfterLoci = StructureSelection.toLociWithSourceUnits(hideAfterSelection);
            
            if (!hideAfterLoci.isEmpty) {
              this.plugin.managers.structure.selection.fromLoci('set', hideAfterLoci);
              const allComponents = hierarchy.structures.flatMap((s: any) => s.components);
              await this.plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
              this.plugin.managers.structure.selection.clear();
            }
          }
        }
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: this.createError(`Failed to isolate residue range: ${error}`, 'SELECTION_ERROR', { range, originalError: error })
      };
    }
  }

  /**
   * Create a standardized error object
   */
  private createError(message: string, type: MolstarError['type'], details?: Record<string, unknown>): MolstarError {
    return {
      name: 'MolstarError',
      message,
      type,
      details,
    };
  }
}
