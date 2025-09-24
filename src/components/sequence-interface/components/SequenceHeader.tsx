import React from 'react';
import type { SequenceData, SequenceSelection } from '../types';

interface SequenceHeaderProps {
  data: SequenceData;
  selection: SequenceSelection;
  readOnly?: boolean;
}

export function SequenceHeader({ data, selection, readOnly = false }: SequenceHeaderProps) {
  return (
    <div className="border-b bg-white px-6 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-800">
            {data.name || data.id}
          </h2>
          {data.metadata && (
            <div className="flex items-center space-x-3 mt-1 text-sm text-gray-500">
              {data.metadata.organism && (
                <span>{data.metadata.organism}</span>
              )}
              {data.metadata.method && (
                <span>• {data.metadata.method}</span>
              )}
              {data.metadata.resolution && (
                <span>• {data.metadata.resolution}Å</span>
              )}
            </div>
          )}
        </div>
        
        {/* Selection mode indicator */}
        {!readOnly && (
          <div className="text-xs text-gray-400 font-mono">
            {selection.regions.length === 0 
              ? "Click and drag to select • Hold Shift to add regions"
              : `${selection.regions.length} region${selection.regions.length !== 1 ? 's' : ''} selected • Hold Shift to add more`
            }
          </div>
        )}
      </div>
    </div>
  );
}