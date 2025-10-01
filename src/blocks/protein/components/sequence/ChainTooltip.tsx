"use client";

import React from "react";

interface ChainInfo {
  id: string;
  name?: string;
  residueCount: number;
  description?: string;
}

interface ChainTooltipProps {
  chain: ChainInfo;
  isVisible: boolean;
  className?: string;
}

/**
 * ChainTooltip - Enhanced tooltip for chain information
 * Shows chain ID, name, residue count, and description with arrow pointer
 */
export function ChainTooltip({
  chain,
  isVisible,
  className = "",
}: ChainTooltipProps) {
  if (!isVisible) return null;

  return (
    <div
      className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-10 ${className}`}
    >
      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs">
        <div className="font-semibold text-white">Chain {chain.id}</div>
        {chain.name && (
          <div className="text-gray-300 mt-1 leading-tight">
            {chain.name.length > 50
              ? `${chain.name.substring(0, 50)}...`
              : chain.name}
          </div>
        )}
        <div className="text-gray-400 mt-1">
          {chain.residueCount.toLocaleString()} residues
        </div>
        {chain.description && (
          <div className="text-gray-400 mt-1 text-xs">{chain.description}</div>
        )}
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );
}
