/**
 * ChainSelector - Interactive multi-select component for protein chains
 * Uses colored pills with modern flat design and smart selection logic
 */

'use client';

import React, { useState } from 'react';

interface ChainInfo {
  id: string;
  name?: string;
  residueCount: number;
  description?: string;
}

interface ChainSelectorProps {
  chains: ChainInfo[];
  selectedChainIds: string[];
  onSelectionChange: (chainIds: string[]) => void;
  className?: string;
}

// Bright colors for selected chains - unselected will be grey
const CHAIN_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500',
  'bg-violet-500', 'bg-fuchsia-500', 'bg-sky-500', 'bg-green-500',
  'bg-yellow-500', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600',
];

export function ChainSelector({ 
  chains, 
  selectedChainIds, 
  onSelectionChange, 
  className = '' 
}: ChainSelectorProps) {
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Pagination settings
  const CHAINS_PER_PAGE = 12;
  const totalPages = Math.ceil(chains.length / CHAINS_PER_PAGE);
  const startIndex = currentPage * CHAINS_PER_PAGE;
  const visibleChains = chains.slice(startIndex, startIndex + CHAINS_PER_PAGE);
  
  const handleChainToggle = (chainId: string) => {
    const isSelected = selectedChainIds.includes(chainId);
    
    if (isSelected) {
      // Deselect - but ensure at least one chain remains selected
      if (selectedChainIds.length > 1) {
        onSelectionChange(selectedChainIds.filter(id => id !== chainId));
      }
    } else {
      // Select
      onSelectionChange([...selectedChainIds, chainId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(chains.map(chain => chain.id));
  };

  const handleSelectNone = () => {
    // Keep at least one selected
    if (chains.length > 0) {
      onSelectionChange([chains[0].id]);
    }
  };

  if (chains.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Chain pills container - keep horizontal */}
      <div className="flex items-center gap-1.5">
        {visibleChains.map((chain, index) => {
          const isSelected = selectedChainIds.includes(chain.id);
          const globalIndex = startIndex + index;
          const selectedColor = CHAIN_COLORS[globalIndex % CHAIN_COLORS.length];
          const isHovered = hoveredChain === chain.id;
          
          return (
            <div key={chain.id} className="relative">
              {/* Chain pill button with high contrast */}
              <button
                onClick={() => handleChainToggle(chain.id)}
                onMouseEnter={() => setHoveredChain(chain.id)}
                onMouseLeave={() => setHoveredChain(null)}
                className={`
                  px-2.5 py-1 text-xs rounded-md font-mono font-medium
                  transition-all duration-200 ease-out
                  min-w-[28px] flex items-center justify-center
                  ${isSelected 
                    ? `${selectedColor} text-white shadow-md hover:shadow-lg` 
                    : 'bg-gray-300 text-gray-600 hover:bg-gray-400 hover:text-gray-700'
                  }
                  hover:scale-105 active:scale-95
                `}
                title={`Chain ${chain.id}${chain.name ? ` - ${chain.name}` : ''}`}
              >
                {chain.id}
              </button>

              {/* Enhanced tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs">
                    <div className="font-semibold text-white">Chain {chain.id}</div>
                    {chain.name && (
                      <div className="text-gray-300 mt-1 leading-tight">
                        {chain.name.length > 50 ? `${chain.name.substring(0, 50)}...` : chain.name}
                      </div>
                    )}
                    <div className="text-gray-400 mt-1">
                      {chain.residueCount.toLocaleString()} residues
                    </div>
                    {chain.description && (
                      <div className="text-gray-400 mt-1 text-xs">
                        {chain.description}
                      </div>
                    )}
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
        
      {/* Compact inline controls */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {/* Selection summary */}
        <div className="flex items-center">
          <span className="font-medium">{selectedChainIds.length}</span>
          <span className="mx-0.5">/</span>
          <span>{chains.length}</span>
        </div>
        
        {/* Pagination controls - inline and compact */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              title="Previous page"
            >
              ←
            </button>
            <span className="text-xs text-gray-400 min-w-[30px] text-center">
              {currentPage + 1}/{totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              title="Next page"
            >
              →
            </button>
          </div>
        )}
        
        {/* Quick action buttons for many chains */}
        {chains.length > 6 && (
          <div className="flex gap-1">
            <button
              onClick={handleSelectAll}
              className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              title="Select all chains"
            >
              All
            </button>
            <button
              onClick={handleSelectNone}
              className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              title="Select only first chain"
            >
              One
            </button>
          </div>
        )}
      </div>
    </div>
  );
}