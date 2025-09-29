"use client";

import React from "react";
import { EyeOff, Eye, Minus } from "lucide-react";
import { hideChain, isolateChain, showAllChains } from "@/lib/molstar/chain-operations";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

interface ChainControlsProps {
  plugin: PluginUIContext | null;
  availableChains: string[];
  selectedChain: string;
  onChainChange: (chainId: string) => void;
  onAction: (actionFn: () => Promise<boolean>) => void;
}

export function ChainControls({ 
  plugin, 
  availableChains, 
  selectedChain, 
  onChainChange, 
  onAction 
}: ChainControlsProps) {
  if (availableChains.length === 0) {
    return null;
  }

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
            <option key={chain} value={chain}>Chain {chain}</option>
          ))}
        </select>
      </div>

      {/* Chain Actions */}
      <div className="space-y-1">
        <button
          onClick={() => {
            onAction(() => hideChain(plugin!, selectedChain));
          }}
          disabled={!plugin || !selectedChain}
          className="flex items-center gap-2 w-full px-2 py-1 text-sm hover:bg-zinc-50 rounded transition-colors disabled:opacity-50"
        >
          <Minus className="h-3 w-3" />
          Hide {selectedChain}
        </button>
        <button
          onClick={() => {
            onAction(() => isolateChain(plugin!, selectedChain));
          }}
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