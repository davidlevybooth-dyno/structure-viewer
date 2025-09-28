import React from "react";
import { StructureLoader } from "@/components/ui/StructureLoader";
import { EXAMPLE_STRUCTURES } from "@/config/constants";

interface StructureSectionProps {
  pdbId: string;
  onLoadStructure: (pdbId: string) => void;
  isViewerReady: boolean;
}

export function StructureSection({
  pdbId,
  onLoadStructure,
  isViewerReady,
}: StructureSectionProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Load and manage molecular structures from the Protein Data Bank.
      </div>

      <StructureLoader
        initialValue={pdbId}
        onLoadStructure={onLoadStructure}
        isViewerReady={isViewerReady}
        currentPdbId={pdbId}
      />

      {/* Quick Structure Presets */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Load</h4>
        <div className="grid grid-cols-2 gap-2">
          {EXAMPLE_STRUCTURES.slice(0, 4).map((preset) => (
            <button
              key={preset.id}
              onClick={() => onLoadStructure(preset.id)}
              className="p-2 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900">
                {preset.id}
              </div>
              <div className="text-xs text-gray-500">{preset.name}</div>
              <div className="text-xs text-gray-400">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StructureSection;
