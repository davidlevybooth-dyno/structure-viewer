"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { useMolstar } from "@/contexts/MolstarContext";
import { usePDBSequence } from "@/hooks/usePdbSequence";
import { MolstarRepresentationAPI } from "@/lib/molstar/representation";
import {
  RepresentationSelector,
  ChainControls,
} from "./settings";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";


interface StructureSettingsDropdownProps {
  pdbId?: string;
}

export function StructureSettingsDropdown({ pdbId }: StructureSettingsDropdownProps) {
  const { plugin } = useMolstar();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [api, setApi] = useState<MolstarRepresentationAPI | null>(null);
  const [currentRepresentation, setCurrentRepresentation] =
    useState<string>("cartoon");

  // Get chain data from the same source as sequence interface
  const { data: pdbData } = usePDBSequence(pdbId || null);
  const availableChains = pdbData?.chains?.map(chain => chain.id) || [];

  // Initialize API when plugin is available
  useEffect(() => {
    if (plugin) {
      setApi(new MolstarRepresentationAPI(plugin));
    } else {
      setApi(null);
    }
  }, [plugin]);

  // Set default selected chain when chains are available
  useEffect(() => {
    if (availableChains.length > 0 && !selectedChain) {
      setSelectedChain(availableChains[0]);
    }
  }, [availableChains, selectedChain]);

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
