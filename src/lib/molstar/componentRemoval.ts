/**
 * Component Removal Utilities for Mol*
 *
 * Based on official Mol* GitHub issues and maintainer recommendations:
 * - Uses selection + subtraction method (not visibility toggling)
 * - Properly removes bonds along with atoms
 * - Works with any residue type
 *
 * References:
 * - https://github.com/molstar/molstar/issues/970
 * - https://github.com/molstar/molstar/discussions/1234
 */

import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

export interface ComponentRemovalOptions {
  /** Clear selection after removal (default: true) */
  clearSelection?: boolean;
  /** Log progress to console (default: false) */
  verbose?: boolean;
}

/**
 * Remove water molecules (HOH residues) from the structure
 */
export async function removeWaterMolecules(
  plugin: PluginUIContext,
  options: ComponentRemovalOptions = {},
): Promise<boolean> {
  const { clearSelection = true, verbose = false } = options;

  try {
    // Dynamic imports to avoid build issues
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
    if (!structure.cell?.obj?.data) {
      return false;
    }

    // Build selection for water molecules (HOH residues)
    const waterExpression = MS.struct.generator.atomGroups({
      "residue-test": MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.label_comp_id(),
        "HOH",
      ]),
    });

    // Create selection and convert to loci
    const waterSelection = Script.getStructureSelection(
      waterExpression,
      structure.cell.obj.data,
    );
    const waterLoci = StructureSelection.toLociWithSourceUnits(waterSelection);

    if (waterLoci.elements?.length === 0) {
      return false;
    }

    // Add to selection and subtract from components
    plugin.managers.structure.selection.fromLoci("set", waterLoci);

    const allComponents = hierarchy.structures.flatMap((s) => s.components);
    if (allComponents.length > 0) {
      await plugin.managers.structure.component.modifyByCurrentSelection(
        allComponents,
        "subtract",
      );
    }

    if (clearSelection) {
      plugin.managers.structure.selection.clear();
    }

    return true;
  } catch (error) {
    console.error("Failed to remove water molecules:", error);
    return false;
  }
}

/**
 * Remove ligand molecules by residue name
 */
export async function removeLigandMolecules(
  plugin: PluginUIContext,
  ligandNames: string[] = ["HEM", "ATP", "ADP", "NAD", "FAD"],
  options: ComponentRemovalOptions = {},
): Promise<boolean> {
  const { clearSelection = true, verbose = false } = options;

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
    if (!structure.cell?.obj?.data) {
      return false;
    }

    // Build selection for ligand molecules - process each ligand separately
    const allComponents = hierarchy.structures.flatMap((s) => s.components);
    let totalRemoved = false;

    for (const ligandName of ligandNames) {
      const ligandSelection = MS.struct.generator.atomGroups({
        "residue-test": MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_comp_id(),
          ligandName,
        ]),
      });

      const selection = Script.getStructureSelection(
        ligandSelection,
        structure.cell.obj.data,
      );
      const loci = StructureSelection.toLociWithSourceUnits(selection);

      if (loci.elements?.length > 0) {
        plugin.managers.structure.selection.fromLoci("set", loci);
        await plugin.managers.structure.component.modifyByCurrentSelection(
          allComponents,
          "subtract",
        );
        totalRemoved = true;
      }
    }

    if (clearSelection) {
      plugin.managers.structure.selection.clear();
    }

    return totalRemoved;
  } catch (error) {
    console.error("Failed to remove ligand molecules:", error);
    return false;
  }
}

/**
 * Remove ion molecules (common ion types)
 */
export async function removeIonMolecules(
  plugin: PluginUIContext,
  ionNames: string[] = ["NA", "CL", "K", "MG", "CA", "ZN", "FE"],
  options: ComponentRemovalOptions = {},
): Promise<boolean> {
  const { clearSelection = true, verbose = false } = options;

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
    if (!structure.cell?.obj?.data) {
      return false;
    }

    // Build selection for ion molecules - process each ion separately
    const allComponents = hierarchy.structures.flatMap((s) => s.components);
    let totalRemoved = false;

    for (const ionName of ionNames) {
      const ionSelection = MS.struct.generator.atomGroups({
        "residue-test": MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_comp_id(),
          ionName,
        ]),
      });

      const selection = Script.getStructureSelection(
        ionSelection,
        structure.cell.obj.data,
      );
      const loci = StructureSelection.toLociWithSourceUnits(selection);

      if (loci.elements?.length > 0) {
        plugin.managers.structure.selection.fromLoci("set", loci);
        await plugin.managers.structure.component.modifyByCurrentSelection(
          allComponents,
          "subtract",
        );
        totalRemoved = true;
      }
    }

    if (clearSelection) {
      plugin.managers.structure.selection.clear();
    }

    return totalRemoved;
  } catch (error) {
    console.error("Failed to remove ion molecules:", error);
    return false;
  }
}

/**
 * Convenience function to remove common unwanted components
 */
export async function removeCommonUnwantedComponents(
  plugin: PluginUIContext,
  options: ComponentRemovalOptions & {
    removeWater?: boolean;
    removeLigands?: boolean;
    removeIons?: boolean;
    customLigands?: string[];
    customIons?: string[];
  } = {},
): Promise<{ water: boolean; ligands: boolean; ions: boolean }> {
  const {
    removeWater = true,
    removeLigands = true,
    removeIons = true,
    customLigands = ["HEM", "ATP", "ADP", "NAD", "FAD"],
    customIons = ["NA", "CL", "K", "MG", "CA", "ZN", "FE"],
    ...baseOptions
  } = options;

  const results = {
    water: false,
    ligands: false,
    ions: false,
  };

  if (removeWater) {
    results.water = await removeWaterMolecules(plugin, baseOptions);
  }

  if (removeLigands) {
    results.ligands = await removeLigandMolecules(
      plugin,
      customLigands,
      baseOptions,
    );
  }

  if (removeIons) {
    results.ions = await removeIonMolecules(plugin, customIons, baseOptions);
  }

  return results;
}
