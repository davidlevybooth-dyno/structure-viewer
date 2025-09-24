import React, { useState, useEffect } from 'react';
import type { SequenceChain } from './types';

interface ChainSelectorProps {
  chains: SequenceChain[];
  selectedChainIds: string[];
  onSelectionChange: (chainIds: string[]) => void;
  className?: string;
}

export function ChainSelector({
  chains,
  selectedChainIds,
  onSelectionChange,
  className = '',
}: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Smart defaults: show max 3 chains, default to 1 if >3 chains
  useEffect(() => {
    if (selectedChainIds.length === 0 && chains.length > 0) {
      const defaultSelection = chains.length > 3 
        ? [chains[0].id] // Default to first chain if >3 chains
        : chains.slice(0, 3).map(chain => chain.id); // Show up to 3 chains
      
      onSelectionChange(defaultSelection);
    }
  }, [chains, selectedChainIds.length, onSelectionChange]);

  const handleChainToggle = (chainId: string) => {
    const newSelection = selectedChainIds.includes(chainId)
      ? selectedChainIds.filter(id => id !== chainId)
      : [...selectedChainIds, chainId];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(chains.map(chain => chain.id));
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  const handleSelectUnique = () => {
    // Select only chains with unique sequences
    const uniqueChains = chains.reduce((unique, chain) => {
      const sequence = chain.residues.map(r => r.code).join('');
      const isDuplicate = unique.some(c => 
        c.residues.map(r => r.code).join('') === sequence
      );
      if (!isDuplicate) {
        unique.push(chain);
      }
      return unique;
    }, [] as SequenceChain[]);
    
    onSelectionChange(uniqueChains.map(chain => chain.id));
  };

  if (chains.length <= 1) {
    return null; // No selector needed for single chain
  }

  const selectedCount = selectedChainIds.length;
  const totalChains = chains.length;

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          <span className="text-gray-700">
            Chains: {selectedCount}/{totalChains}
          </span>
          {selectedCount > 0 && (
            <div className="flex space-x-1">
              {selectedChainIds.slice(0, 3).map((chainId) => (
                <span
                  key={chainId}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {chainId}
                </span>
              ))}
              {selectedCount > 3 && (
                <span className="text-xs text-gray-500">+{selectedCount - 3}</span>
              )}
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Quick Actions */}
            <div className="p-2 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={handleSelectAll}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  All
                </button>
                <button
                  onClick={handleSelectNone}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  None
                </button>
                <button
                  onClick={handleSelectUnique}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Unique
                </button>
              </div>
            </div>

            {/* Chain List */}
            <div className="py-1">
              {chains.map((chain) => {
                const isSelected = selectedChainIds.includes(chain.id);
                const residueCount = chain.residues.length;
                
                return (
                  <label
                    key={chain.id}
                    className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleChainToggle(chain.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            Chain {chain.id}
                          </span>
                          {chain.name && (
                            <span className="text-sm text-gray-500">
                              ({chain.name})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {residueCount} residues
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Footer Info */}
            {totalChains > 6 && (
              <div className="p-2 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  Large structure detected. Consider selecting fewer chains for better performance.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ChainSelector;
