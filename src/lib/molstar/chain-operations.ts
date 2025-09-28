/**
 * Chain Operations API for Mol*
 * 
 * Provides utilities for chain visibility, isolation, coloring, and labeling
 * Based on proven patterns from experimental testing
 */

import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

export interface ChainInfo {
  id: string;
  label: string;
  residueCount: number;
  isVisible: boolean;
}

export interface ChainOperationOptions {
  /** Log progress to console (default: false) */
  verbose?: boolean;
  /** Focus camera after operation (default: true) */
  focusCamera?: boolean;
}

/**
 * Get list of available chains from current structure
 */
export function getAvailableChains(plugin: PluginUIContext): string[] {
  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) return [];

    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) return [];

    const structureData = structure.cell.obj.data;
    const chains = new Set<string>();
    
    // Extract chain IDs from structure
    for (const unit of structureData.units) {
      if (unit.kind === 0) { // atomic unit
        const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
        const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
        if (chainId) chains.add(chainId);
      }
    }

    return Array.from(chains).sort();
  } catch (error) {
    console.warn('Failed to extract chain IDs:', error);
    return [];
  }
}

/**
 * Get detailed information about available chains
 */
export function getChainInfo(plugin: PluginUIContext): ChainInfo[] {
  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) return [];

    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) return [];

    const structureData = structure.cell.obj.data;
    const chainMap = new Map<string, ChainInfo>();
    
    // Extract chain information
    for (const unit of structureData.units) {
      if (unit.kind === 0) { // atomic unit
        const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
        const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
        const chainLabel = unit.model.atomicHierarchy.chains.label_comp_id?.value(chainIndex) || chainId;
        
        if (chainId && !chainMap.has(chainId)) {
          chainMap.set(chainId, {
            id: chainId,
            label: chainLabel || chainId,
            residueCount: unit.elements.length, // Approximate
            isVisible: true // TODO: Check actual visibility
          });
        }
      }
    }

    return Array.from(chainMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.warn('Failed to extract chain info:', error);
    return [];
  }
}

/**
 * Hide a specific chain using the selection + subtraction method
 */
export async function hideChain(
  plugin: PluginUIContext,
  chainId: string,
  options: ChainOperationOptions = {}
): Promise<boolean> {
  const { verbose = false } = options;
  
  try {
    if (verbose) console.log(`🎯 Hiding chain ${chainId}...`);
    
    // Dynamic imports
    const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
    const { Script } = await import('molstar/lib/mol-script/script');
    const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
    
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) {
      if (verbose) console.log('❌ No structures found');
      return false;
    }
    
    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) {
      if (verbose) console.log('❌ No structure data found');
      return false;
    }
    
    // Build selection for the chain to hide
    const chainSelection = MS.struct.generator.atomGroups({
      'chain-test': MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.label_asym_id(), 
        chainId
      ])
    });
    
    const selection = Script.getStructureSelection(chainSelection, structure.cell.obj.data);
    const loci = StructureSelection.toLociWithSourceUnits(selection);
    
    if (loci.elements?.length === 0) {
      if (verbose) console.log(`❌ Chain ${chainId} not found`);
      return false;
    }
    
    // Apply selection and subtract from components
    plugin.managers.structure.selection.fromLoci('set', loci);
    const allComponents = hierarchy.structures.flatMap(s => s.components);
    await plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
    plugin.managers.structure.selection.clear();
    
    if (verbose) console.log(`✅ Chain ${chainId} hidden successfully`);
    return true;
    
  } catch (error) {
    console.error(`Failed to hide chain ${chainId}:`, error);
    return false;
  }
}

/**
 * Isolate a specific chain (hide all others)
 */
export async function isolateChain(
  plugin: PluginUIContext,
  chainId: string,
  options: ChainOperationOptions = {}
): Promise<boolean> {
  const { verbose = false, focusCamera = true } = options;
  
  try {
    if (verbose) console.log(`🎯 Isolating chain ${chainId}...`);
    
    // Dynamic imports
    const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
    const { Script } = await import('molstar/lib/mol-script/script');
    const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
    
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) {
      if (verbose) console.log('❌ No structures found');
      return false;
    }
    
    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) {
      if (verbose) console.log('❌ No structure data found');
      return false;
    }
    
    const structureData = structure.cell.obj.data;
    const allComponents = hierarchy.structures.flatMap(s => s.components);
    
    // Get all chains except the target
    const allChains = new Set<string>();
    for (const unit of structureData.units) {
      if (unit.kind === 0) {
        const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
        const currentChainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
        if (currentChainId) allChains.add(currentChainId);
      }
    }
    allChains.delete(chainId);
    
    if (verbose) console.log(`🎯 Hiding chains: ${Array.from(allChains).join(', ')}, keeping: ${chainId}`);
    
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
    
    // Focus camera on the isolated chain
    if (focusCamera) {
      const keepChainSelection = MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_asym_id(), 
          chainId
        ])
      });
      
      const keepSelection = Script.getStructureSelection(keepChainSelection, structureData);
      const keepLoci = StructureSelection.toLociWithSourceUnits(keepSelection);
      
      if (keepLoci.elements?.length > 0) {
        setTimeout(() => {
          try {
            plugin.managers.camera.focusLoci(keepLoci);
          } catch (error) {
            console.warn('Failed to focus camera on isolated chain:', error);
          }
        }, 200);
      }
    }
    
    if (verbose) console.log(`✅ Chain ${chainId} isolated successfully`);
    return true;
    
  } catch (error) {
    console.error(`Failed to isolate chain ${chainId}:`, error);
    return false;
  }
}

/**
 * Show all chains (restore full structure view)
 */
export async function showAllChains(plugin: PluginUIContext): Promise<boolean> {
  try {
    // For now, we'll reload the page as this is the most reliable way
    // to restore the original structure state
    window.location.reload();
    return true;
  } catch (error) {
    console.error('Failed to show all chains:', error);
    return false;
  }
}

/**
 * Color chains by different schemes
 */
export async function colorChainsByScheme(
  plugin: PluginUIContext,
  scheme: 'chain-id' | 'polymer-id' | 'entity-id' | 'uniform',
  options: ChainOperationOptions = {}
): Promise<boolean> {
  const { verbose = false } = options;
  
  try {
    if (verbose) console.log(`🎨 Applying color scheme: ${scheme}`);
    
    const hierarchy = plugin.managers.structure.hierarchy.current;
    const update = plugin.state.data.build();
    
    // Update existing representations with new color scheme
    for (const structure of hierarchy.structures) {
      for (const component of structure.components) {
        for (const representation of component.representations) {
          update.to(representation.cell.transform.ref).update({
            colorTheme: { name: scheme, params: {} }
          });
        }
      }
    }
    
    await update.commit();
    
    if (verbose) console.log(`✅ Color scheme ${scheme} applied`);
    return true;
    
  } catch (error) {
    console.error(`Failed to apply color scheme ${scheme}:`, error);
    return false;
  }
}
