/**
 * Sequence accordion component
 * Wraps the entire sequence interface in a collapsible accordion matching structure controls design
 */

"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { SequenceWorkspace } from '../sequence/SequenceWorkspace';

interface SequenceAccordionProps {
  pdbId: string;
  isViewerReady: boolean;
  selectedChainIds: string[];
  selectedRegions?: Array<{
    chainId: string;
    start: number;
    end: number;
    sequence?: string;
  }>;
  availableChains?: string[];
  onSelectionChange: (selection: any) => void;
  onHighlightChange: (residues: any[]) => void;
  onChainSelectionChange: (chainIds: string[]) => void;
  onChainsLoaded: (chains: string[]) => void;
  onResidueAction: (action: string, region: any) => void;
  className?: string;
}

/**
 * Sequence accordion component
 * Provides collapsible sequence interface matching structure controls styling
 */
export function SequenceAccordion({
  pdbId,
  isViewerReady,
  selectedChainIds,
  selectedRegions = [],
  availableChains = [],
  onSelectionChange,
  onHighlightChange,
  onChainSelectionChange,
  onChainsLoaded,
  onResidueAction,
  className = "",
}: SequenceAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(true); // Start open
  const [showTooltip, setShowTooltip] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className={`bg-white border-b border-zinc-200 ${className}`}>
      {/* Accordion Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 px-4 py-2 flex items-center justify-between text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span>Sequence Interface</span>
            {/* Selection Status in Header */}
            {selectedRegions.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-blue-700">•</span>
                <span className="text-xs text-blue-700">
                  {selectedRegions.length} selection{selectedRegions.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {/* Help Button with Tooltip */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={() => setShowInstructions(true)}
            className="px-3 py-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
            title="Show interaction instructions"
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

      {/* Accordion Content */}
      {isExpanded && (
        <div className="bg-zinc-50">
          <SequenceWorkspace
            pdbId={pdbId}
            isViewerReady={isViewerReady}
            selectedChainIds={selectedChainIds}
            onSelectionChange={onSelectionChange}
            onHighlightChange={onHighlightChange}
            onChainSelectionChange={onChainSelectionChange}
            onChainsLoaded={onChainsLoaded}
            onResidueAction={onResidueAction}
          />
        </div>
      )}

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
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-900">Click & Drag</h4>
                      <p className="text-sm text-zinc-600">Click and drag across residues to select a range</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-900">Right-Click</h4>
                      <p className="text-sm text-zinc-600">Right-click on selected residues for hide/isolate/highlight options</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-zinc-900">Hover</h4>
                      <p className="text-sm text-zinc-600">Hover over residues to see details and temporary highlighting</p>
                    </div>
                  </div>
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
