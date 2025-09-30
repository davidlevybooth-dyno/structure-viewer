/**
 * Sequence controls component with compact tooltip design
 * Provides interaction instructions without taking up vertical space
 */

"use client";

import React, { useState } from 'react';
import { Info, Mouse, MousePointer, Hand, HelpCircle } from 'lucide-react';

interface SequenceControlsProps {
  className?: string;
  selectedRegions?: Array<{
    chainId: string;
    start: number;
    end: number;
    sequence?: string;
  }>;
  availableChains?: string[];
}

/**
 * Compact sequence controls with tooltip
 * Provides instructions without breaking visual flow between structure and sequence
 */
export function SequenceControls({ 
  className = "", 
  selectedRegions = [], 
  availableChains = [] 
}: SequenceControlsProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const interactions = [
    {
      icon: <MousePointer className="h-4 w-4" />,
      action: "Click & Drag",
      description: "Select residue ranges",
      detail: "Click and drag across residues to select a range"
    },
    {
      icon: <Mouse className="h-4 w-4" />,
      action: "Right-Click",
      description: "Context menu",
      detail: "Right-click on selected residues for hide/isolate/highlight options"
    },
    {
      icon: <Hand className="h-4 w-4" />,
      action: "Hover",
      description: "Preview residue",
      detail: "Hover over residues to see details and temporary highlighting"
    }
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Compact Header Bar */}
      <div className="bg-white border-b border-zinc-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Selection Status */}
          {selectedRegions.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-blue-700">
                {selectedRegions.length} selection{selectedRegions.length !== 1 ? 's' : ''}:
              </div>
              <div className="flex gap-1">
                {selectedRegions.slice(0, 3).map((region, index) => (
                  <span 
                    key={index}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                  >
                    {region.chainId}:{region.start}-{region.end}
                  </span>
                ))}
                {selectedRegions.length > 3 && (
                  <span className="text-xs text-blue-600">
                    +{selectedRegions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-500">
              Select residues to interact with structure
            </div>
          )}
        </div>

        {/* Help Button with Tooltip */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowInstructions(true)}
            className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
            title="Sequence interaction help"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Compact Tooltip */}
          {showTooltip && (
            <div className="absolute right-0 bottom-full mb-1 z-10 bg-zinc-900 text-white text-xs rounded-lg shadow-lg p-3 w-64">
              <div className="space-y-2">
                <div className="font-medium">Sequence Interactions:</div>
                <div className="space-y-1">
                  <div>• <strong>Click & Drag:</strong> Select ranges</div>
                  <div>• <strong>Right-click:</strong> Hide/isolate/highlight</div>
                  <div>• <strong>Hover:</strong> Preview residue</div>
                </div>
                <div className="text-zinc-300 text-xs pt-1 border-t border-zinc-700">
                  Click for detailed instructions
                </div>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute -bottom-1 right-3 w-2 h-2 bg-zinc-900 transform rotate-45"></div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-zinc-900">Sequence Interactions</h3>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-zinc-600">
                  The sequence interface allows you to interact with protein sequences and automatically 
                  sync selections with the 3D structure viewer.
                </p>

                <div className="space-y-3">
                  {interactions.map((interaction, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
                        {interaction.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-900">{interaction.action}</h4>
                        <p className="text-sm text-zinc-600">{interaction.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 rounded-lg p-3 mt-4">
                  <h4 className="font-medium text-blue-900 mb-1">Context Menu Actions</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><strong>Hide:</strong> Hide selected residues in 3D viewer</li>
                    <li><strong>Isolate:</strong> Show only selected residues</li>
                    <li><strong>Highlight:</strong> Emphasize residues in 3D viewer</li>
                    <li><strong>Copy:</strong> Copy sequence to clipboard</li>
                  </ul>
                </div>

                <div className="bg-amber-50 rounded-lg p-3">
                  <h4 className="font-medium text-amber-900 mb-1">Pro Tips</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Selections persist when right-clicking</li>
                    <li>• Use "Show All" in Structure Controls to reset</li>
                    <li>• Multiple chain selections are supported</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInstructions(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
