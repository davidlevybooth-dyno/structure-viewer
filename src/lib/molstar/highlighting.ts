/**
 * Mol* highlighting utilities using the official APIs
 * Based on the proven pattern: Structure → MolScript → StructureSelection → Loci → Highlight/Select
 */

import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { MolScriptBuilder as MS } from "molstar/lib/mol-script/language/builder";
import { Script } from "molstar/lib/mol-script/script";
import { StructureSelection } from "molstar/lib/mol-model/structure/query";
import type { Loci } from "molstar/lib/mol-model/loci";
import { setStructureOverpaint } from "molstar/lib/mol-plugin-state/helpers/structure-overpaint";
import { Color } from "molstar/lib/mol-util/color";

export type ResidueRange = {
  chain: string;
  start: number;
  end: number;
  auth?: boolean;
};

function getCurrentStructureData(plugin: PluginUIContext) {
  return (
    plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data ??
    null
  );
}

/**
 * Build a Loci for one or more residue ranges, e.g. [{ chain: 'A', start: 10, end: 25 }]
 * Set auth=true to use auth fields; otherwise label_* are used.
 */
export function buildResidueRangeLoci(
  plugin: PluginUIContext,
  ranges: ResidueRange[],
): Loci | null {
  const data = getCurrentStructureData(plugin);
  if (!data || ranges.length === 0) return null;

  const groups = ranges.map(({ chain, start, end, auth }) => {
    const chainProp = auth
      ? MS.struct.atomProperty.macromolecular.auth_asym_id()
      : MS.struct.atomProperty.macromolecular.label_asym_id();
    const seqProp = auth
      ? MS.struct.atomProperty.macromolecular.auth_seq_id()
      : MS.struct.atomProperty.macromolecular.label_seq_id();

    return MS.struct.generator.atomGroups({
      "chain-test": MS.core.rel.eq([chainProp, chain]),
      "residue-test": MS.core.rel.inRange([seqProp, start, end]),
    });
  });

  const selection = Script.getStructureSelection(
    (Q) => Q.struct.combinator.merge(groups as any),
    data,
  );

  return StructureSelection.toLociWithSourceUnits(selection);
}

/**
 * Transient highlighting (can be replaced by next highlight)
 */
export function highlightOnly(plugin: PluginUIContext, loci: Loci) {
  plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
  // Also try the structure selection approach for more visibility
  plugin.managers.structure.selection.fromLoci('set', loci);
}

/**
 * Persistent selection (syncs to sequence panel)
 */
export function selectOnly(plugin: PluginUIContext, loci: Loci) {
  // Clear then set, so visuals and sequence panel reflect only this set.
  plugin.managers.interactivity.lociSelects.deselectAll();
  plugin.managers.interactivity.lociSelects.select({ loci });
  
  // Use overpaint for visible highlighting with correct structure reference
  try {
    // Try to get preset state objects (correct approach for molstar 5.0)
    const presetStateObjects = (plugin as any)._presetStateObjects;
    console.log('🎯 PresetStateObjects:', presetStateObjects);
    
    if (presetStateObjects?.structure?.data) {
      const struct = presetStateObjects.structure.data;
      console.log('🎯 Structure from preset:', struct);
      
      const structRef = plugin.managers.structure.hierarchy.findStructure(struct);
      console.log('🎯 StructRef:', structRef);
      
      if (structRef) {
        console.log('🎯 StructRef components:', structRef.components);
        console.log('🎯 Loci to highlight:', loci);
        
        const color = Color(0xFF0000); // Bright red
        console.log('🎯 Color:', color);
        
        await setStructureOverpaint(plugin, structRef.components, color, async () => loci);
        console.log('🎯 Applied overpaint highlighting');
      } else {
        console.log('🎯 No structRef found with preset approach');
      }
    } else {
      console.log('🎯 No preset state objects found');
      
      // Fallback to old approach
      const hierarchy = plugin.managers.structure.hierarchy.current;
      if (hierarchy.structures.length > 0) {
        const struct = hierarchy.structures[0];
        const structRef = plugin.managers.structure.hierarchy.findStructure(struct.cell.obj.data);
        console.log('🎯 Fallback structRef:', structRef);
      }
    }
  } catch (error) {
    console.error('🎯 Overpaint highlighting failed:', error);
  }
  
  // Focus camera on the selection
  plugin.managers.camera.focusLoci(loci);
}

export function clearAllHighlights(plugin: PluginUIContext) {
  plugin.managers.interactivity.lociHighlights.clearHighlights();
}

export function clearAllSelections(plugin: PluginUIContext) {
  plugin.managers.interactivity.lociSelects.deselectAll();
  
  // Clear overpaint
  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (hierarchy.structures.length > 0) {
      const struct = hierarchy.structures[0];
      const structRef = plugin.managers.structure.hierarchy.findStructure(struct.cell.obj.data);
      
      if (structRef) {
        // Clear overpaint by setting it to undefined
        setStructureOverpaint(plugin, structRef.components, undefined, async () => undefined);
        console.log('🎯 Cleared overpaint highlighting');
      }
    }
  } catch (error) {
    console.warn('Clear overpaint failed:', error);
  }
}

export function focusLoci(plugin: PluginUIContext, loci: Loci) {
  plugin.managers.camera.focusLoci(loci);
}
