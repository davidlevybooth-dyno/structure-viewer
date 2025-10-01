"use client";

import React, { useState } from "react";
import { Home, Focus, RotateCcw } from "lucide-react";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import {
  zoomToFit,
  resetCamera,
  focusOnSelection,
} from "@/lib/molstar/cameraControls";

interface CameraControlsProps {
  plugin: PluginUIContext | null;
  className?: string;
}

export function CameraControls({
  plugin,
  className = "",
}: CameraControlsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCameraAction = async (
    action: () => Promise<boolean>,
    actionName: string,
  ) => {
    if (!plugin || isLoading) return;

    setIsLoading(true);
    try {
      const success = await action();
      if (!success) {
        console.warn(`Camera action failed: ${actionName}`);
      }
    } catch (error) {
      console.error(`Camera action error (${actionName}):`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const cameraActions = [
    {
      icon: Home,
      label: "Fit to View",
      action: () => zoomToFit(plugin!),
      shortcut: "F",
    },
    {
      icon: RotateCcw,
      label: "Reset Camera",
      action: () => resetCamera(plugin!),
      shortcut: "R",
    },
    {
      icon: Focus,
      label: "Focus Selection",
      action: () => focusOnSelection(plugin!),
      shortcut: "S",
    },
  ];

  if (!plugin) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {cameraActions.map(({ icon: Icon, label, action, shortcut }) => (
        <button
          key={label}
          onClick={() => handleCameraAction(action, label)}
          disabled={isLoading}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={`${label} (${shortcut})`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
