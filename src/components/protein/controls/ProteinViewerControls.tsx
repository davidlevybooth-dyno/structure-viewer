"use client";

import React from "react";
import { MolstarControlsDropdown } from "./MolstarControlsDropdown";

export function ProteinViewerControls() {
  return (
    <div className="border-b border-zinc-200 bg-white px-4 py-3" style={{ backgroundColor: '#f0f0f0' }}>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-zinc-800">
          Structure Controls
        </span>
        <MolstarControlsDropdown />
      </div>
    </div>
  );
}
