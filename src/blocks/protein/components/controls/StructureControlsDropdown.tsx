"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { cls } from "@/components/data/utils";
import { useMolstar } from "@/contexts/MolstarContext";

// Import only the proven working functions
import {
  removeWaterMolecules,
  removeLigandMolecules,
  removeIonMolecules,
  removeCommonUnwantedComponents,
} from "@/lib/molstar/componentRemoval";
import {
  getAvailableChains,
  hideChain,
  isolateChain,
  showAllChains,
} from "@/lib/molstar/chainOperations";

interface StructureControlsDropdownProps {
  className?: string;
}

export function StructureControlsDropdown({
  className = "",
}: StructureControlsDropdownProps) {
  const { plugin } = useMolstar();
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  // Load available chains when plugin is ready
  useEffect(() => {
    if (plugin) {
      const chains = getAvailableChains(plugin);
      setAvailableChains(chains);
      if (chains.length > 0 && !selectedChain) {
        setSelectedChain(chains[0]);
      }
    }
  }, [plugin, selectedChain]);

  const handleAction = async (
    actionId: string,
    actionFn: () => Promise<boolean>,
  ) => {
    if (!plugin || isLoading) return;

    setIsLoading(actionId);
    try {
      const success = await actionFn();
      if (!success) {
        console.warn(`Action failed: ${actionId}`);
      }
    } catch (error) {
      console.error(`Action error (${actionId}):`, error);
    } finally {
      setIsLoading(null);
    }
  };

  if (!plugin) {
    return null;
  }

  return (
    <div className={`bg-white border-b border-zinc-200 ${className}`}>
      {/* Header - matches sequence panel style */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-zinc-900">
            Structure Controls
          </h3>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 transition-colors"
          title={isExpanded ? "Collapse controls" : "Expand controls"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Dropdown Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Chain Controls */}
          <div>
            <h4 className="text-xs font-medium text-zinc-500 mb-2">
              Chain Operations
            </h4>

            {/* Chain Selector */}
            {availableChains.length > 0 && (
              <div className="mb-3">
                <label className="block text-xs text-zinc-500 mb-1">
                  Target Chain
                </label>
                <select
                  value={selectedChain}
                  onChange={(e) => setSelectedChain(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                >
                  {availableChains.map((chain) => (
                    <option key={chain} value={chain}>
                      Chain {chain}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Chain Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleAction("isolate-chain", () =>
                    isolateChain(plugin!, selectedChain, { verbose: true }),
                  )
                }
                disabled={!!isLoading || !selectedChain}
                className={cls(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
                  isLoading === "isolate-chain"
                    ? "bg-zinc-200 text-zinc-500"
                    : "bg-blue-600 text-white hover:bg-blue-700",
                )}
              >
                {isLoading === "isolate-chain"
                  ? "Isolating..."
                  : `Isolate ${selectedChain}`}
              </button>

              <button
                onClick={() =>
                  handleAction("show-all", () => showAllChains(plugin!))
                }
                disabled={!!isLoading}
                className={cls(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
                  isLoading === "show-all"
                    ? "bg-zinc-200 text-zinc-500"
                    : "bg-zinc-600 text-white hover:bg-zinc-700",
                )}
              >
                {isLoading === "show-all" ? "Restoring..." : "Show All"}
              </button>
            </div>
          </div>

          {/* Component Removal */}
          <div>
            <h4 className="text-xs font-medium text-zinc-500 mb-2">
              Remove Components
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  handleAction("remove-water", () =>
                    removeWaterMolecules(plugin!, { verbose: true }),
                  )
                }
                disabled={!!isLoading}
                className={cls(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
                  isLoading === "remove-water"
                    ? "bg-zinc-200 text-zinc-500"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200",
                )}
              >
                {isLoading === "remove-water" ? "Removing..." : "Water"}
              </button>

              <button
                onClick={() =>
                  handleAction("remove-ligands", () =>
                    removeLigandMolecules(
                      plugin!,
                      ["HEM", "ATP", "ADP", "NAD", "FAD"],
                      { verbose: true },
                    ),
                  )
                }
                disabled={!!isLoading}
                className={cls(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
                  isLoading === "remove-ligands"
                    ? "bg-zinc-200 text-zinc-500"
                    : "bg-green-100 text-green-700 hover:bg-green-200",
                )}
              >
                {isLoading === "remove-ligands" ? "Removing..." : "Ligands"}
              </button>

              <button
                onClick={() =>
                  handleAction("remove-ions", () =>
                    removeIonMolecules(
                      plugin!,
                      ["NA", "CL", "K", "MG", "CA", "ZN", "FE"],
                      { verbose: true },
                    ),
                  )
                }
                disabled={!!isLoading}
                className={cls(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
                  isLoading === "remove-ions"
                    ? "bg-zinc-200 text-zinc-500"
                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
                )}
              >
                {isLoading === "remove-ions" ? "Removing..." : "Ions"}
              </button>

              <button
                onClick={() =>
                  handleAction("clean-all", async () => {
                    const results = await removeCommonUnwantedComponents(
                      plugin!,
                      { verbose: true },
                    );
                    return results.water || results.ligands || results.ions;
                  })
                }
                disabled={!!isLoading}
                className={cls(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
                  isLoading === "clean-all"
                    ? "bg-zinc-200 text-zinc-500"
                    : "bg-red-100 text-red-700 hover:bg-red-200",
                )}
              >
                {isLoading === "clean-all" ? "Cleaning..." : "Clean All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
