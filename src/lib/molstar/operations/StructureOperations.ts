/**
 * Structure manipulation operations for Molstar
 * Handles representations, chain operations, and component management
 */

import { Script } from 'molstar/lib/mol-script/script';
import { StructureSelection } from 'molstar/lib/mol-model/structure';

import type { 
  MolstarPlugin, 
  RepresentationType, 
  ChainOperation, 
  ComponentType, 
  OperationResult,
  MolstarError 
} from '@/types/molstar';

/**
 * Structure operations class
 * Provides methods for manipulating molecular structures in Molstar
 */
export class StructureOperations {
  constructor(private plugin: MolstarPlugin) {}

  /**
   * Change the visual representation of the structure
   */
  async updateRepresentation(representation: RepresentationType): Promise<OperationResult> {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      if (!hierarchy.structures.length) {
        return { success: false, error: this.createError('No structures loaded', 'OPERATION_ERROR') };
      }

      const structure = hierarchy.structures[0];
      const representations = structure.components.filter(c => c.cell.obj?.label.includes('Representation'));
      
      if (representations.length === 0) {
        return { success: false, error: this.createError('No representations found', 'OPERATION_ERROR') };
      }

      const representationRef = representations[0];
      const update = this.plugin.build();

      // Map representation types to Molstar types
      const representationMap: Record<RepresentationType, string> = {
        'cartoon': 'cartoon',
        'surface': 'molecular-surface',
        'ball-stick': 'ball-and-stick',
        'spacefill': 'spacefill'
      };

      const molstarType = representationMap[representation];
      if (!molstarType) {
        return { success: false, error: this.createError(`Unknown representation: ${representation}`, 'OPERATION_ERROR') };
      }

      // Update representation
      update.to(representationRef.cell.transform.ref).update({
        type: molstarType,
        colorTheme: { name: 'chain-id' },
      });

      await update.commit();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: this.createError(`Failed to update representation: ${error}`, 'OPERATION_ERROR', { representation, originalError: error })
      };
    }
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

  /**
   * Get available chains in the current structure
   */
  async getAvailableChains(): Promise<OperationResult<string[]>> {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      if (!hierarchy.structures.length) {
        return { success: true, data: [] };
      }

      const structure = hierarchy.structures[0];
      const data = structure.cell?.obj?.data;
      if (!data) {
        return { success: true, data: [] };
      }

      const chainIds = new Set<string>();
      
      for (const unit of data.units) {
        const chains = unit.model.atomicHierarchy.chains;
        for (let i = 0; i < chains.count; i++) {
          const chainId = chains.auth_asym_id.value(i);
          chainIds.add(chainId);
        }
      }

      return { success: true, data: Array.from(chainIds).sort() };
    } catch (error) {
      return { 
        success: false, 
        error: this.createError(`Failed to get available chains: ${error}`, 'OPERATION_ERROR', { originalError: error })
      };
    }
  }

  /**
   * Hide a specific chain
   */
  async hideChain(chainId: string): Promise<OperationResult> {
    return this.performChainOperation(chainId, 'hide');
  }

  /**
   * Isolate a specific chain (hide all others)
   */
  async isolateChain(chainId: string): Promise<OperationResult> {
    return this.performChainOperation(chainId, 'isolate');
  }

  /**
   * Show all chains (reload structure)
   */
  async showAllChains(): Promise<OperationResult> {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      if (!hierarchy.structures.length) {
        return { success: false, error: this.createError('No structures loaded', 'OPERATION_ERROR') };
      }

      // Get current PDB ID and reload
      const structure = hierarchy.structures[0];
      const data = structure.cell?.obj?.data;
      if (!data) {
        return { success: false, error: this.createError('No structure data available', 'OPERATION_ERROR') };
      }

      // Clear the current structure and reload
      const update = this.plugin.build();
      update.delete(structure.cell.transform.ref);
      await update.commit();

      // Reload would need to be handled by the viewer class
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: this.createError(`Failed to show all chains: ${error}`, 'OPERATION_ERROR', { originalError: error })
      };
    }
  }

  /**
   * Remove water molecules
   */
  async removeWater(): Promise<OperationResult> {
    return this.removeComponent('water');
  }

  /**
   * Remove ligands
   */
  async removeLigands(): Promise<OperationResult> {
    return this.removeComponent('ligands');
  }

  /**
   * Remove ions
   */
  async removeIons(): Promise<OperationResult> {
    return this.removeComponent('ions');
  }

  /**
   * Perform chain operation (hide/isolate)
   */
  private async performChainOperation(chainId: string, operation: ChainOperation): Promise<OperationResult> {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      if (!hierarchy.structures.length) {
        return { success: false, error: this.createError('No structures loaded', 'OPERATION_ERROR') };
      }

      const structure = hierarchy.structures[0];
      const data = structure.cell?.obj?.data;
      if (!data) {
        return { success: false, error: this.createError('No structure data available', 'OPERATION_ERROR') };
      }

      if (operation === 'isolate') {
        // Hide all other chains
        const availableResult = await this.getAvailableChains();
        if (!availableResult.success || !availableResult.data) {
          return availableResult;
        }

        for (const currentChain of availableResult.data) {
          if (currentChain !== chainId) {
            const hideResult = await this.hideChainInternal(currentChain, data, hierarchy);
            if (!hideResult.success) {
              return hideResult;
            }
          }
        }
      } else if (operation === 'hide') {
        return this.hideChainInternal(chainId, data, hierarchy);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: this.createError(`Failed to ${operation} chain ${chainId}: ${error}`, 'OPERATION_ERROR', { chainId, operation, originalError: error })
      };
    }
  }

  /**
   * Internal method to hide a specific chain
   */
  private async hideChainInternal(chainId: string, data: any, hierarchy: any): Promise<OperationResult> {
    try {
      const selection = Script.getStructureSelection((Q: any) => Q.struct.generator.atomGroups({
        'chain-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.auth_asym_id(), chainId])
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
        error: this.createError(`Failed to hide chain ${chainId}: ${error}`, 'OPERATION_ERROR', { chainId, originalError: error })
      };
    }
  }

  /**
   * Remove specific component type
   */
  private async removeComponent(componentType: ComponentType): Promise<OperationResult> {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      if (!hierarchy.structures.length) {
        return { success: false, error: this.createError('No structures loaded', 'OPERATION_ERROR') };
      }

      const structure = hierarchy.structures[0];
      const data = structure.cell?.obj?.data;
      if (!data) {
        return { success: false, error: this.createError('No structure data available', 'OPERATION_ERROR') };
      }

      // Define component queries
      const componentQueries: Record<ComponentType, (Q: any) => any> = {
        water: (Q: any) => Q.struct.generator.atomGroups({
          'residue-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'HOH'])
        }),
        ligands: (Q: any) => Q.struct.generator.atomGroups({
          'entity-test': Q.core.rel.eq([Q.struct.atomProperty.macromolecular.entityType(), 'non-polymer'])
        }),
        ions: (Q: any) => Q.struct.generator.atomGroups({
          'residue-test': Q.core.logic.or([
            Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'NA']),
            Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'CL']),
            Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'MG']),
            Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'CA']),
            Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'ZN']),
            Q.core.rel.eq([Q.struct.atomProperty.macromolecular.label_comp_id(), 'FE'])
          ])
        })
      };

      const selection = Script.getStructureSelection(componentQueries[componentType], data);
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
        error: this.createError(`Failed to remove ${componentType}: ${error}`, 'OPERATION_ERROR', { componentType, originalError: error })
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
