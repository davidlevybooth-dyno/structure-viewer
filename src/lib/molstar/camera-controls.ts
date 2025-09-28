/**
 * Camera Control API for Mol*
 * 
 * Provides utilities for camera manipulation, zoom, rotation, pan, and focus operations
 */

import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

export interface CameraOptions {
  /** Log progress to console (default: false) */
  verbose?: boolean;
  /** Animation duration in milliseconds (default: 250) */
  duration?: number;
}

// Zoom functions removed - not working reliably with current Molstar API

/**
 * Zoom to fit all visible content
 */
export async function zoomToFit(
  plugin: PluginUIContext,
  options: CameraOptions = {}
): Promise<boolean> {
  const { verbose = false } = options;
  
  try {
    if (verbose) console.log('🔍 Zooming to fit');
    
    // Use the camera manager to reset view (from dev docs)
    const cameraManager = plugin.managers.camera;
    if (cameraManager) {
      // Reset camera to default position as per dev docs
      cameraManager.reset();
      if (verbose) console.log('✅ Zoom to fit completed');
      return true;
    } else {
      if (verbose) console.log('❌ Camera manager not available');
      return false;
    }
    
  } catch (error) {
    console.error('Failed to zoom to fit:', error);
    return false;
  }
}

/**
 * Reset camera to default position
 */
export async function resetCamera(
  plugin: PluginUIContext,
  options: CameraOptions = {}
): Promise<boolean> {
  const { verbose = false } = options;
  
  try {
    if (verbose) console.log('📷 Resetting camera');
    
    // Use the camera manager to reset view (from dev docs)
    const cameraManager = plugin.managers.camera;
    if (cameraManager) {
      // Reset camera to default position as per dev docs
      cameraManager.reset();
      if (verbose) console.log('✅ Camera reset completed');
      return true;
    } else {
      if (verbose) console.log('❌ Camera manager not available');
      return false;
    }
    
  } catch (error) {
    console.error('Failed to reset camera:', error);
    return false;
  }
}

/**
 * Focus camera on a specific chain
 */
export async function focusOnChain(
  plugin: PluginUIContext,
  chainId: string,
  options: CameraOptions = {}
): Promise<boolean> {
  const { verbose = false } = options;
  
  try {
    if (verbose) console.log(`📷 Focusing on chain ${chainId}`);
    
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
    
    // Build selection for the chain
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
    
    // Focus camera on the chain using the camera manager (from dev docs)
    plugin.managers.camera.focusLoci(loci);
    
    if (verbose) console.log(`✅ Focused on chain ${chainId}`);
    return true;
    
  } catch (error) {
    console.error(`Failed to focus on chain ${chainId}:`, error);
    return false;
  }
}

/**
 * Focus camera on current selection
 */
export async function focusOnSelection(
  plugin: PluginUIContext,
  options: CameraOptions = {}
): Promise<boolean> {
  const { verbose = false } = options;
  
  try {
    if (verbose) console.log('📷 Focusing on current selection');
    
    const selection = plugin.managers.structure.selection.entries;
    if (!selection || selection.length === 0) {
      if (verbose) console.log('❌ No selection found');
      return false;
    }
    
    // Check if the selection entry has loci property
    const firstSelection = selection[0];
    if (!firstSelection || !firstSelection.loci) {
      if (verbose) console.log('❌ Selection has no loci data');
      return false;
    }
    
    // Focus on the first selection using the camera manager (from dev docs)
    plugin.managers.camera.focusLoci(firstSelection.loci);
    
    if (verbose) console.log('✅ Focused on selection');
    return true;
    
  } catch (error) {
    console.error('Failed to focus on selection:', error);
    return false;
  }
}

/**
 * Focus camera on a specific residue range
 */
export async function focusOnResidueRange(
  plugin: PluginUIContext,
  chainId: string,
  startResidue: number,
  endResidue: number,
  options: CameraOptions = {}
): Promise<boolean> {
  const { verbose = false } = options;
  
  try {
    if (verbose) console.log(`📷 Focusing on ${chainId}:${startResidue}-${endResidue}`);
    
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
    
    // Build selection for the residue range
    const residueSelection = MS.struct.generator.atomGroups({
      'chain-test': MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.label_asym_id(), 
        chainId
      ]),
      'residue-test': MS.core.logic.and([
        MS.core.rel.gr([MS.struct.atomProperty.macromolecular.label_seq_id(), startResidue - 1]),
        MS.core.rel.le([MS.struct.atomProperty.macromolecular.label_seq_id(), endResidue])
      ]),
    });
    
    const selection = Script.getStructureSelection(residueSelection, structure.cell.obj.data);
    const loci = StructureSelection.toLociWithSourceUnits(selection);
    
    if (loci.elements?.length === 0) {
      if (verbose) console.log(`❌ Residue range ${chainId}:${startResidue}-${endResidue} not found`);
      return false;
    }
    
    // Focus camera on the residue range using the camera manager (from dev docs)
    plugin.managers.camera.focusLoci(loci);
    
    if (verbose) console.log(`✅ Focused on ${chainId}:${startResidue}-${endResidue}`);
    return true;
    
  } catch (error) {
    console.error(`Failed to focus on residue range:`, error);
    return false;
  }
}

// Rotation function removed - requires complex quaternion math not yet implemented
