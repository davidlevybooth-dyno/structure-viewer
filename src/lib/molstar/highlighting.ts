/**
 * Mol* highlighting utilities using the official APIs
 * Based on the proven pattern: Structure → MolScript → StructureSelection → Loci → Highlight/Select
 */

import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { MolScriptBuilder as MS } from "molstar/lib/mol-script/language/builder";
import { Script } from "molstar/lib/mol-script/script";
import { StructureSelection } from "molstar/lib/mol-model/structure/query";
import type { Loci } from "molstar/lib/mol-model/loci";

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
}

/**
 * Persistent selection (syncs to sequence panel)
 */
export function selectOnly(plugin: PluginUIContext, loci: Loci) {
  // Clear then set, so visuals and sequence panel reflect only this set.
  plugin.managers.interactivity.lociSelects.deselectAll();
  plugin.managers.interactivity.lociSelects.select({ loci });
}

export function clearAllHighlights(plugin: PluginUIContext) {
  plugin.managers.interactivity.lociHighlights.clearHighlights();
}

export function clearAllSelections(plugin: PluginUIContext) {
  plugin.managers.interactivity.lociSelects.deselectAll();
}

export function focusLoci(plugin: PluginUIContext, loci: Loci) {
  plugin.managers.camera.focusLoci(loci);
}
