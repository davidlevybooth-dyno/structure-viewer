/**
 * Region Isolation Controls
 * 
 * Clean UI for isolating chains or regions in the 3D structure viewer
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { 
  isolateRegion, 
  showAllComponents, 
  getAvailableChains,
  getIsolationStatus,
  type RepresentationType,
  type IsolationRegion 
} from '@/lib/molstar/isolation';

interface RegionIsolationControlsProps {
  plugin: PluginUIContext | null;
  className?: string;
  onIsolationChange?: (isolated: boolean) => void;
}

const REPRESENTATION_OPTIONS: { value: RepresentationType; label: string }[] = [
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'molecular-surface', label: 'Surface' },
  { value: 'ball-and-stick', label: 'Ball & Stick' },
  { value: 'spacefill', label: 'Spacefill' },
];

export function RegionIsolationControls({ 
  plugin, 
  className = '',
  onIsolationChange 
}: RegionIsolationControlsProps) {
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [representation, setRepresentation] = useState<RepresentationType>('cartoon');
  const [isIsolated, setIsIsolated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if structures are available (safe check)
  const hasStructures = plugin && (() => {
    try {
      const hierarchy = plugin.managers.structure.hierarchy.current;
      return hierarchy.structures && hierarchy.structures.length > 0;
    } catch {
      return false;
    }
  })();

  // Lazily load available chains only when needed
  const loadChainsIfNeeded = useCallback(() => {
    if (!plugin || !hasStructures) return;

    try {
      const chains = getAvailableChains(plugin);
      if (chains.length > 0) {
        setAvailableChains(chains);
        if (!selectedChain) {
          setSelectedChain(chains[0]);
        }
      }

      // Check isolation status
      const status = getIsolationStatus(plugin);
      setIsIsolated(status.hasIsolation);
    } catch (error) {
      console.warn('Failed to load chains:', error);
    }
  }, [plugin, hasStructures, selectedChain]);

  // Load chains when structures become available
  useEffect(() => {
    if (hasStructures && availableChains.length === 0) {
      loadChainsIfNeeded();
    }
  }, [hasStructures, availableChains.length, loadChainsIfNeeded]);

  // Reset state when plugin changes
  useEffect(() => {
    setAvailableChains([]);
    setSelectedChain('');
    setIsIsolated(false);
  }, [plugin]);

  const handleIsolateChain = useCallback(async () => {
    if (!plugin || !selectedChain) return;

    setIsLoading(true);
    try {
      const region: IsolationRegion = { chain: selectedChain };
      const success = await isolateRegion(plugin, region, { 
        representation,
        focusCamera: true,
        hideOthers: true 
      });

      if (success) {
        setIsIsolated(true);
        onIsolationChange?.(true);
      }
    } catch (error) {
      console.error('Failed to isolate chain:', error);
    } finally {
      setIsLoading(false);
    }
  }, [plugin, selectedChain, representation, onIsolationChange]);

  const handleShowAll = useCallback(async () => {
    if (!plugin) return;

    setIsLoading(true);
    try {
      const success = await showAllComponents(plugin);
      if (success) {
        setIsIsolated(false);
        onIsolationChange?.(false);
      }
    } catch (error) {
      console.error('Failed to show all components:', error);
    } finally {
      setIsLoading(false);
    }
  }, [plugin, onIsolationChange]);

  // Only render when we have structures loaded
  if (!plugin || !hasStructures) {
    return (
      <div className={`bg-gray-50 rounded-lg border p-4 ${className}`}>
        <h3 className="text-sm font-medium text-gray-500">Chain Isolation</h3>
        <p className="text-xs text-gray-400 mt-2">Load a structure to enable chain isolation controls.</p>
      </div>
    );
  }

  // Don't render if we haven't loaded chains yet
  if (availableChains.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg border p-4 ${className}`}>
        <h3 className="text-sm font-medium text-gray-500">Chain Isolation</h3>
        <p className="text-xs text-gray-400 mt-2">Loading chain information...</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Chain Isolation</h3>
        {isIsolated && (
          <span className="text-xs text-orange-600 font-medium">
            Isolated View
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Chain Selection */}
        <div>
          <label htmlFor="chain-select" className="block text-xs font-medium text-gray-700 mb-1">
            Chain
          </label>
          <select
            id="chain-select"
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          >
            {availableChains.map(chain => (
              <option key={chain} value={chain}>
                Chain {chain}
              </option>
            ))}
          </select>
        </div>

        {/* Representation Selection */}
        <div>
          <label htmlFor="representation-select" className="block text-xs font-medium text-gray-700 mb-1">
            Style
          </label>
          <select
            id="representation-select"
            value={representation}
            onChange={(e) => setRepresentation(e.target.value as RepresentationType)}
            className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          >
            {REPRESENTATION_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleIsolateChain}
            disabled={isLoading || !selectedChain}
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Isolating...' : 'Isolate Chain'}
          </button>
          
          {isIsolated && (
            <button
              onClick={handleShowAll}
              disabled={isLoading}
              className="flex-1 bg-gray-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Show All
            </button>
          )}
        </div>
      </div>

      {/* Status Info */}
      {availableChains.length > 1 && (
        <div className="text-xs text-gray-500 border-t pt-2">
          {availableChains.length} chains available: {availableChains.join(', ')}
        </div>
      )}
    </div>
  );
}
