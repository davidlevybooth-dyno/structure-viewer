/**
 * Chain Operations for Molstar
 * Based on working implementations from dlb/regions branch
 */

import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

/**
 * Get available chains from the current structure
 */
export function getAvailableChains(plugin: PluginUIContext): string[] {
  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) return [];

    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) return [];

    const structureData = structure.cell.obj.data;
    const chains = new Set<string>();
    
    // Each unit typically represents a different chain or part of a chain
    for (const unit of structureData.units) {
      if (unit.kind === 0) { // atomic unit
        const model = unit.model;
        const chainTable = model.atomicHierarchy.chains;
        
        // Get all unique chain IDs from this unit
        const unitChains = new Set<string>();
        for (let i = 0; i < unit.elements.length; i++) {
          const element = unit.elements[i];
          const chainIndex = model.atomicHierarchy.chainAtomSegments.index[element];
          const chainId = chainTable.label_asym_id.value(chainIndex);
          if (chainId && !unitChains.has(chainId)) {
            unitChains.add(chainId);
            chains.add(chainId);
          }
        }
      }
    }

    return Array.from(chains).sort();
  } catch (error) {
    console.warn('Failed to extract chains:', error);
    return [];
  }
}

/**
 * Hide a specific chain using selection + subtraction method
 */
export async function hideChain(plugin: PluginUIContext, chainId: string): Promise<boolean> {
  if (!plugin || !chainId) return false;
  
  try {
    // Import MolScript modules
    const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
    const { Script } = await import('molstar/lib/mol-script/script');
    const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
    
    // Get structure reference
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures?.length) {
      console.error('No structures found in hierarchy');
      return false;
    }
    
    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) {
      console.error('Invalid structure or missing data');
      return false;
    }
    
    const structureData = structure.cell.obj.data;
    const allComponents = hierarchy.structures.flatMap(s => s.components);
    
    // Build selection for the chain to hide
    const chainSelection = MS.struct.generator.atomGroups({
      'chain-test': MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.label_asym_id(), 
        chainId
      ])
    });
    
    // Execute selection
    const selection = Script.getStructureSelection(chainSelection, structureData);
    const loci = StructureSelection.toLociWithSourceUnits(selection);
    
    if (loci.elements?.length === 0) {
      console.warn(`No atoms found for chain ${chainId}`);
      return false;
    }
    
    // Apply selection and subtract (hide) the chain
    plugin.managers.structure.selection.fromLoci('set', loci);
    await plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
    plugin.managers.structure.selection.clear();
    
    console.log(`✅ Hidden chain ${chainId}`);
    return true;
    
  } catch (error) {
    console.error(`Failed to hide chain ${chainId}:`, error);
    return false;
  }
}

/**
 * Isolate a chain by hiding all other chains
 */
export async function isolateChain(plugin: PluginUIContext, chainId: string): Promise<boolean> {
  if (!plugin || !chainId) return false;
  
  try {
    // Import MolScript modules
    const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
    const { Script } = await import('molstar/lib/mol-script/script');
    const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
    
    // Get structure reference
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures?.length) {
      console.error('No structures found in hierarchy');
      return false;
    }
    
    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) {
      console.error('Invalid structure or missing data');
      return false;
    }
    
    const structureData = structure.cell.obj.data;
    const allComponents = hierarchy.structures.flatMap(s => s.components);
    
    // Get all chains except the target chain
    const allChains = new Set<string>();
    for (const unit of structureData.units) {
      if (unit.kind === 0) {
        const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
        const currentChainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
        if (currentChainId) allChains.add(currentChainId);
      }
    }
    allChains.delete(chainId); // Remove target chain from hide list
    
    // Hide each other chain
    for (const hideChainId of Array.from(allChains)) {
      const chainSelection = MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_asym_id(), 
          hideChainId
        ])
      });
      
      const selection = Script.getStructureSelection(chainSelection, structureData);
      const loci = StructureSelection.toLociWithSourceUnits(selection);
      
      if (loci.elements?.length > 0) {
        plugin.managers.structure.selection.fromLoci('set', loci);
        await plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
        plugin.managers.structure.selection.clear();
      }
    }
    
    console.log(`✅ Isolated chain ${chainId}`);
    return true;
    
  } catch (error) {
    console.error(`Failed to isolate chain ${chainId}:`, error);
    return false;
  }
}

/**
 * Show all chains by reloading the page (simple but reliable reset)
 */
export async function showAllChains(plugin: PluginUIContext): Promise<boolean> {
  try {
    window.location.reload();
    return true;
  } catch (error) {
    console.error('Failed to show all chains:', error);
    return false;
  }
}