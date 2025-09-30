"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Droplets, Atom, Zap } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import type { MolstarWrapper } from '@/lib/molstar/MolstarWrapper';
import { REPRESENTATIONS } from '@/config/constants';

interface StructureControlsProps {
  wrapper: MolstarWrapper | null;
  isLoading?: boolean;
  availableChains?: string[];
}

/**
 * Accordion-style structure controls panel
 * Minimal, tight design with collapsible sections
 */
export function StructureControls({ wrapper, isLoading = false, availableChains = [] }: StructureControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentRepresentation, setCurrentRepresentation] = useState<string>('cartoon');
  const [selectedChain, setSelectedChain] = useState<string>('');
  
  // Component visibility state
  const [componentsHidden, setComponentsHidden] = useState({
    water: false,
    ligands: false,
    ions: false,
  });

  // Representation controls
  const handleRepresentationChange = async (representation: string) => {
    if (!wrapper || isLoading) return;
    
    try {
      setCurrentRepresentation(representation);
      
      switch (representation) {
        case 'cartoon':
          await wrapper.setCartoon();
          break;
        case 'surface':
          await wrapper.setSurface();
          break;
        case 'ball-stick':
          await wrapper.setBallAndStick();
          break;
        case 'spacefill':
          await wrapper.setSpacefill();
          break;
      }
    } catch (error) {
      console.error('Error changing representation:', error);
    }
  };

  // Camera controls
  const handleResetCamera = () => {
    wrapper?.resetCamera();
  };

  const handleToggleSpin = () => {
    wrapper?.toggleSpin();
  };

  // Chain operations
  const handleHideChain = async (chainId: string) => {
    if (!wrapper || isLoading) return;
    try {
      await wrapper.hideChain(chainId);
    } catch (error) {
      console.error('Error hiding chain:', error);
    }
  };

  const handleIsolateChain = async (chainId: string) => {
    if (!wrapper || isLoading) return;
    try {
      await wrapper.isolateChain(chainId);
    } catch (error) {
      console.error('Error isolating chain:', error);
    }
  };

  const handleShowAllChains = async () => {
    if (!wrapper || isLoading) return;
    try {
      await wrapper.showAllChains();
      setSelectedChain(''); // Clear selection
      setComponentsHidden({ water: false, ligands: false, ions: false }); // Reset component states
    } catch (error) {
      console.error('Error showing all chains:', error);
    }
  };


  const handleChainSelect = (chainId: string) => {
    setSelectedChain(chainId);
  };

  // Component toggle operations
  const handleToggleWater = async () => {
    if (!wrapper || isLoading) return;
    try {
      if (componentsHidden.water) {
        // Restore water by reloading structure
        await wrapper.showAllChains(); // This reloads the structure
        setComponentsHidden(prev => ({ ...prev, water: false, ligands: false, ions: false }));
      } else {
        // Remove water
        await wrapper.removeWater();
        setComponentsHidden(prev => ({ ...prev, water: true }));
      }
    } catch (error) {
      console.error('Error toggling water:', error);
    }
  };

  const handleToggleLigands = async () => {
    if (!wrapper || isLoading) return;
    try {
      if (componentsHidden.ligands) {
        // Restore ligands by reloading structure
        await wrapper.showAllChains(); // This reloads the structure
        setComponentsHidden(prev => ({ ...prev, water: false, ligands: false, ions: false }));
      } else {
        // Remove ligands
        await wrapper.removeLigands();
        setComponentsHidden(prev => ({ ...prev, ligands: true }));
      }
    } catch (error) {
      console.error('Error toggling ligands:', error);
    }
  };

  const handleToggleIons = async () => {
    if (!wrapper || isLoading) return;
    try {
      if (componentsHidden.ions) {
        // Restore ions by reloading structure
        await wrapper.showAllChains(); // This reloads the structure
        setComponentsHidden(prev => ({ ...prev, water: false, ligands: false, ions: false }));
      } else {
        // Remove ions
        await wrapper.removeIons();
        setComponentsHidden(prev => ({ ...prev, ions: true }));
      }
    } catch (error) {
      console.error('Error toggling ions:', error);
    }
  };

  // Map constants to our method names
  const representationMap: Record<string, string> = {
    'cartoon': 'cartoon',
    'molecular-surface': 'surface',
    'ball-and-stick': 'ball-stick',
    'spacefill': 'spacefill'
  };

  const getCurrentRepLabel = () => {
    const rep = REPRESENTATIONS.find(r => representationMap[r.value] === currentRepresentation);
    return rep?.label || 'Cartoon';
  };

  return (
    <div className="bg-white border-b border-zinc-200">
      {/* Accordion Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        <span>Structure Controls</span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="px-4 pb-3">
          {/* Three Column Layout */}
          <div className="grid grid-cols-3 gap-4">
            {/* First Column - Representation & Camera */}
            <div>
              <h4 className="text-xs font-medium text-zinc-600 mb-2">Representation</h4>
              <Menu as="div" className="relative mb-3">
                <MenuButton 
                  disabled={isLoading}
                  className="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                >
                  <span>{getCurrentRepLabel()}</span>
                  <ChevronDown className="h-3 w-3" />
                </MenuButton>
                <MenuItems className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded shadow-lg focus:outline-none">
                  {REPRESENTATIONS.filter(rep => representationMap[rep.value]).map((rep) => (
                    <MenuItem key={rep.value}>
                      {({ focus }) => (
                        <button
                          onClick={() => handleRepresentationChange(representationMap[rep.value])}
                          className={`w-full px-2 py-1 text-xs text-left ${
                            focus ? 'bg-blue-50 text-blue-700' : 'text-zinc-700'
                          } ${currentRepresentation === representationMap[rep.value] ? 'bg-blue-50 text-blue-700' : ''}`}
                        >
                          {rep.label}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
              
              <h4 className="text-xs font-medium text-zinc-600 mb-2">Camera</h4>
              <div className="flex gap-1">
                <button
                  onClick={handleResetCamera}
                  disabled={isLoading}
                  className="flex-1 px-2 py-1 text-xs bg-white border border-zinc-200 text-zinc-700 rounded hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                <button
                  onClick={handleToggleSpin}
                  disabled={isLoading}
                  className="flex-1 px-2 py-1 text-xs bg-white border border-zinc-200 text-zinc-700 rounded hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Spin
                </button>
              </div>
            </div>

            {/* Second Column - Chains */}
            <div>
              <h4 className="text-xs font-medium text-zinc-600 mb-2">Chains</h4>
              <div className="space-y-1">
                {availableChains.length > 0 ? (
                  <>
                    {/* Chain Selection Dropdown */}
                    <Menu as="div" className="relative">
                      <MenuButton 
                        disabled={isLoading}
                        className="w-full px-2 py-1 text-xs border border-zinc-200 rounded bg-white text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                      >
                        <span>{selectedChain ? `Chain ${selectedChain}` : 'Select Chain'}</span>
                        <ChevronDown className="h-3 w-3" />
                      </MenuButton>
                      <MenuItems className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded shadow-lg focus:outline-none">
                        {availableChains.map((chainId) => (
                          <MenuItem key={chainId}>
                            {({ focus }) => (
                              <button
                                onClick={() => handleChainSelect(chainId)}
                                className={`w-full px-2 py-1 text-xs text-left ${
                                  focus ? 'bg-blue-50 text-blue-700' : 'text-zinc-700'
                                } ${selectedChain === chainId ? 'bg-blue-50 text-blue-700' : ''}`}
                              >
                                Chain {chainId}
                              </button>
                            )}
                          </MenuItem>
                        ))}
                      </MenuItems>
                    </Menu>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => selectedChain && handleHideChain(selectedChain)}
                        disabled={isLoading || !selectedChain}
                        className="flex-1 px-2 py-1 text-xs bg-white border border-zinc-200 text-zinc-700 rounded hover:bg-red-50 hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-zinc-200 disabled:hover:text-zinc-700"
                      >
                        Hide
                      </button>
                      <button
                        onClick={() => selectedChain && handleIsolateChain(selectedChain)}
                        disabled={isLoading || !selectedChain}
                        className="flex-1 px-2 py-1 text-xs bg-white border border-zinc-200 text-zinc-700 rounded hover:bg-green-50 hover:border-green-300 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-zinc-200 disabled:hover:text-zinc-700"
                      >
                        Isolate
                      </button>
                    </div>

                    {/* Show All Button */}
                    <button
                      onClick={handleShowAllChains}
                      disabled={isLoading}
                      className="w-full px-2 py-1 text-xs bg-white border border-zinc-200 text-zinc-700 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Show All
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-zinc-500 italic">No chains</div>
                )}
              </div>
            </div>

            {/* Third Column - Components */}
            <div>
              <h4 className="text-xs font-medium text-zinc-600 mb-2">Components</h4>
              <div className="space-y-1">
                <button
                  onClick={handleToggleWater}
                  disabled={isLoading}
                  className={`w-full px-2 py-1 text-xs border rounded flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    componentsHidden.water
                      ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Droplets className="h-3 w-3" />
                  <span>{componentsHidden.water ? 'Show' : 'Hide'} Water</span>
                </button>
                <button
                  onClick={handleToggleLigands}
                  disabled={isLoading}
                  className={`w-full px-2 py-1 text-xs border rounded flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    componentsHidden.ligands
                      ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Atom className="h-3 w-3" />
                  <span>{componentsHidden.ligands ? 'Show' : 'Hide'} Ligands</span>
                </button>
                <button
                  onClick={handleToggleIons}
                  disabled={isLoading}
                  className={`w-full px-2 py-1 text-xs border rounded flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    componentsHidden.ions
                      ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <Zap className="h-3 w-3" />
                  <span>{componentsHidden.ions ? 'Show' : 'Hide'} Ions</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="text-xs text-zinc-500 italic mt-2">
              Updating structure...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
