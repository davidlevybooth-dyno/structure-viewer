import React from "react";
import type { SequenceData, SequenceSelection } from "../types";

interface SequenceHeaderProps {
  data: SequenceData;
  selection: SequenceSelection;
  readOnly?: boolean;
}

export function SequenceHeader({
  data,
  selection,
  readOnly = false,
}: SequenceHeaderProps) {
  return (
    <div className="border-b bg-white px-6 py-3">
      <div className="grid grid-cols-12 gap-4 items-center">
        {/* Structure info - takes up 9 columns */}
        <div className="col-span-9 min-w-0">
          <h2 className="text-xs font-medium text-gray-600 truncate">
            {data.name || data.id}
          </h2>
          {data.metadata && (
            <div className="flex items-center space-x-2 mt-0.5 text-xs text-gray-500">
              {data.metadata.organism && (
                <span className="truncate max-w-24">
                  {data.metadata.organism}
                </span>
              )}
              {data.metadata.method && <span>• {data.metadata.method}</span>}
              {data.metadata.resolution && (
                <span>• {data.metadata.resolution}Å</span>
              )}
            </div>
          )}
        </div>

        {/* Selection indicator - takes up 3 columns, positioned at absolute right */}
        {!readOnly && (
          <div className="col-span-3 text-xs text-gray-400 font-mono text-right whitespace-nowrap">
            <p className="mb-1 text-right">Drag to select</p>
            <p className="text-right">Shift - multi-select</p>
          </div>
        )}

        {/* Spacer when readOnly */}
        {readOnly && <div className="col-span-3"></div>}
      </div>
    </div>
  );
}
