/**
 * Mol* Region Isolation API
 * 
 * Clean utilities for isolating chains or regions by creating components
 * and controlling visibility, following official Mol* patterns
 */

import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import { Script } from 'molstar/lib/mol-script/script';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';

export type RepresentationType = 'cartoon' | 'molecular-surface' | 'ball-and-stick' | 'spacefill';

export interface IsolationRegion {
  chain: string;
  start?: number;
  end?: number;
  useAuth?: boolean;
}

export interface IsolationOptions {
  hideOthers?: boolean;
  representation?: RepresentationType;
  name?: string;
  focusCamera?: boolean;
}

/**
 * Get the current structure cell from the plugin
 */
function getCurrentStructureCell(plugin: PluginUIContext) {
  const hierarchy = plugin.managers.structure.hierarchy.current;
  
  if (!hierarchy.structures || hierarchy.structures.length === 0) {
    console.warn('No structures found in hierarchy');
    return null;
  }
  
  const structure = hierarchy.structures[0];
  
  if (!structure?.cell?.obj?.data) {
    console.warn('No valid structure data found in hierarchy');
    return null;
  }
  
  
  return structure;
}

/**
 * Build MolScript expression for chain or region selection
 */
function buildRegionExpression({ chain, start, end, useAuth = true }: IsolationRegion) {
  const chainProp = useAuth 
    ? MS.struct.atomProperty.macromolecular.auth_asym_id()
    : MS.struct.atomProperty.macromolecular.label_asym_id();
  
  const seqProp = useAuth 
    ? MS.struct.atomProperty.macromolecular.auth_seq_id()
    : MS.struct.atomProperty.macromolecular.label_seq_id();

  const chainTest = MS.core.rel.eq([chainProp, chain]);

  if (start != null && end != null) {
    const residueTest = MS.core.rel.inRange([seqProp, start, end]);
    return MS.struct.generator.atomGroups({ 
      'chain-test': chainTest, 
      'residue-test': residueTest 
    });
  }
  
  // Whole chain
  return MS.struct.generator.atomGroups({ 'chain-test': chainTest });
}

/**
 * Isolate a specific region or chain by creating a component and controlling visibility
 */
export async function isolateRegion(
  plugin: PluginUIContext,
  region: IsolationRegion,
  options: IsolationOptions = {}
): Promise<boolean> {
  const {
    hideOthers = true,
    representation = 'cartoon',
    name = `${region.chain}${region.start ? `:${region.start}-${region.end}` : ''}`,
    focusCamera = true
  } = options;

  // Check if plugin is properly initialized
  if (!plugin || !plugin.managers) {
    console.warn('Plugin not properly initialized');
    return false;
  }

  // Check if structure hierarchy exists
  if (!plugin.managers.structure.hierarchy.current.structures.length) {
    console.warn('No structures loaded in plugin');
    return false;
  }

  try {
    const structureCell = getCurrentStructureCell(plugin);
    if (!structureCell) {
      console.warn('No structure available for isolation');
      return false;
    }

    const structureData = structureCell.cell.obj?.data;
    if (!structureData) {
      console.warn('Structure data not available');
      return false;
    }

    // Get the correct parent node (state cell, not hierarchy wrapper)
    const parent = structureCell.cell;

    // Build selection expression
    const expression = buildRegionExpression(region);
    
    // Create selection from expression
    const selection = Script.getStructureSelection(q => expression, structureData);
    
    // Create component from selection using the correct builder method
    const component = await plugin.builders.structure.tryCreateComponentFromSelection(
      parent,
      selection,
      name
    );

    if (!component) {
      console.warn('Failed to create component for region:', region);
      return false;
    }


    // Hide other components if requested
    if (hideOthers) {
      await hideOtherComponents(plugin, component.cell?.ref);
    }

    // Add representation to the isolated component using builder chain
    await plugin.builders.structure.representation.addRepresentation(component, {
      type: representation,
    });

    // Focus camera on the isolated region
    if (focusCamera && component.cell?.obj?.data) {
      const loci = component.cell.obj.data.loci;
      if (loci) {
        plugin.managers.camera.focusLoci(loci);
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to isolate region:', error);
    return false;
  }
}

/**
 * Hide all components except the specified one
 */
async function hideOtherComponents(plugin: PluginUIContext, keepRef?: string) {
  if (!keepRef) return;
  
  const hierarchy = plugin.managers.structure.hierarchy.current;
  
  for (const structure of hierarchy.structures) {
    for (const component of structure.components) {
      const shouldHide = component.cell?.ref !== keepRef;
      
      if (component.cell?.ref) {
        PluginCommands.State.SetSubtreeVisibility(plugin, {
          state: plugin.state.data,
          ref: component.cell.ref,
          visible: !shouldHide
        });
      }
    }
  }
}

/**
 * Show all components (restore full structure view)
 */
export async function showAllComponents(plugin: PluginUIContext): Promise<boolean> {
  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    
    for (const structure of hierarchy.structures) {
      for (const component of structure.components) {
        if (component.cell?.ref) {
          PluginCommands.State.SetSubtreeVisibility(plugin, {
            state: plugin.state.data,
            ref: component.cell.ref,
            visible: true
          });
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Failed to show all components:', error);
    return false;
  }
}

/**
 * Get list of available chains from current structure
 */
export function getAvailableChains(plugin: PluginUIContext): string[] {
  const structureCell = getCurrentStructureCell(plugin);
  if (!structureCell?.cell.obj?.data) return [];

  try {
    const structure = structureCell.cell.obj.data;
    const chains = new Set<string>();
    
    // Extract chain IDs from structure
    structure.models[0]?.atomicHierarchy.chains.label_asym_id.toArray().forEach(chainId => {
      if (chainId) chains.add(chainId);
    });

    return Array.from(chains).sort();
  } catch (error) {
    console.warn('Failed to extract chain IDs:', error);
    return [];
  }
}

/**
 * Check if any components are currently isolated (hidden)
 */
export function getIsolationStatus(plugin: PluginUIContext): {
  hasIsolation: boolean;
  totalComponents: number;
  visibleComponents: number;
} {
  const hierarchy = plugin.managers.structure.hierarchy.current;
  let totalComponents = 0;
  let visibleComponents = 0;

  for (const structure of hierarchy.structures) {
    for (const component of structure.components) {
      totalComponents++;
      if (component.cell?.ref) {
        const state = plugin.state.data.cells.get(component.cell.ref);
        if (state?.isHidden === false) {
          visibleComponents++;
        }
      }
    }
  }

  return {
    hasIsolation: totalComponents > 0 && visibleComponents < totalComponents,
    totalComponents,
    visibleComponents
  };
}
