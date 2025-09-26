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

import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import { Script } from 'molstar/lib/mol-script/script';
import { StructureSelection } from 'molstar/lib/mol-model/structure/query';

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
  options: ComponentRemovalOptions = {}
): Promise<boolean> {
  const { clearSelection = true, verbose = false } = options;
  
  try {
    if (verbose) console.log('🎯 Removing water molecules (HOH)...');
    
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) {
      if (verbose) console.log('❌ No structures found');
      return false;
    }
    
    const structure = hierarchy.structures[0];
    if (!structure.cell?.obj?.data) {
      if (verbose) console.log('❌ No structure data found');
      return false;
    }
    
    // Build selection for water molecules (HOH residues)
    const waterExpression = MS.struct.generator.atomGroups({
      'residue-test': MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.label_comp_id(), 'HOH'
      ])
    });
    
    // Create selection and convert to loci
    const waterSelection = Script.getStructureSelection(q => waterExpression, structure.cell.obj.data);
    const waterLoci = StructureSelection.toLociWithSourceUnits(waterSelection);
    
    if (waterLoci.isEmpty) {
      if (verbose) console.log('❌ No water molecules found');
      return false;
    }
    
    // Add to selection and subtract from components
    plugin.managers.structure.selection.fromLoci('set', waterLoci);
    
    const sel = plugin.managers.structure.hierarchy.getStructuresWithSelection();
    const componentsToModify: any[] = [];
    
    for (const s of sel) {
      componentsToModify.push(...s.components);
    }
    
    if (componentsToModify.length > 0) {
      plugin.managers.structure.component.modifyByCurrentSelection(componentsToModify, 'subtract');
      if (verbose) console.log(`✅ Removed water from ${componentsToModify.length} components`);
    }
    
    if (clearSelection) {
      plugin.managers.structure.selection.clear();
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to remove water molecules:', error);
    return false;
  }
}

/**
 * Remove ligand molecules by residue name
 */
export async function removeLigandMolecules(
  plugin: PluginUIContext,
  ligandNames: string[] = ['HEM', 'ATP', 'ADP', 'NAD', 'FAD'],
  options: ComponentRemovalOptions = {}
): Promise<boolean> {
  const { clearSelection = true, verbose = false } = options;
  
  try {
    if (verbose) console.log(`🎯 Removing ligands: ${ligandNames.join(', ')}`);
    
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) {
      if (verbose) console.log('❌ No structures found');
      return false;
    }
    
    const structure = hierarchy.structures[0];
    if (!structure.cell?.obj?.data) {
      if (verbose) console.log('❌ No structure data found');
      return false;
    }
    
    // Build selection for multiple ligand types
    const ligandExpressions = ligandNames.map(name =>
      MS.struct.generator.atomGroups({
        'residue-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_comp_id(), name
        ])
      })
    );
    
    // Combine all ligand expressions
    const combinedExpression = ligandExpressions.length === 1 
      ? ligandExpressions[0]
      : MS.struct.combinator.merge(ligandExpressions);
    
    // Create selection and convert to loci
    const ligandSelection = Script.getStructureSelection(q => combinedExpression, structure.cell.obj.data);
    const ligandLoci = StructureSelection.toLociWithSourceUnits(ligandSelection);
    
    if (ligandLoci.isEmpty) {
      if (verbose) console.log('❌ No ligand molecules found');
      return false;
    }
    
    // Add to selection and subtract from components
    plugin.managers.structure.selection.fromLoci('set', ligandLoci);
    
    const sel = plugin.managers.structure.hierarchy.getStructuresWithSelection();
    const componentsToModify: any[] = [];
    
    for (const s of sel) {
      componentsToModify.push(...s.components);
    }
    
    if (componentsToModify.length > 0) {
      plugin.managers.structure.component.modifyByCurrentSelection(componentsToModify, 'subtract');
      if (verbose) console.log(`✅ Removed ligands from ${componentsToModify.length} components`);
    }
    
    if (clearSelection) {
      plugin.managers.structure.selection.clear();
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to remove ligand molecules:', error);
    return false;
  }
}

/**
 * Remove ion molecules (common ion types)
 */
export async function removeIonMolecules(
  plugin: PluginUIContext,
  ionNames: string[] = ['NA', 'CL', 'K', 'MG', 'CA', 'ZN', 'FE'],
  options: ComponentRemovalOptions = {}
): Promise<boolean> {
  const { clearSelection = true, verbose = false } = options;
  
  try {
    if (verbose) console.log(`🎯 Removing ions: ${ionNames.join(', ')}`);
    
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) {
      if (verbose) console.log('❌ No structures found');
      return false;
    }
    
    const structure = hierarchy.structures[0];
    if (!structure.cell?.obj?.data) {
      if (verbose) console.log('❌ No structure data found');
      return false;
    }
    
    // Build selection for multiple ion types
    const ionExpressions = ionNames.map(name =>
      MS.struct.generator.atomGroups({
        'residue-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_comp_id(), name
        ])
      })
    );
    
    // Combine all ion expressions
    const combinedExpression = ionExpressions.length === 1 
      ? ionExpressions[0]
      : MS.struct.combinator.merge(ionExpressions);
    
    // Create selection and convert to loci
    const ionSelection = Script.getStructureSelection(q => combinedExpression, structure.cell.obj.data);
    const ionLoci = StructureSelection.toLociWithSourceUnits(ionSelection);
    
    if (ionLoci.isEmpty) {
      if (verbose) console.log('❌ No ion molecules found');
      return false;
    }
    
    // Add to selection and subtract from components
    plugin.managers.structure.selection.fromLoci('set', ionLoci);
    
    const sel = plugin.managers.structure.hierarchy.getStructuresWithSelection();
    const componentsToModify: any[] = [];
    
    for (const s of sel) {
      componentsToModify.push(...s.components);
    }
    
    if (componentsToModify.length > 0) {
      plugin.managers.structure.component.modifyByCurrentSelection(componentsToModify, 'subtract');
      if (verbose) console.log(`✅ Removed ions from ${componentsToModify.length} components`);
    }
    
    if (clearSelection) {
      plugin.managers.structure.selection.clear();
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to remove ion molecules:', error);
    return false;
  }
}

/**
 * Remove custom residues by name
 */
export async function removeResiduesByName(
  plugin: PluginUIContext,
  residueNames: string[],
  options: ComponentRemovalOptions = {}
): Promise<boolean> {
  const { clearSelection = true, verbose = false } = options;
  
  try {
    if (verbose) console.log(`🎯 Removing residues: ${residueNames.join(', ')}`);
    
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) {
      if (verbose) console.log('❌ No structures found');
      return false;
    }
    
    const structure = hierarchy.structures[0];
    if (!structure.cell?.obj?.data) {
      if (verbose) console.log('❌ No structure data found');
      return false;
    }
    
    // Build selection for custom residue types
    const residueExpressions = residueNames.map(name =>
      MS.struct.generator.atomGroups({
        'residue-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_comp_id(), name
        ])
      })
    );
    
    // Combine all residue expressions
    const combinedExpression = residueExpressions.length === 1 
      ? residueExpressions[0]
      : MS.struct.combinator.merge(residueExpressions);
    
    // Create selection and convert to loci
    const residueSelection = Script.getStructureSelection(q => combinedExpression, structure.cell.obj.data);
    const residueLoci = StructureSelection.toLociWithSourceUnits(residueSelection);
    
    if (residueLoci.isEmpty) {
      if (verbose) console.log('❌ No matching residues found');
      return false;
    }
    
    // Add to selection and subtract from components
    plugin.managers.structure.selection.fromLoci('set', residueLoci);
    
    const sel = plugin.managers.structure.hierarchy.getStructuresWithSelection();
    const componentsToModify: any[] = [];
    
    for (const s of sel) {
      componentsToModify.push(...s.components);
    }
    
    if (componentsToModify.length > 0) {
      plugin.managers.structure.component.modifyByCurrentSelection(componentsToModify, 'subtract');
      if (verbose) console.log(`✅ Removed residues from ${componentsToModify.length} components`);
    }
    
    if (clearSelection) {
      plugin.managers.structure.selection.clear();
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to remove residues:', error);
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
  } = {}
): Promise<{ water: boolean; ligands: boolean; ions: boolean }> {
  const {
    removeWater = true,
    removeLigands = true,
    removeIons = true,
    customLigands = ['HEM', 'ATP', 'ADP', 'NAD', 'FAD'],
    customIons = ['NA', 'CL', 'K', 'MG', 'CA', 'ZN', 'FE'],
    ...baseOptions
  } = options;
  
  const results = {
    water: false,
    ligands: false,
    ions: false
  };
  
  if (removeWater) {
    results.water = await removeWaterMolecules(plugin, baseOptions);
  }
  
  if (removeLigands) {
    results.ligands = await removeLigandMolecules(plugin, customLigands, baseOptions);
  }
  
  if (removeIons) {
    results.ions = await removeIonMolecules(plugin, customIons, baseOptions);
  }
  
  return results;
}
