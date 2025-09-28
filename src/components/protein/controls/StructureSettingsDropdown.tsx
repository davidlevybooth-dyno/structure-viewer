"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { useMolstar } from "@/contexts/MolstarContext";
import { MolstarRepresentationAPI } from "@/lib/molstar/representation";
import {
  RepresentationSelector,
  ComponentControls,
  ChainControls,
} from "./settings";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

function getAvailableChains(plugin: PluginUIContext): string[] {
  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) return [];

    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) return [];

    const structureData = structure.cell.obj.data;
    const chains = new Set<string>();

    for (const unit of structureData.units) {
      if (unit.kind === 0) {
        const chainIndex =
          unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
        const chainId =
          unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
        if (chainId) chains.add(chainId);
      }
    }

    return Array.from(chains).sort();
  } catch (error) {
    console.warn("Failed to extract chains:", error);
    return [];
  }
}

export function StructureSettingsDropdown() {
  const { plugin } = useMolstar();
  const [isOpen, setIsOpen] = useState(false);
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [api, setApi] = useState<MolstarRepresentationAPI | null>(null);
  const [currentRepresentation, setCurrentRepresentation] =
    useState<string>("cartoon");

  // Initialize API when plugin is available
  useEffect(() => {
    if (plugin) {
      setApi(new MolstarRepresentationAPI(plugin));
      const chains = getAvailableChains(plugin);
      setAvailableChains(chains);
      if (chains.length > 0 && !selectedChain) {
        setSelectedChain(chains[0]);
      }
    } else {
      setApi(null);
    }
  }, [plugin, selectedChain]);

  const handleAction = async (actionFn: () => Promise<boolean>) => {
    if (!plugin) return;
    try {
      await actionFn();
      setIsOpen(false);
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  const handleRepresentationChange = async (repType: string) => {
    if (!api) return;
    try {
      const success = await api.setRepresentation(repType);
      if (success) {
        setCurrentRepresentation(repType);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Representation change failed:", error);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => plugin && setIsOpen(!isOpen)}
        disabled={!plugin}
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded border transition-colors ${
          plugin
            ? "text-zinc-700 bg-zinc-100 border-zinc-300 hover:bg-zinc-200"
            : "text-zinc-400 bg-zinc-50 border-zinc-200 cursor-not-allowed"
        }`}
      >
        <Settings className="h-4 w-4" />
        Settings
        <ChevronDown
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white border border-zinc-200 rounded shadow-lg">
            <div className="p-3 space-y-3">
              {/* Representation Selector with nested dropdown */}
              <RepresentationSelector
                api={api}
                currentRepresentation={currentRepresentation}
                onRepresentationChange={handleRepresentationChange}
              />

              {/* Component Controls */}
              <ComponentControls plugin={plugin} onAction={handleAction} />

              {/* Chain Controls */}
              <ChainControls
                plugin={plugin}
                availableChains={availableChains}
                selectedChain={selectedChain}
                onChainChange={setSelectedChain}
                onAction={handleAction}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
