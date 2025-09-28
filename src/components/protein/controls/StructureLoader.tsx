import React, { useState } from "react";
import { EXAMPLE_STRUCTURES } from "@/config/constants";

interface StructureLoaderProps {
  initialValue?: string;
  onLoadStructure: (pdbId: string) => void;
  isViewerReady: boolean;
  currentPdbId: string;
}

export function StructureLoader({
  initialValue = "7MT0",
  onLoadStructure,
  isViewerReady,
  currentPdbId,
}: StructureLoaderProps) {
  const [inputValue, setInputValue] = useState(initialValue);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onLoadStructure(inputValue);
    }
  };

  const handleLoadClick = () => {
    onLoadStructure(inputValue);
  };

  const handleExampleClick = (structureId: string) => {
    setInputValue(structureId);
    onLoadStructure(structureId);
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Load Structure</h2>

      <div className="space-y-4">
        {/* PDB ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDB ID
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              placeholder="e.g., 1CRN"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleLoadClick}
              disabled={!isViewerReady}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Load
            </button>
          </div>
        </div>

        {/* Example Structures */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Examples
          </label>
          <div className="space-y-2">
            {EXAMPLE_STRUCTURES.map((structure) => (
              <button
                key={structure.id}
                onClick={() => handleExampleClick(structure.id)}
                disabled={!isViewerReady}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border disabled:opacity-50"
              >
                <div className="font-mono text-blue-600">{structure.id}</div>
                <div className="text-xs text-gray-600">{structure.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Structure Status */}
        {isViewerReady && (
          <div className="mt-6 p-3 bg-blue-50 rounded">
            <div className="text-sm font-medium text-blue-900">
              Current: {currentPdbId}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StructureLoader;
