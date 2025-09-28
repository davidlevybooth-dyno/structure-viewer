"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { useMolstar } from "@/contexts/MolstarContext";

// Representation API from experimental branch
class MolstarRepresentationAPI {
  constructor(private plugin: PluginUIContext) {}

  async setRepresentation(repType: string): Promise<boolean> {
    try {
      console.log(`🎨 Setting representation to ${repType}`);
      
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      const update = this.plugin.state.data.build();
      
      // Update existing representations in place (safe approach)
      for (const structure of hierarchy.structures) {
        for (const component of structure.components) {
          for (const representation of component.representations) {
            update.to(representation.cell.transform.ref).update({
              type: { name: repType, params: {} },
              colorTheme: { name: 'chain-id', params: {} },
              sizeTheme: { name: 'uniform', params: { value: 1 } },
            });
          }
        }
      }
      
      await update.commit();
      console.log(`✅ Representation set to ${repType}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to set representation:`, error);
      return false;
    }
  }
}

// Chain isolation from experimental branch
async function isolateChain(plugin: PluginUIContext, chainId: string): Promise<boolean> {
  try {
    console.log(`🎯 Isolating chain ${chainId}`);
    
    const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
    const { Script } = await import('molstar/lib/mol-script/script');
    const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
    
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) return false;
    
    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) return false;
    
    const structureData = structure.cell.obj.data;
    const allComponents = hierarchy.structures.flatMap(s => s.components);
    
    // Get all chains except target
    const allChains = new Set<string>();
    for (const unit of structureData.units) {
      if (unit.kind === 0) {
        const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
        const currentChainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
        if (currentChainId) allChains.add(currentChainId);
      }
    }
    allChains.delete(chainId);
    
    // Hide each other chain
    for (const hideChainId of Array.from(allChains)) {
      const chainSelection = MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_asym_id(), 
          hideChainId
        ])
      });
      
      const selection = Script.getStructureSelection(chainSelection, structureData);
      const loci = StructureSelection.toLociWithSourceUnits(selection);
      
      if (loci.elements?.length > 0) {
        plugin.managers.structure.selection.fromLoci('set', loci);
        await plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
        plugin.managers.structure.selection.clear();
      }
    }
    
    console.log(`✅ Chain ${chainId} isolated`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to isolate chain:`, error);
    return false;
  }
}

async function showAllChains(plugin: PluginUIContext): Promise<boolean> {
  try {
    console.log('🔄 Restoring all chains');
    window.location.reload(); // Simple but reliable reset
    return true;
  } catch (error) {
    console.error('❌ Failed to show all chains:', error);
    return false;
  }
}

function getAvailableChains(plugin: PluginUIContext): string[] {
  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    if (!hierarchy.structures.length) return [];

    const structure = hierarchy.structures[0];
    if (!structure?.cell?.obj?.data) return [];

    const structureData = structure.cell.obj.data;
    const chains = new Set<string>();
    
    for (const unit of structureData.units) {
      if (unit.kind === 0) {
        const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]];
        const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
        if (chainId) chains.add(chainId);
      }
    }

    return Array.from(chains).sort();
  } catch (error) {
    console.warn('Failed to extract chains:', error);
    return [];
  }
}

export function MolstarControlsDropdown() {
  const { plugin } = useMolstar();
  const [isOpen, setIsOpen] = useState(false);
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>("");

  useEffect(() => {
    if (plugin) {
      const chains = getAvailableChains(plugin);
      setAvailableChains(chains);
      if (chains.length > 0 && !selectedChain) {
        setSelectedChain(chains[0]);
      }
    }
  }, [plugin, selectedChain]);

  const handleAction = async (actionFn: () => Promise<boolean>) => {
    if (!plugin) return;
    try {
      await actionFn();
      setIsOpen(false); // Close dropdown after action
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  const repAPI = plugin ? new MolstarRepresentationAPI(plugin) : null;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => plugin && setIsOpen(!isOpen)}
        disabled={!plugin}
        className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded border border-zinc-300 ${
          plugin 
            ? 'text-zinc-700 hover:bg-zinc-200 cursor-pointer' 
            : 'text-zinc-400 cursor-not-allowed'
        }`}
        style={{ backgroundColor: plugin ? '#e0e0e0' : '#f5f5f5' }}
      >
        {plugin ? 'Controls' : 'Loading...'}
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 z-50 mt-1 w-48 bg-white border border-zinc-200 rounded shadow-lg">
            
            {/* Representations */}
            <div className="p-2 border-b border-zinc-100">
              <div className="text-xs text-zinc-500 mb-1">View</div>
              <div className="space-y-1">
                <button
                  onClick={() => handleAction(() => repAPI.setRepresentation('cartoon'))}
                  className="block w-full text-left px-2 py-1 text-sm hover:bg-zinc-50 rounded"
                >
                  Cartoon
                </button>
                <button
                  onClick={() => handleAction(() => repAPI.setRepresentation('molecular-surface'))}
                  className="block w-full text-left px-2 py-1 text-sm hover:bg-zinc-50 rounded"
                >
                  Surface
                </button>
                <button
                  onClick={() => handleAction(() => repAPI.setRepresentation('ball-and-stick'))}
                  className="block w-full text-left px-2 py-1 text-sm hover:bg-zinc-50 rounded"
                >
                  Ball & Stick
                </button>
              </div>
            </div>

            {/* Chain Controls */}
            {availableChains.length > 0 && (
              <div className="p-2">
                <div className="text-xs text-zinc-500 mb-1">Chains</div>
                
                {/* Chain Selector */}
                <select
                  value={selectedChain}
                  onChange={(e) => setSelectedChain(e.target.value)}
                  className="w-full mb-2 px-2 py-1 text-sm border border-zinc-200 rounded"
                >
                  {availableChains.map((chain) => (
                    <option key={chain} value={chain}>Chain {chain}</option>
                  ))}
                </select>

                {/* Chain Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => handleAction(() => isolateChain(plugin, selectedChain))}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-zinc-50 rounded"
                  >
                    Isolate {selectedChain}
                  </button>
                  <button
                    onClick={() => handleAction(() => showAllChains(plugin))}
                    className="block w-full text-left px-2 py-1 text-sm hover:bg-zinc-50 rounded"
                  >
                    Show All
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}