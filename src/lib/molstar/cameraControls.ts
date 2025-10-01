/**
 * Camera Control API for Mol*
 *
 * Provides utilities for camera manipulation, zoom, rotation, pan, and focus operations
 */

import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

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
  options: CameraOptions = {},
): Promise<boolean> {
  const { verbose = false } = options;

  try {
    // Use the camera manager to reset view (from dev docs)
    const cameraManager = plugin.managers.camera;
    if (cameraManager) {
      // Reset camera to default position as per dev docs
      cameraManager.reset();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Failed to zoom to fit:", error);
    return false;
  }
}

/**
 * Reset camera to default position
 */
export async function resetCamera(
  plugin: PluginUIContext,
  options: CameraOptions = {},
): Promise<boolean> {
  const { verbose = false } = options;

  try {
    // Use the camera manager to reset view (from dev docs)
    const cameraManager = plugin.managers.camera;
    if (cameraManager) {
      // Reset camera to default position as per dev docs
      cameraManager.reset();
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Failed to reset camera:", error);
    return false;
  }
}

/**
 * Focus camera on a specific chain
 */
export async function focusOnChain(
  plugin: PluginUIContext,
  chainId: string,
  options: CameraOptions = {},
): Promise<boolean> {
  const { verbose = false } = options;

  try {
    // Dynamic imports
    const { MolScriptBuilder: MS } = await import(
      "molstar/lib/mol-script/language/builder"
    );
    const { Script } = await import("molstar/lib/mol-script/script");
    const { StructureSelection } = await import(
      "molstar/lib/mol-model/structure/query"
    );

    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) {
      return false;
    }

    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) {
      return false;
    }

    // Build selection for the chain
    const chainSelection = MS.struct.generator.atomGroups({
      "chain-test": MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.label_asym_id(),
        chainId,
      ]),
    });

    const selection = Script.getStructureSelection(
      chainSelection,
      structure.cell.obj.data,
    );
    const loci = StructureSelection.toLociWithSourceUnits(selection);

    if (loci.elements?.length === 0) {
      return false;
    }

    // Focus camera on the chain using the camera manager (from dev docs)
    plugin.managers.camera.focusLoci(loci);

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
  options: CameraOptions = {},
): Promise<boolean> {
  const { verbose = false } = options;

  try {
    const selection = plugin.managers.structure.selection.entries;
    if (!selection || selection.length === 0) {
      return false;
    }

    // Check if the selection entry has loci property
    const firstSelection = selection[0];
    if (!firstSelection || !firstSelection.loci) {
      return false;
    }

    // Focus on the first selection using the camera manager (from dev docs)
    plugin.managers.camera.focusLoci(firstSelection.loci);

    return true;
  } catch (error) {
    console.error("Failed to focus on selection:", error);
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
  options: CameraOptions = {},
): Promise<boolean> {
  const { verbose = false } = options;

  try {
    // Dynamic imports
    const { MolScriptBuilder: MS } = await import(
      "molstar/lib/mol-script/language/builder"
    );
    const { Script } = await import("molstar/lib/mol-script/script");
    const { StructureSelection } = await import(
      "molstar/lib/mol-model/structure/query"
    );

    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) {
      return false;
    }

    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) {
      return false;
    }

    // Build selection for the residue range
    const residueSelection = MS.struct.generator.atomGroups({
      "chain-test": MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.label_asym_id(),
        chainId,
      ]),
      "residue-test": MS.core.logic.and([
        MS.core.rel.gr([
          MS.struct.atomProperty.macromolecular.label_seq_id(),
          startResidue - 1,
        ]),
        MS.core.rel.le([
          MS.struct.atomProperty.macromolecular.label_seq_id(),
          endResidue,
        ]),
      ]),
    });

    const selection = Script.getStructureSelection(
      residueSelection,
      structure.cell.obj.data,
    );
    const loci = StructureSelection.toLociWithSourceUnits(selection);

    if (loci.elements?.length === 0) {
      return false;
    }

    // Focus camera on the residue range using the camera manager (from dev docs)
    plugin.managers.camera.focusLoci(loci);

    return true;
  } catch (error) {
    console.error(`Failed to focus on residue range:`, error);
    return false;
  }
}

// Rotation function removed - requires complex quaternion math not yet implemented
