import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import type { PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginCommands } from 'molstar/lib/mol-plugin/commands';
import type { 
  MolstarConfig, 
  LoadStructureOptions, 
  SelectionTarget,
  RepresentationType,
  ColorScheme,
  PDBStructure 
} from '@/types/molstar';

/**
 * Create a custom Molstar plugin specification
 */
export async function createMolstarSpec(config: MolstarConfig = {}): Promise<PluginUISpec> {
  const spec = DefaultPluginUISpec();
  
  // Configure layout
  spec.layout = {
    initial: {
      isExpanded: false,
      showControls: config.showStructureControls ?? true,
      controlsDisplay: 'reactive',
    },
  };
  
  // Configure UI components
  spec.components = {
    ...spec.components,
    controls: {
      ...spec.components?.controls,
      // Hide sequence panel if requested (this is the key feature!)
      top: config.hideSequencePanel ? 'none' : undefined,
      // Hide log panel if requested
      bottom: config.hideLogPanel ? 'none' : undefined,
      left: 'none',
      right: undefined, // Keep right panel for structure controls
    },
  };

  // Configure canvas
  if (config.backgroundColor) {
    const { Color } = await import('molstar/lib/mol-util/color');
    spec.canvas3d = {
      ...spec.canvas3d,
      renderer: {
        ...spec.canvas3d?.renderer,
        backgroundColor: Color(config.backgroundColor),
      },
    };
  }

  return spec;
}

/**
 * Load a PDB structure with specified options
 */
export async function loadPDBStructure(
  plugin: PluginUIContext, 
  options: LoadStructureOptions
): Promise<void> {
  try {
    // Clear existing structures first
    await clearStructures(plugin);

    // Build download URL
    const url = `https://files.rcsb.org/download/${options.id.toLowerCase()}.cif`;
    
    // Load structure data
    const data = await plugin.builders.data.download({ 
      url,
      isBinary: false 
    }, { state: { isGhost: false } });

    // Parse trajectory
    const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif');
    
    // Create model (with assembly if specified)
    const modelParams = options.assemblyId 
      ? { modelIndex: 0, structureAssemblyId: options.assemblyId }
      : { modelIndex: 0 };
    
    const model = await plugin.builders.structure.createModel(trajectory, modelParams);
    const structure = await plugin.builders.structure.createStructure(model);

    // Apply representation
    const representation = options.representation ?? 'cartoon';
    const colorScheme = options.colorScheme ?? 'chain-id';
    
    await plugin.builders.structure.representation.addRepresentation(structure, {
      type: representation,
      color: colorScheme,
    });

    // Focus camera if requested
    if (options.autoFocus !== false) {
      plugin.managers.camera.focusLoci(structure.data!);
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load PDB ${options.id}: ${message}`);
  }
}

/**
 * Clear all loaded structures
 */
export async function clearStructures(plugin: PluginUIContext): Promise<void> {
  await PluginCommands.State.RemoveObject(plugin, { 
    state: plugin.state.data, 
    ref: plugin.state.data.tree.root.ref 
  });
}

/**
 * Create a molecular selection
 */
export async function createSelection(
  plugin: PluginUIContext,
  target: SelectionTarget,
  label?: string
): Promise<void> {
  // This is a simplified implementation
  // In a full implementation, you'd use Molstar's selection language
  console.log('Creating selection:', target, label);
  // TODO: Implement full selection logic using Molstar's selection system
}

/**
 * Apply a representation to current structures
 */
export async function applyRepresentation(
  plugin: PluginUIContext,
  type: RepresentationType,
  colorScheme?: ColorScheme
): Promise<void> {
  // Get current structures
  const structures = plugin.managers.structure.hierarchy.current.structures;
  
  for (const structure of structures) {
    for (const component of structure.components) {
      // Remove existing representations
      for (const repr of component.representations) {
        await plugin.managers.structure.hierarchy.remove([repr]);
      }
      
      // Add new representation
      await plugin.builders.structure.representation.addRepresentation(component.cell, {
        type,
        color: colorScheme ?? 'chain-id',
      });
    }
  }
}

/**
 * Export current structure
 */
export async function exportStructure(
  plugin: PluginUIContext,
  format: 'cif' | 'pdb' = 'cif'
): Promise<string> {
  // This would use Molstar's export functionality
  // For now, return a placeholder
  console.log('Exporting structure in format:', format);
  return 'Export functionality would be implemented here';
}

/**
 * Get information about currently loaded structures
 */
export function getCurrentStructures(plugin: PluginUIContext): PDBStructure[] {
  const structures = plugin.managers.structure.hierarchy.current.structures;
  
  return structures.map(structure => {
    // Extract basic structure information
    const model = structure.model;
    const entry = model.entryId;
    
    return {
      id: entry.toUpperCase(),
      title: model.label,
      chains: [], // Would be populated from structure data
    };
  });
}

/**
 * Focus camera on a specific selection
 */
export function focusSelection(
  plugin: PluginUIContext,
  target: SelectionTarget
): void {
  // This would create a selection and focus the camera on it
  console.log('Focusing on selection:', target);
  // TODO: Implement selection-based camera focus
}

/**
 * Reset camera to default view
 */
export function resetCamera(plugin: PluginUIContext, durationMs = 1000): void {
  plugin.managers.camera.reset(undefined, durationMs);
}
