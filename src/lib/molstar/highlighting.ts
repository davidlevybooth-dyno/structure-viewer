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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Q) => Q.struct.combinator.merge(groups as any),
    data,
  );

  return StructureSelection.toLociWithSourceUnits(selection);
}

export function highlightOnly(plugin: PluginUIContext, loci: Loci) {
  plugin.managers.interactivity.lociHighlights.highlightOnly({ loci });
  plugin.managers.structure.selection.fromLoci("set", loci);
}

export async function selectOnly(plugin: PluginUIContext, loci: Loci) {
  plugin.managers.interactivity.lociSelects.deselectAll();
  plugin.managers.interactivity.lociSelects.select({ loci });

  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (hierarchy.structures.length > 0) {
      const struct = hierarchy.structures[0];
      if (struct.cell.obj?.data) {
        const structRef = plugin.managers.structure.hierarchy.findStructure(
          struct.cell.obj.data,
        );

        if (structRef) {
          const color = Color(0xff0000);
          await setStructureOverpaint(
            plugin,
            structRef.components,
            color,
            async () => loci as any,
          );
        }
      }
    }
  } catch (error) {
    console.error("Overpaint highlighting failed:", error);
  }

  plugin.managers.camera.focusLoci(loci);
}

export function clearAllHighlights(plugin: PluginUIContext) {
  plugin.managers.interactivity.lociHighlights.clearHighlights();
}

export async function clearAllSelections(plugin: PluginUIContext) {
  plugin.managers.interactivity.lociSelects.deselectAll();

  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (hierarchy.structures.length > 0) {
      const struct = hierarchy.structures[0];
      if (struct.cell.obj?.data) {
        const structRef = plugin.managers.structure.hierarchy.findStructure(
          struct.cell.obj.data,
        );

        if (structRef) {
          await setStructureOverpaint(
            plugin,
            structRef.components,
            Color(-1),
            async () => ({ kind: "empty-loci" }) as any,
          );
        }
      }
    }
  } catch (error) {
    console.warn("Clear overpaint failed:", error);
  }
}

export function focusLoci(plugin: PluginUIContext, loci: Loci) {
  plugin.managers.camera.focusLoci(loci);
}
