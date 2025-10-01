"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, Eye, EyeOff, Target, Palette } from "lucide-react";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import { cls } from "@/components/data/utils";
import {
  getAvailableChains,
  hideChain,
  isolateChain,
  showAllChains,
  colorChainsByScheme,
} from "@/lib/molstar/chainOperations";

interface ChainControlsProps {
  plugin: PluginUIContext | null;
  className?: string;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function DropdownMenu({
  trigger,
  children,
  isOpen,
  onToggle,
}: DropdownMenuProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        {trigger}
        <ChevronDown
          className={cls(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-[160px] rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function DropdownItem({
  children,
  onClick,
  disabled = false,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cls(
        "w-full rounded-sm px-2 py-1.5 text-left text-xs transition-colors",
        disabled ? "text-zinc-400" : "text-zinc-700 hover:bg-zinc-100",
      )}
    >
      {children}
    </button>
  );
}

export function ChainControls({ plugin, className = "" }: ChainControlsProps) {
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleChainAction = async (
    action: () => Promise<boolean>,
    actionName: string,
  ) => {
    if (!plugin || isLoading) return;

    setIsLoading(true);
    try {
      const success = await action();
      if (!success) {
        console.warn(`Chain action failed: ${actionName}`);
      }
    } catch (error) {
      console.error(`Chain action error (${actionName}):`, error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  if (!plugin || availableChains.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Chain Selector */}
      <DropdownMenu
        trigger={<>Chain: {selectedChain}</>}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      >
        <div className="space-y-1">
          {/* Chain Selection */}
          <div className="px-2 py-1 text-xs font-medium text-zinc-500 border-b border-zinc-200">
            Select Chain
          </div>
          {availableChains.map((chain) => (
            <DropdownItem
              key={chain}
              onClick={() => {
                setSelectedChain(chain);
                setIsOpen(false);
              }}
            >
              Chain {chain}
            </DropdownItem>
          ))}

          {/* Chain Actions */}
          <div className="px-2 py-1 text-xs font-medium text-zinc-500 border-b border-zinc-200 border-t">
            Actions
          </div>
          <DropdownItem
            onClick={() =>
              handleChainAction(
                () => hideChain(plugin, selectedChain, { verbose: true }),
                `Hide Chain ${selectedChain}`,
              )
            }
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <EyeOff className="h-3 w-3" />
              Hide Chain {selectedChain}
            </div>
          </DropdownItem>
          <DropdownItem
            onClick={() =>
              handleChainAction(
                () => isolateChain(plugin, selectedChain, { verbose: true }),
                `Isolate Chain ${selectedChain}`,
              )
            }
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3" />
              Isolate Chain {selectedChain}
            </div>
          </DropdownItem>
          <DropdownItem
            onClick={() =>
              handleChainAction(() => showAllChains(plugin), "Show All Chains")
            }
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3" />
              Show All Chains
            </div>
          </DropdownItem>

          {/* Color Schemes */}
          <div className="px-2 py-1 text-xs font-medium text-zinc-500 border-b border-zinc-200 border-t">
            Color Schemes
          </div>
          <DropdownItem
            onClick={() =>
              handleChainAction(
                () =>
                  colorChainsByScheme(plugin, "chain-id", { verbose: true }),
                "Color by Chain",
              )
            }
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <Palette className="h-3 w-3" />
              Color by Chain
            </div>
          </DropdownItem>
          <DropdownItem
            onClick={() =>
              handleChainAction(
                () =>
                  colorChainsByScheme(plugin, "polymer-id", { verbose: true }),
                "Color by Polymer",
              )
            }
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <Palette className="h-3 w-3" />
              Color by Polymer
            </div>
          </DropdownItem>
        </div>
      </DropdownMenu>
    </div>
  );
}
