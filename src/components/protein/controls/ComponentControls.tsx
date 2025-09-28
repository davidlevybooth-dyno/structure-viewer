"use client";

import React, { useState } from "react";
import { Droplets, Atom, Zap, Eraser } from "lucide-react";
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import {
  removeWaterMolecules,
  removeLigandMolecules,
  removeIonMolecules,
  removeCommonUnwantedComponents
} from "@/lib/molstar/component-removal";

interface ComponentControlsProps {
  plugin: PluginUIContext | null;
  className?: string;
}

export function ComponentControls({ plugin, className = "" }: ComponentControlsProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const handleRemoval = async (
    type: string,
    removalFn: () => Promise<boolean>
  ) => {
    if (!plugin || isRemoving) return;
    
    setIsRemoving(type);
    try {
      const success = await removalFn();
      if (!success) {
        console.warn(`No ${type} components found to remove`);
      }
    } catch (error) {
      console.error(`Failed to remove ${type}:`, error);
    } finally {
      setIsRemoving(null);
    }
  };

  const componentActions = [
    {
      icon: Droplets,
      label: "Water",
      type: "water",
      action: () => removeWaterMolecules(plugin!, { verbose: true }),
      color: "text-blue-600 hover:bg-blue-50"
    },
    {
      icon: Atom,
      label: "Ligands",
      type: "ligands", 
      action: () => removeLigandMolecules(plugin!, ['HEM', 'ATP', 'ADP', 'NAD', 'FAD'], { verbose: true }),
      color: "text-green-600 hover:bg-green-50"
    },
    {
      icon: Zap,
      label: "Ions",
      type: "ions",
      action: () => removeIonMolecules(plugin!, ['NA', 'CL', 'K', 'MG', 'CA', 'ZN', 'FE'], { verbose: true }),
      color: "text-yellow-600 hover:bg-yellow-50"
    },
    {
      icon: Eraser,
      label: "Clean All",
      type: "all",
      action: async () => {
        const results = await removeCommonUnwantedComponents(plugin!, { 
          verbose: true,
          removeWater: true,
          removeLigands: true,
          removeIons: true
        });
        return results.water || results.ligands || results.ions;
      },
      color: "text-red-600 hover:bg-red-50"
    }
  ];

  if (!plugin) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {componentActions.map(({ icon: Icon, label, type, action, color }) => (
        <button
          key={type}
          onClick={() => handleRemoval(type, action)}
          disabled={!!isRemoving}
          className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            isRemoving === type 
              ? 'bg-zinc-200 text-zinc-500' 
              : `${color} hover:text-zinc-900`
          }`}
          title={isRemoving === type ? `Removing ${label}...` : `Remove ${label}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
