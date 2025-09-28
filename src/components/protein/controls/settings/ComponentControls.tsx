"use client";

import React from "react";
import { Droplet, Atom, Zap, Eraser } from "lucide-react";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

interface ComponentControlsProps {
  plugin: PluginUIContext | null;
  onAction: (actionFn: () => Promise<boolean>) => void;
}

// Component removal functions (simplified from main dropdown)
async function removeWater(plugin: PluginUIContext): Promise<boolean> {
  try {
    const { MolScriptBuilder: MS } = await import(
      "molstar/lib/mol-script/language/builder"
    );
    const { Script } = await import("molstar/lib/mol-script/script");
    const { StructureSelection } = await import(
      "molstar/lib/mol-model/structure/query"
    );

    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) return false;

    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) return false;

    const waterExpression = MS.struct.generator.atomGroups({
      "residue-test": MS.core.rel.eq([
        MS.struct.atomProperty.macromolecular.label_comp_id(),
        "HOH",
      ]),
    });

    const waterSelection = Script.getStructureSelection(
      waterExpression,
      structure.cell.obj.data,
    );
    const waterLoci = StructureSelection.toLociWithSourceUnits(waterSelection);

    if (waterLoci.elements?.length === 0) return false;

    plugin.managers.structure.selection.fromLoci("set", waterLoci);
    const allComponents = hierarchy.structures.flatMap((s) => s.components);
    await plugin.managers.structure.component.modifyByCurrentSelection(
      allComponents,
      "subtract",
    );
    plugin.managers.structure.selection.clear();

    return true;
  } catch (error) {
    console.error("Failed to remove water:", error);
    return false;
  }
}

async function resetStructure(plugin: PluginUIContext): Promise<boolean> {
  try {
    window.location.reload();
    return true;
  } catch (error) {
    console.error("Failed to reset structure:", error);
    return false;
  }
}

export function ComponentControls({
  plugin,
  onAction,
}: ComponentControlsProps) {
  const controls = [
    {
      label: "Remove Water",
      icon: Droplet,
      action: () => removeWater(plugin!),
      className: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    },
    {
      label: "Reset Structure",
      icon: Eraser,
      action: () => resetStructure(plugin!),
      className: "bg-red-50 hover:bg-red-100 text-red-700",
    },
  ];

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-zinc-500 px-2 py-1">
        Components
      </div>
      <div className="grid grid-cols-2 gap-1">
        {controls.map((control) => (
          <button
            key={control.label}
            onClick={() => onAction(control.action)}
            disabled={!plugin}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors disabled:opacity-50 ${control.className}`}
          >
            <control.icon className="h-3 w-3" />
            {control.label}
          </button>
        ))}
      </div>
    </div>
  );
}
