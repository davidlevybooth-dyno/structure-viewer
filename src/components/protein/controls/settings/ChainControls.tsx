"use client";

import React from "react";
import { EyeOff, Eye } from "lucide-react";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

interface ChainControlsProps {
  plugin: PluginUIContext | null;
  availableChains: string[];
  selectedChain: string;
  onChainChange: (chainId: string) => void;
  onAction: (actionFn: () => Promise<boolean>) => void;
}

// Chain isolation function (simplified from main dropdown)
async function isolateChain(
  plugin: PluginUIContext,
  chainId: string,
): Promise<boolean> {
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

    const structureData = structure.cell.obj.data;
    const allComponents = hierarchy.structures.flatMap((s) => s.components);

    // Get all chains except target
    const allChains = new Set<string>();
    for (const unit of structureData.units) {
      if (unit.kind === 0) {
        const chainIndex =
          unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
        const currentChainId =
          unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
        if (currentChainId) allChains.add(currentChainId);
      }
    }
    allChains.delete(chainId);

    // Hide each other chain
    for (const hideChainId of Array.from(allChains)) {
      const chainSelection = MS.struct.generator.atomGroups({
        "chain-test": MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_asym_id(),
          hideChainId,
        ]),
      });

      const selection = Script.getStructureSelection(
        chainSelection,
        structureData,
      );
      const loci = StructureSelection.toLociWithSourceUnits(selection);

      if (loci.elements?.length > 0) {
        plugin.managers.structure.selection.fromLoci("set", loci);
        await plugin.managers.structure.component.modifyByCurrentSelection(
          allComponents,
          "subtract",
        );
        plugin.managers.structure.selection.clear();
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to isolate chain:", error);
    return false;
  }
}

async function showAllChains(plugin: PluginUIContext): Promise<boolean> {
  try {
    window.location.reload();
    return true;
  } catch (error) {
    console.error("Failed to show all chains:", error);
    return false;
  }
}

export function ChainControls({
  plugin,
  availableChains,
  selectedChain,
  onChainChange,
  onAction,
}: ChainControlsProps) {
  if (availableChains.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-zinc-500 px-2 py-1">Chains</div>

      {/* Chain Selector */}
      <div className="px-2">
        <select
          value={selectedChain}
          onChange={(e) => onChainChange(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white"
          disabled={!plugin}
        >
          {availableChains.map((chain) => (
            <option key={chain} value={chain}>
              Chain {chain}
            </option>
          ))}
        </select>
      </div>

      {/* Chain Actions */}
      <div className="space-y-1">
        <button
          onClick={() => onAction(() => isolateChain(plugin!, selectedChain))}
          disabled={!plugin || !selectedChain}
          className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-zinc-50 rounded transition-colors disabled:opacity-50"
        >
          <EyeOff className="h-3 w-3" />
          Isolate {selectedChain}
        </button>
        <button
          onClick={() => onAction(() => showAllChains(plugin!))}
          disabled={!plugin}
          className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-zinc-50 rounded transition-colors disabled:opacity-50"
        >
          <Eye className="h-3 w-3" />
          Show All Chains
        </button>
      </div>
    </div>
  );
}
