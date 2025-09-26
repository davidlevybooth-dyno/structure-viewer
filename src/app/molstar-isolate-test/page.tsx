'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

// Representation API - Clean interface for programmatic control
class MolstarRepresentationAPI {
  constructor(private plugin: PluginUIContext) {}

  // Core method to set representation safely
  async setRepresentation(repType: string): Promise<boolean> {
    try {
      console.log(`🎨 API: Setting representation to ${repType}`);
      
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      const update = this.plugin.state.data.build();
      
      console.log(`🔍 API: ${hierarchy.structures.length} structures, ${hierarchy.structures.flatMap(s => s.components).length} components`);
      
      // SAFE APPROACH: Update existing representations in place
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
      
      // Verify success
      const postHierarchy = this.plugin.managers.structure.hierarchy.current;
      const componentsPreserved = hierarchy.structures.flatMap(s => s.components).length === 
                                 postHierarchy.structures.flatMap(s => s.components).length;
      
      console.log(`✅ API: Representation set to ${repType}, components preserved: ${componentsPreserved}`);
      return true;
      
    } catch (error) {
      console.error(`❌ API: Failed to set representation to ${repType}:`, error);
      return false;
    }
  }

  // Convenience methods for specific representations
  async setCartoon(): Promise<boolean> { return this.setRepresentation('cartoon'); }
  async setSurface(): Promise<boolean> { return this.setRepresentation('molecular-surface'); }
  async setBallAndStick(): Promise<boolean> { return this.setRepresentation('ball-and-stick'); }
  async setSpacefill(): Promise<boolean> { return this.setRepresentation('spacefill'); }
  async setPoint(): Promise<boolean> { return this.setRepresentation('point'); }

  // Get current representation (if we need it)
  getCurrentRepresentation(): string | null {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      const firstRep = hierarchy.structures[0]?.components[0]?.representations[0];
      return firstRep?.cell?.params?.type?.name || null;
    } catch {
      return null;
    }
  }
}

// Representation controls component
function RepresentationControls({ plugin }: { plugin: PluginUIContext | null }) {
  const [currentRepresentation, setCurrentRepresentation] = useState<string>('cartoon');
  const [isLoading, setIsLoading] = useState(false);

  // SAFE representation change that preserves component structure
  const changeRepresentation = useCallback(async (repType: string) => {
    if (!plugin) return;
    
    setIsLoading(true);
    try {
      console.log(`🎨 SAFE changing representation to: ${repType}`);
      
      const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
      
      // Find all current structure representations
      const hierarchy = plugin.managers.structure.hierarchy.current;
      const update = plugin.state.data.build();
      
      console.log(`🔍 Pre-change: ${hierarchy.structures.length} structures, ${hierarchy.structures.flatMap(s => s.components).length} components`);
      
      // SAFER APPROACH: Update existing representations instead of deleting them
      for (const structure of hierarchy.structures) {
        for (const component of structure.components) {
          for (const representation of component.representations) {
            // Update the representation type in place
            update.to(representation.cell.transform.ref).update({
              type: { name: repType, params: {} },
              colorTheme: { name: 'chain-id', params: {} },
              sizeTheme: { name: 'uniform', params: { value: 1 } },
            });
          }
        }
      }
      
      await update.commit();
      
      // Verify component structure is intact
      const newHierarchy = plugin.managers.structure.hierarchy.current;
      console.log(`🔍 Post-change: ${newHierarchy.structures.length} structures, ${newHierarchy.structures.flatMap(s => s.components).length} components`);
      
      setCurrentRepresentation(repType);
      console.log(`✅ SAFE representation changed to: ${repType}`);
      
    } catch (error) {
      console.error('Failed to change representation safely:', error);
      console.log('🔄 Falling back to full rebuild...');
      
      // Fallback to the delete/recreate approach if update fails
      try {
        const hierarchy = plugin.managers.structure.hierarchy.current;
        const update = plugin.state.data.build();
        
        // Remove existing representations
        for (const structure of hierarchy.structures) {
          for (const component of structure.components) {
            for (const representation of component.representations) {
              update.delete(representation.cell.transform.ref);
            }
          }
        }
        
        // Add new representations
        const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
        for (const structure of hierarchy.structures) {
          for (const component of structure.components) {
            update.to(component.cell.transform.ref).apply(StateTransforms.Representation.StructureRepresentation3D, {
              type: { name: repType, params: {} },
              colorTheme: { name: 'chain-id', params: {} },
              sizeTheme: { name: 'uniform', params: { value: 1 } },
            });
          }
        }
        
        await update.commit();
        setCurrentRepresentation(repType);
        console.log(`✅ Fallback representation changed to: ${repType}`);
        
      } catch (fallbackError) {
        console.error('Both safe and fallback representation change failed:', fallbackError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [plugin]);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">🎨 Representation</h4>
      <div className="grid grid-cols-3 gap-1">
        {['cartoon', 'molecular-surface', 'ball-and-stick'].map((repType) => (
          <button
            key={repType}
            onClick={() => changeRepresentation(repType)}
            disabled={!plugin || isLoading}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentRepresentation === repType
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {repType === 'cartoon' ? 'Cartoon' : 
             repType === 'molecular-surface' ? 'Surface' : 
             'Ball & Stick'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {['spacefill', 'point'].map((repType) => (
          <button
            key={repType}
            onClick={() => changeRepresentation(repType)}
            disabled={!plugin || isLoading}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentRepresentation === repType
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {repType === 'spacefill' ? 'Spacefill' : 'Point'}
          </button>
        ))}
      </div>
      <p className="text-xs text-purple-600">Current: {currentRepresentation}</p>
    </div>
  );
}

// API-based representation controls - Different button styles for testing
function RepresentationAPIControls({ plugin }: { plugin: PluginUIContext | null }) {
  const [currentRep, setCurrentRep] = useState<string>('cartoon');
  const [isLoading, setIsLoading] = useState(false);
  const [api, setApi] = useState<MolstarRepresentationAPI | null>(null);

  // Initialize API when plugin is available
  useEffect(() => {
    if (plugin) {
      setApi(new MolstarRepresentationAPI(plugin));
    }
  }, [plugin]);

  // Generic API caller
  const callAPI = useCallback(async (method: () => Promise<boolean>, repName: string) => {
    if (!api) return;
    
    setIsLoading(true);
    try {
      const success = await method();
      if (success) {
        setCurrentRep(repName);
        console.log(`🎯 API call successful: ${repName}`);
      } else {
        console.log(`⚠️ API call failed: ${repName}`);
      }
    } catch (error) {
      console.error(`❌ API call error: ${repName}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">🚀 API-Based Controls</h4>
      
      {/* Style 1: Individual method buttons */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Direct API Methods:</p>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => api && callAPI(() => api.setCartoon(), 'cartoon')}
            disabled={!api || isLoading}
            className={`px-2 py-1 text-xs rounded ${currentRep === 'cartoon' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 disabled:opacity-50`}
          >
            🎭 Cartoon
          </button>
          <button
            onClick={() => api && callAPI(() => api.setSurface(), 'molecular-surface')}
            disabled={!api || isLoading}
            className={`px-2 py-1 text-xs rounded ${currentRep === 'molecular-surface' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 disabled:opacity-50`}
          >
            🌊 Surface
          </button>
          <button
            onClick={() => api && callAPI(() => api.setBallAndStick(), 'ball-and-stick')}
            disabled={!api || isLoading}
            className={`px-2 py-1 text-xs rounded ${currentRep === 'ball-and-stick' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 disabled:opacity-50`}
          >
            🔗 Ball & Stick
          </button>
          <button
            onClick={() => api && callAPI(() => api.setSpacefill(), 'spacefill')}
            disabled={!api || isLoading}
            className={`px-2 py-1 text-xs rounded ${currentRep === 'spacefill' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 disabled:opacity-50`}
          >
            ⚫ Spacefill
          </button>
        </div>
      </div>

      {/* Style 2: Generic setRepresentation calls */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Generic API Calls:</p>
        <div className="grid grid-cols-3 gap-1">
          {['cartoon', 'molecular-surface', 'point'].map((rep) => (
            <button
              key={rep}
              onClick={() => api && callAPI(() => api.setRepresentation(rep), rep)}
              disabled={!api || isLoading}
              className={`px-2 py-1 text-xs rounded ${currentRep === rep ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-green-500 disabled:opacity-50`}
            >
              {rep.split('-')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Style 3: Programmatic preset combinations */}
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Preset Combinations:</p>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={async () => {
              if (!api) return;
              setIsLoading(true);
              await api.setCartoon();
              console.log('🎯 Preset: Protein Analysis (Cartoon)');
              setCurrentRep('cartoon');
              setIsLoading(false);
            }}
            disabled={!api || isLoading}
            className="px-2 py-1 text-xs bg-purple-200 text-purple-700 rounded hover:bg-purple-300 disabled:opacity-50"
          >
            🧬 Protein Analysis
          </button>
          <button
            onClick={async () => {
              if (!api) return;
              setIsLoading(true);
              await api.setSurface();
              console.log('🎯 Preset: Binding Site (Surface)');
              setCurrentRep('molecular-surface');
              setIsLoading(false);
            }}
            disabled={!api || isLoading}
            className="px-2 py-1 text-xs bg-purple-200 text-purple-700 rounded hover:bg-purple-300 disabled:opacity-50"
          >
            🏠 Binding Site
          </button>
        </div>
      </div>

      <p className="text-xs text-blue-600">Current: {currentRep} {isLoading && '(loading...)'}</p>
    </div>
  );
}

// Chain isolation component using official Mol* approach
function ChainIsolationControls({ plugin }: { plugin: PluginUIContext | null }) {
  const [availableChains, setAvailableChains] = useState<string[]>([]);
  const [selectedChain, setSelectedChain] = useState<string>('');
  const [isIsolated, setIsIsolated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Discover available chains from the structure
  const discoverChains = useCallback(async () => {
    if (!plugin) return;
    
    try {
      const hierarchy = plugin.managers.structure.hierarchy.current;
      if (!hierarchy.structures.length) return;
      
      const structure = hierarchy.structures[0];
      if (!structure.cell?.obj?.data) return;
      
      // Get unique chain IDs from the structure
      const chains = new Set<string>();
      
      // Use Mol* API to get chain information
      const structureData = structure.cell.obj.data;
      
      // Iterate through units to find chains using correct Mol* API
      for (const unit of structureData.units) {
        if (unit.kind === 0) { // atomic unit
          const model = unit.model;
          const { chainAtomSegments, chains: chainTable } = model.atomicHierarchy;
          
          // Get first element to find chain
          if (unit.elements.length > 0) {
            const firstElement = unit.elements[0];
            const chainIndex = chainAtomSegments.index[firstElement];
            const asymId = chainTable.label_asym_id.value(chainIndex);
            if (asymId) chains.add(asymId);
          }
        }
      }
      
      const chainList = Array.from(chains).sort();
      console.log('🔍 Discovered chains:', chainList);
      setAvailableChains(chainList);
      
      // Auto-select first chain if none selected
      if (!selectedChain && chainList.length > 0) {
        setSelectedChain(chainList[0]);
      }
      
    } catch (error) {
      console.error('Failed to discover chains:', error);
      
      // Fallback: try alternative approach
      try {
        console.log('🔄 Trying alternative chain discovery...');
        const hierarchy = plugin.managers.structure.hierarchy.current;
        const structure = hierarchy.structures[0];
        if (!structure) return;
        
        const structureData = structure.cell.obj.data;
        const chains = new Set<string>();
        
        // Alternative: iterate through all chain data directly
        for (const unit of structureData.units) {
          if (unit.kind === 0) { // atomic unit
            const chainTable = unit.model.atomicHierarchy.chains;
            for (let i = 0; i < chainTable.label_asym_id.rowCount; i++) {
              const asymId = chainTable.label_asym_id.value(i);
              if (asymId) chains.add(asymId);
            }
          }
        }
        
        const chainList = Array.from(chains).sort();
        console.log('🔍 Alternative discovered chains:', chainList);
        setAvailableChains(chainList);
        
        if (!selectedChain && chainList.length > 0) {
          setSelectedChain(chainList[0]);
        }
        
      } catch (fallbackError) {
        console.error('Fallback chain discovery also failed:', fallbackError);
        setAvailableChains([]);
      }
    }
  }, [plugin, selectedChain]);

  // Hide a specific chain using the working selection + subtraction method
  const hideChain = useCallback(async (chainId: string) => {
    if (!plugin || !chainId) return;
    
    setIsLoading(true);
    try {
      // Debug: Check what's available in the plugin
      console.log('🔍 Debug plugin state:');
      console.log('Plugin state tree keys:', Object.keys(plugin.state.data.tree));
      
      // Try finding structure using different approaches
      let structureRef;
      
      // Approach 1: Check hierarchy
      const hierarchy = plugin.managers.structure.hierarchy.current;
      console.log('📊 Hierarchy:', hierarchy);
      console.log('📊 Hierarchy structures count:', hierarchy.structures?.length || 0);
      
      if (hierarchy.structures?.length > 0) {
        const structure = hierarchy.structures[0];
        console.log('📊 First structure:', structure);
        console.log('📊 Structure cell:', structure?.cell);
        console.log('📊 Structure cell ref:', structure?.cell?.ref);
        
        if (structure?.cell?.ref) {
          structureRef = structure.cell.ref;
          console.log('✅ Found structure ref from hierarchy:', structureRef);
        } else {
          // Try using the structure cell directly if ref is missing
          if (structure?.cell) {
            structureRef = structure.cell;
            console.log('✅ Using structure cell as ref:', structureRef);
          }
        }
      }
      
      // Approach 2: Search state tree for any structure nodes
      if (!structureRef) {
        console.log('🔍 Searching state tree for structures...');
        
        // Look for various structure-related transforms
        const stateTransforms = ['structure', 'model', 'trajectory'];
        
        for (const transformType of stateTransforms) {
          try {
            const nodes = plugin.state.data.select(
              plugin.state.data.selectQ(q => q.ofType(transformType as any))
            );
            console.log(`📊 Found ${nodes.length} ${transformType} nodes:`, nodes);
            
            if (nodes.length > 0) {
              structureRef = nodes[0];
              console.log(`✅ Using ${transformType} node as structure ref:`, structureRef);
              break;
            }
          } catch (error) {
            console.log(`❌ Failed to search for ${transformType}:`, error);
          }
        }
      }
      
      // Approach 3: Look for any data nodes that might contain structure
      if (!structureRef) {
        console.log('🔍 Looking for any data nodes...');
        const allNodes = plugin.state.data.select(plugin.state.data.selectQ(q => q.root));
        console.log('📊 All state nodes:', allNodes);
        
        // Find nodes that have structure-like data
        for (const node of allNodes) {
          const nodeData = plugin.state.data.select(node)[0];
          console.log(`📊 Node ${node} data:`, nodeData);
          
          if (nodeData?.obj?.data && typeof nodeData.obj.data === 'object') {
            // Check if this looks like a structure
            if ('units' in nodeData.obj.data || 'models' in nodeData.obj.data) {
              structureRef = node;
              console.log('✅ Found structure-like node:', structureRef);
              break;
            }
          }
        }
      }
      
      if (!structureRef) {
        console.error('❌ Could not find any structure reference');
        console.log('Available state tree:', plugin.state.data.tree);
        return;
      }
      
      // Import required Mol* modules
      const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
      
      // Build transaction to create isolated chain component
      const update = plugin.state.data.build();
      
      // Working approach: Use the proven selection + subtraction method like component removal
      console.log(`🧬 Hiding chain ${chainId} using selection method...`);
      
      // Import MolScript modules
      const MolScriptModule = await import('molstar/lib/mol-script/language/builder');
      const ScriptModule = await import('molstar/lib/mol-script/script');
      const StructureSelectionModule = await import('molstar/lib/mol-model/structure/query');
      const MS = MolScriptModule.MolScriptBuilder;
      const Script = ScriptModule.Script;
      const StructureSelection = StructureSelectionModule.StructureSelection;
      
      // Get structure data
      const structureData = structureRef.obj?.data;
      if (!structureData) {
        console.error('❌ No structure data found');
        return;
      }
      
      // Build selection for the desired chain
      const keepChainSelection = MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_asym_id(), 
          chainId
        ])
      });
      
      const keepSelection = Script.getStructureSelection(keepChainSelection, structureData);
      const keepLoci = StructureSelection.toLociWithSourceUnits(keepSelection);
      
      console.log(`🧬 Built selection for chain ${chainId}`);
      
      // Use the working method: hide the selected chain
      // First set the selection to what we want to hide
      plugin.managers.structure.selection.fromLoci('set', keepLoci);
      
      // Get all components and subtract the selection (hide the selected chain)
      const allComponents = hierarchy.structures.flatMap(s => s.components);
      console.log(`🧬 Found ${allComponents.length} components to process`);
      
      // Use modifyByCurrentSelection to hide the selected chain
      const result = await plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
      console.log(`🧬 Modification result:`, result);
      
      if (result && Array.isArray(result)) {
        console.log(`🧬 Modified ${result.length} components`);
      } else {
        console.log(`🧬 Modification completed (result format: ${typeof result})`);
      }
      
      // Clear the selection
      plugin.managers.structure.selection.clear();
      
      console.log(`✅ Chain ${chainId} hidden successfully using selection method`);
      
      // Don't focus camera on hidden chain - that would be weird!
      // Instead, just leave the camera where it is
      
      // Don't set isIsolated to true - allow multiple hide operations
      console.log(`✅ Chain ${chainId} hidden successfully`);
      
    } catch (error) {
      console.error('Failed to isolate chain:', error);
    } finally {
      setIsLoading(false);
    }
  }, [plugin]);

  // True chain isolation - hide all OTHER chains (inverse of hide chain)
  const isolateChain = useCallback(async (chainId: string) => {
    if (!plugin || !chainId) return;
    
    setIsLoading(true);
    try {
      console.log(`🎯 True isolation: Hiding all chains except ${chainId}...`);
      
      // Use the working selection + subtraction method but in reverse
      // Import MolScript modules
      const MolScriptModule = await import('molstar/lib/mol-script/language/builder');
      const ScriptModule = await import('molstar/lib/mol-script/script');
      const StructureSelectionModule = await import('molstar/lib/mol-model/structure/query');
      const MS = MolScriptModule.MolScriptBuilder;
      const Script = ScriptModule.Script;
      const StructureSelection = StructureSelectionModule.StructureSelection;
      
      // Get structure reference (same as hideChain function)
      const hierarchy = plugin.managers.structure.hierarchy.current;
      if (!hierarchy.structures?.length) {
        console.error('❌ No structures found in hierarchy');
        return;
      }
      
      let structureRef;
      const structure = hierarchy.structures[0];
      if (!structure?.cell) {
        console.error('❌ Invalid structure or missing cell');
        return;
      }
      
      structureRef = structure.cell;
      console.log('✅ Using structure cell as ref:', structureRef);
      
      // Get structure data
      const structureData = structureRef.obj?.data;
      if (!structureData) {
        console.error('❌ No structure data found');
        return;
      }
      
      // Get all available chains except the one we want to keep
      const allComponents = hierarchy.structures.flatMap(s => s.components);
      
      // Get all chains from the structure
      const allChains = new Set<string>();
      for (const unit of structureData.units) {
        if (unit.kind === 0) { // atomic unit
          const model = unit.model;
          const { chainAtomSegments, chains: chainTable } = model.atomicHierarchy;
          
          // Get first element to find chain
          if (unit.elements.length > 0) {
            const firstElement = unit.elements[0];
            const chainIndex = chainAtomSegments.index[firstElement];
            const asymId = chainTable.label_asym_id.value(chainIndex);
            if (asymId) allChains.add(asymId);
          }
        }
      }
      
      // Remove the chain we want to keep from the list
      allChains.delete(chainId);
      const chainsToHide = Array.from(allChains);
      
      console.log(`🎯 Chains to hide: ${chainsToHide.join(', ')}, keeping: ${chainId}`);
      console.log(`🎯 Total components available: ${allComponents.length}`);
      
      // Debug: Check what components we have before hiding
      for (const [i, comp] of allComponents.entries()) {
        console.log(`🔍 Component ${i}: ${comp.cell.obj?.label || 'Unknown'}`);
      }
      
      // Hide each other chain using our working method
      for (const hideChainId of chainsToHide) {
        console.log(`🎯 Hiding chain ${hideChainId}...`);
        
        // Build selection for this chain to hide
        const hideChainSelection = MS.struct.generator.atomGroups({
          'chain-test': MS.core.rel.eq([
            MS.struct.atomProperty.macromolecular.label_asym_id(), 
            hideChainId
          ])
        });
        
        console.log(`🔍 Testing selection for chain ${hideChainId}...`);
        const hideSelection = Script.getStructureSelection(hideChainSelection, structureData);
        const hideLoci = StructureSelection.toLociWithSourceUnits(hideSelection);
        console.log(`🔍 Loci elements found: ${hideLoci.elements?.length || 0}`);
        
        if (hideLoci.elements?.length > 0) {
          // Set selection and hide it
          plugin.managers.structure.selection.fromLoci('set', hideLoci);
          const result = await plugin.managers.structure.component.modifyByCurrentSelection(allComponents, 'subtract');
          plugin.managers.structure.selection.clear();
          
          console.log(`✅ Hidden chain ${hideChainId}, result:`, result?.length || 0);
        } else {
          console.log(`⚠️ No atoms found for chain ${hideChainId} - skipping`);
        }
      }
      
      // Focus camera on the remaining chain
      const keepChainSelection = MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_asym_id(), 
          chainId
        ])
      });
      
      const keepSelection = Script.getStructureSelection(keepChainSelection, structureData);
      const keepLoci = StructureSelection.toLociWithSourceUnits(keepSelection);
      
      setTimeout(async () => {
        try {
          plugin.managers.camera.focusLoci(keepLoci);
          console.log('✅ Focused camera on isolated chain');
        } catch (error) {
          console.error('Failed to focus on isolated chain:', error);
        }
      }, 200);
      
      setIsIsolated(true);
      console.log(`✅ Chain ${chainId} truly isolated by hiding all others!`);
      
    } catch (error) {
      console.error('Failed to isolate chain:', error);
    } finally {
      setIsLoading(false);
    }
  }, [plugin]);

  // Version-safe visibility toggle helper for molstar@4.18.0
  const setNodeVisible = useCallback(async (ref: string, visible: boolean) => {
    try {
      const { PluginCommands } = await import('molstar/lib/mol-plugin/commands');
      const anyPC = PluginCommands as any;
      const hasCmd = !!anyPC?.State?.SetSubtreeVisibility && typeof anyPC.State.SetSubtreeVisibility === 'function';

      if (hasCmd) {
        await anyPC.State.SetSubtreeVisibility(plugin, { 
          state: plugin.state.data, 
          ref, 
          visible 
        });
        console.log(`✅ Used PluginCommands.State.SetSubtreeVisibility`);
      } else {
        // 🔧 v4.18 build: use state.data.build()
        const update = plugin.state.data.build().to(ref).update({ isHidden: !visible });
        await update.commit();
        console.log(`✅ Used v4.18 state.data.build fallback`);
      }
    } catch (error) {
      console.log('⚠️ PluginCommands error, using v4.18 fallback:', error);
      const update = plugin.state.data.build().to(ref).update({ isHidden: !visible });
      await update.commit();
      console.log(`✅ Used v4.18 state.data.build after error`);
    }
  }, [plugin]);

  // TRUE isolation using version-safe molstar@4.18.0 implementation
  const trueIsolateChain = useCallback(async (chainId: string) => {
    if (!plugin || !chainId) return;
    
    setIsLoading(true);
    try {
      console.log(`🌟 TRUE ISOLATION: Creating Structure node for chain ${chainId}...`);
      
      // 1) Find current structure cell & data
      const structCell = plugin.managers.structure.hierarchy.current.structures[0]?.cell;
      const data = structCell?.obj?.data;
      if (!structCell || !data) {
        console.warn('No structure found in hierarchy—load a structure & apply preset first.');
        return null;
      }
      
      console.log('✅ Found structure cell, transform:', structCell.transform.ref);
      
      // 🔍 DEBUG: Check what chains are actually available
      console.log('🔍 Checking available chains in structure...');
      if (data.units?.length) {
        const availableChains = new Set();
        for (const unit of data.units) {
          if (unit.model?.atomicHierarchy) {
            const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]] || 0;
            const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
            availableChains.add(chainId);
          }
        }
        console.log('🔍 Available chains in structure:', Array.from(availableChains));
        console.log('🔍 Target chain exists?', availableChains.has(chainId));
      }
      
      // Import required modules
      const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
      const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
      const { PluginCommands } = await import('molstar/lib/mol-plugin/commands');

      // 2) Expression for the chain (using EXACT same pattern as working hideChain)
      const expr = MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_asym_id(), 
          chainId
        ])
      });
      
      console.log('✅ Built MolScript expression for chain:', chainId);
      
      // 🧪 DEBUG: Test the expression first
      console.log('🧪 Testing MolScript expression...');
      const { Script } = await import('molstar/lib/mol-script/script');
      const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
      
      try {
        const testSelection = Script.getStructureSelection(expr, data);
        const testLoci = StructureSelection.toLociWithSourceUnits(testSelection);
        console.log('🧪 Expression test - elements found:', testLoci.elements?.length || 0);
        console.log('🧪 Expression test - loci structure:', testLoci.kind, testLoci.structure);
        
        if (testLoci.elements?.length === 0) {
          console.log('❌ Expression matches NO atoms - check chain ID or expression syntax!');
        } else {
          console.log('✅ Expression matches atoms - proceeding with structure creation');
        }
      } catch (exprError) {
        console.log('❌ Expression test failed:', exprError);
      }

      // 3) Build: selection → new Structure node → representation
      // 🔧 v4.18 build: use plugin.state.data.build()
      console.log('🔧 Building update with plugin.state.data.build()...');
      const update = plugin.state.data.build();
      console.log('🔧 Update builder created:', !!update);

      console.log('🔧 Applying StructureSelectionFromExpression...');
      const isoNode = update
        .to(structCell.transform.ref) // parent is the existing structure node
        .apply(StateTransforms.Model.StructureSelectionFromExpression, {
          label: `Chain ${chainId}`,
          expression: expr,
        });
      console.log('🔧 IsoNode created:', !!isoNode);

      console.log('🔧 Adding representation...');
      isoNode.apply(StateTransforms.Representation.StructureRepresentation3D, {
        // Pass explicit params; don't rely on .themes in this build
        type: { name: 'cartoon', params: {} },
        colorTheme: { name: 'chain-id', params: {} },
        sizeTheme: { name: 'uniform', params: { value: 1 } },
      });
      
      console.log('✅ Built structure node with representation');

      console.log('🔧 Committing update...');
      await update.commit(); // commit
      console.log('🔧 Commit completed');
      const newRef = isoNode.ref;
      
      console.log('✅ Committed new Structure node:', newRef);

      // 4) Check if we have multiple structures before hiding
      const hierCheck = plugin.managers.structure.hierarchy.current;
      console.log('🔍 Structures after commit:', hierCheck.structures.length);
      
      if (hierCheck.structures.length > 1) {
        try {
          await setNodeVisible(structCell.transform.ref, false);
          console.log('✅ Hidden original structure for clean isolation');
        } catch (error) {
          console.log('⚠️ Could not hide original structure:', error);
        }
      } else {
        console.log('⚠️ Only one structure found - skipping hide to avoid removing everything');
      }

      // 5) Focus camera (portable)
      setTimeout(async () => {
        try {
          await PluginCommands.Camera.Reset(plugin, {});
          console.log('✅ Reset camera focus');
        } catch (error) {
          console.log('⚠️ Camera reset failed (safe to ignore):', error);
        }
      }, 200);
      
      // Debug: Check hierarchy after isolation
      setTimeout(() => {
        const h = plugin.managers.structure.hierarchy.current;
        console.log('🔍 After isolation - structures:', h.structures.length);
        for (const [i, s] of h.structures.entries()) {
          console.log(`🔍 S${i} label:`, s.cell.obj?.label, 'hidden?', s.cell.state?.isHidden, 'ref:', s.cell.transform.ref);
          console.log('🔍   comps:', s.components.length);
        }
        
        // Check if this structure now represents the isolated chain
        const s = h.structures[0]; // Get the current structure
        if (s?.cell?.obj?.data?.units?.length) {
          const units = s.cell.obj.data.units;
          console.log('🔍 Structure units count:', units.length);
          if (units[0]?.model?.atomicHierarchy) {
            const chains = new Set();
            for (const unit of units) {
              const chainIndex = unit.model.atomicHierarchy.chainAtomSegments.index[unit.elements[0]] || 0;
              const chainId = unit.model.atomicHierarchy.chains.label_asym_id.value(chainIndex);
              chains.add(chainId);
            }
            console.log('🔍 Chains in isolated structure:', Array.from(chains));
          }
        }
      }, 300);

      setIsIsolated(true);
      console.log(`🌟 Chain ${chainId} TRUE ISOLATED as separate Structure node!`);
      
      return newRef; // ref of the new isolated Structure node
      
    } catch (error) {
      console.error('Failed to true isolate chain:', error);
    } finally {
      setIsLoading(false);
    }
  }, [plugin]);

  // SEQUENCE-BASED ISOLATION - The real solution for your LLM agent
  const isolateSequenceRegion = useCallback(async (chainId: string, startResidue: number, endResidue: number) => {
    if (!plugin || !chainId) return;
    
    setIsLoading(true);
    try {
      console.log(`🧬 SEQUENCE ISOLATION: Chain ${chainId}, residues ${startResidue}-${endResidue}`);
      
      const structCell = plugin.managers.structure.hierarchy.current.structures[0]?.cell;
      const data = structCell?.obj?.data;
      if (!structCell || !data) {
        console.warn('No structure found for sequence isolation');
        return null;
      }
      
      // Import required modules
      const { MolScriptBuilder: MS } = await import('molstar/lib/mol-script/language/builder');
      const { StateTransforms } = await import('molstar/lib/mol-plugin-state/transforms');
      
      // Build sequence range expression (EXACT same pattern as working hideChain)
      const expr = MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_asym_id(), 
          chainId
        ]),
        'residue-range': MS.core.rel.inRange([
          MS.struct.atomProperty.macromolecular.label_seq_id(), 
          startResidue, 
          endResidue
        ]),
      });
      
      console.log(`✅ Built sequence range expression: ${chainId}:${startResidue}-${endResidue}`);
      
      // Create isolated structure from sequence selection
      const update = plugin.state.data.build();
      const isoNode = update
        .to(structCell.transform.ref)
        .apply(StateTransforms.Model.StructureSelectionFromExpression, {
          label: `${chainId}:${startResidue}-${endResidue}`,
          expression: expr,
        });
      
      isoNode.apply(StateTransforms.Representation.StructureRepresentation3D, {
        type: { name: 'cartoon', params: {} },
        colorTheme: { name: 'chain-id', params: {} },
        sizeTheme: { name: 'uniform', params: { value: 1 } },
      });
      
      await update.commit();
      const newRef = isoNode.ref;
      
      console.log(`✅ Sequence region ${chainId}:${startResidue}-${endResidue} isolated as structure node:`, newRef);
      
      setIsIsolated(true);
      return newRef;
      
    } catch (error) {
      console.error('Failed to isolate sequence region:', error);
    } finally {
      setIsLoading(false);
    }
  }, [plugin]);

  // RESET EVERYTHING - Clear all isolation states and reload fresh
  const resetToOriginal = useCallback(async () => {
    if (!plugin) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 RESET: Clearing all states and reloading fresh structure...');
      
      // Clear all selections first
      plugin.managers.structure.selection.clear();
      
      // Reset isolation state
      setIsIsolated(false);
      
      console.log('🔄 Page reload for clean reset...');
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to reset:', error);
      // Force reload as fallback
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  }, [plugin]);

  // Show all structures and components (version-safe for molstar@4.18.0)
  const showAllChains = useCallback(async () => {
    if (!plugin) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Restoring original structure with cartoon representation...');
      
      // Clear any selections first
      plugin.managers.structure.selection.clear();
      
      // For complex state issues, reload is more reliable
      console.log('🔄 Page reload for clean restore...');
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to show all chains:', error);
      // Force reload as fallback
      window.location.reload();
    } finally {
      setIsLoading(false);
    }
  }, [plugin]);

  // Auto-discover chains when plugin is ready
  useEffect(() => {
    if (plugin) {
      const timer = setTimeout(() => discoverChains(), 1500); // Wait for structure to load
      return () => clearTimeout(timer);
    }
  }, [plugin, discoverChains]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-purple-700">🧬 Chain Isolation</h3>
        <button
          onClick={discoverChains}
          disabled={!plugin}
          className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      
      {availableChains.length === 0 ? (
        <p className="text-xs text-gray-500 italic">
          No chains found. Click "Refresh" after structure loads.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Chain Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Chain:
            </label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            >
              <option value="">-- Select Chain --</option>
              {availableChains.map(chain => (
                <option key={chain} value={chain}>
                  Chain {chain}
                </option>
              ))}
            </select>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="flex gap-1">
              <button
                onClick={() => selectedChain && hideChain(selectedChain)}
                disabled={!selectedChain || isLoading}
                className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Hiding...' : 'Hide Chain'}
              </button>
              
              <button
                onClick={() => selectedChain && isolateChain(selectedChain)}
                disabled={!selectedChain || isLoading}
                className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Isolating...' : 'Isolate Chain'}
              </button>
              
              <button
                onClick={() => selectedChain && trueIsolateChain(selectedChain)}
                disabled={!selectedChain || isLoading}
                className="flex-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'TRUE Isolating...' : 'TRUE Isolate'}
              </button>
              
              <button
                onClick={() => selectedChain && isolateSequenceRegion(selectedChain, 1, 10)}
                disabled={!selectedChain || isLoading}
                className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Isolating...' : '🧬 Seq 1-10'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={showAllChains}
                disabled={isLoading}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Restoring...' : 'Show All'}
              </button>
              
              <button
                onClick={resetToOriginal}
                disabled={isLoading}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting...' : '🔄 RESET'}
              </button>
            </div>
          </div>
          
          {/* Status */}
          {isIsolated && (
            <p className="text-xs text-purple-600">
              ✅ Chain {selectedChain} isolated
            </p>
          )}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        💡 Uses official StructureSelectionFromScript approach for clean chain isolation.
      </p>
    </div>
  );
}

// Component for dynamic component discovery and control
function DynamicComponentControls({ plugin, removeWaterCorrect, removeLigandsCorrect, removeIonsCorrect }: { 
  plugin: PluginUIContext | null;
  removeWaterCorrect: () => Promise<void>;
  removeLigandsCorrect: () => Promise<void>;
  removeIonsCorrect: () => Promise<void>;
}) {
  const [components, setComponents] = useState<Array<{
    ref: string;
    label: string;
    description: string;
    elementCount: number;
    isVisible: boolean;
    type: string;
  }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Discover all components in the structure
  const discoverComponents = useCallback(async () => {
    if (!plugin) return;
    
    setIsRefreshing(true);
    try {
      const hierarchy = plugin.managers.structure.hierarchy.current;
      const discoveredComponents: typeof components = [];
      
      for (const structure of hierarchy.structures) {
        for (const component of structure.components) {
          // Get the correct ref from the component
          let componentRef = component.cell?.transform?.ref;
          
          // Use component.key as the ref (that's where Mol* stores it)
          
          if (component.cell?.obj) {
            const node = componentRef ? plugin.state.data.select(componentRef)[0] : null;
            const isVisible = !node?.state?.isHidden;
            
            const label = component.cell.obj.label || 'Unknown';
            const description = component.cell.obj.description || '';
            const elementCount = component.cell.obj.data?.elementCount || 0;
            
            let type = 'other';
            const lowerLabel = label.toLowerCase();
            if (lowerLabel.includes('water')) type = 'water';
            else if (lowerLabel.includes('ligand')) type = 'ligand';
            else if (lowerLabel.includes('ion')) type = 'ion';
            else if (lowerLabel.includes('polymer')) type = 'polymer';
            else if (lowerLabel.includes('assembly')) type = 'assembly';
            
            discoveredComponents.push({
              ref: componentRef || `missing-ref-${discoveredComponents.length}`,
              label,
              description,
              elementCount,
              isVisible,
              type
            });
          }
        }
      }
      
      setComponents(discoveredComponents);
      
    } catch (error) {
      console.error('Failed to discover components:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [plugin]);

  // Toggle component visibility using the working approach
  const toggleComponent = useCallback(async (componentRef: string, currentlyVisible: boolean) => {
    if (!plugin) return;
    
    try {
      // Find the component by ref
      const component = components.find(c => c.ref === componentRef);
      if (!component) return;
      
      if (currentlyVisible) {
        // Hide the component using the working functions
        await hideComponentByType(component);
      } else {
        // Show the component - this requires reloading
        alert('Showing hidden components requires reloading the structure. Use "Show All" button.');
      }
      
      // Refresh the component list
      setTimeout(() => discoverComponents(), 1000);
      
    } catch (error) {
      console.error('❌ Failed to toggle component:', error);
    }
  }, [plugin, components, discoverComponents]);

  // Helper function to hide component by analyzing its type
  const hideComponentByType = async (component: any): Promise<boolean> => {
    try {
      if (component.type === 'water') {
        await removeWaterCorrect();
        return true;
      } else if (component.type === 'ligand') {
        await removeLigandsCorrect();
        return true;
      } else if (component.type === 'ion') {
        await removeIonsCorrect();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error hiding component:', error);
      return false;
    }
  };

  // Show all components by reloading
  const showAllComponents = useCallback(() => {
    window.location.reload();
  }, []);

  // Auto-discover components when plugin is ready
  useEffect(() => {
    if (plugin) {
      const timer = setTimeout(() => discoverComponents(), 1000);
      return () => clearTimeout(timer);
    }
  }, [plugin, discoverComponents]);

  // Get icon for component type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'water': return '💧';
      case 'ligand': return '🧬';
      case 'ion': return '⚛️';
      case 'polymer': return '🔗';
      case 'assembly': return '🏗️';
      default: return '📦';
    }
  };

  // Get color for component type
  const getTypeColor = (type: string, isVisible: boolean) => {
    const opacity = isVisible ? '' : ' opacity-50';
    switch (type) {
      case 'water': return `bg-blue-100 text-blue-800${opacity}`;
      case 'ligand': return `bg-green-100 text-green-800${opacity}`;
      case 'ion': return `bg-yellow-100 text-yellow-800${opacity}`;
      case 'polymer': return `bg-purple-100 text-purple-800${opacity}`;
      case 'assembly': return `bg-gray-100 text-gray-800${opacity}`;
      default: return `bg-gray-100 text-gray-600${opacity}`;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-indigo-700">🎯 Structure Components</h3>
        <div className="flex gap-2">
          <button
            onClick={discoverComponents}
            disabled={isRefreshing || !plugin}
            className="px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
          >
            {isRefreshing ? 'Scanning...' : 'Refresh'}
          </button>
          <button
            onClick={showAllComponents}
            disabled={!plugin}
            className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
          >
            Show All
          </button>
        </div>
      </div>
      
      {components.length === 0 ? (
        <p className="text-xs text-gray-500 italic">
          {isRefreshing ? 'Discovering components...' : 'No components found. Click "Refresh" to scan.'}
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {components.map((component, index) => (
            <div
              key={`${component.ref}-${index}`}
              className={`flex items-center justify-between p-2 rounded border ${getTypeColor(component.type, component.isVisible)}`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="text-lg">{getTypeIcon(component.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {component.label}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {component.elementCount} elements
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => toggleComponent(component.ref, component.isVisible)}
                className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                  component.isVisible
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-300 text-gray-600 hover:bg-gray-400'
                }`}
                title={component.isVisible ? 'Hide component' : 'Show component (requires reload)'}
              >
                {component.isVisible ? '👁️ Hide' : '🚫 Hidden'}
              </button>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">
        💡 Components are discovered from the loaded structure. Click hide/show to toggle visibility.
      </p>
    </div>
  );
}

type RepName = 'cartoon' | 'molecular-surface' | 'ball-and-stick';
type Region = { chain: string; start?: number; end?: number; useAuth?: boolean };

export default function MolstarIsolateTestPage() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [plugin, setPlugin] = useState<PluginUIContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const rootRef = useRef<any>(null);
  const molstarAPIsRef = useRef<any>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    let disposed = false;
    let pluginRef: PluginUIContext | null = null;
    
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Dynamic imports (same as our main app)
        const [
          { PluginUIContext },
          { DefaultPluginUISpec },
          { Plugin },
          { createRoot },
          React,
          { MolScriptBuilder: MS },
          { Script },
          { PluginCommands }
        ] = await Promise.all([
          import('molstar/lib/mol-plugin-ui/context'),
          import('molstar/lib/mol-plugin-ui/spec'),
          import('molstar/lib/mol-plugin-ui/plugin'),
          import('react-dom/client'),
          import('react'),
          import('molstar/lib/mol-script/language/builder'),
          import('molstar/lib/mol-script/script'),
          import('molstar/lib/mol-plugin/commands')
        ]);

        // Store APIs for use in callbacks
        molstarAPIsRef.current = { MS, Script, PluginCommands };

        if (disposed) return;

        // Create plugin spec (same pattern as main app)
        const spec = DefaultPluginUISpec();
        
        // Create plugin context
        const p = new PluginUIContext(spec);
        await p.init(); // This should work now
        
        if (disposed) return;

        // Store reference for cleanup
        pluginRef = p;

        // Mount React component
        const root = createRoot(hostRef.current!);
        root.render(React.createElement(Plugin, { plugin: p }));
        rootRef.current = root;
        
        setPlugin(p);

        // 2) Load a structure (4HHB - Hemoglobin with multiple chains)
        try {
          console.log('Loading 7MT0 (hemoglobin) structure...');
          console.log('Step 1: Downloading...');
          const download = await p.builders.data.download(
            { url: 'https://files.rcsb.org/download/7MT0.cif', isBinary: false },
            { state: { isGhost: true } }
          );
          console.log('Step 2: Parsing trajectory...');
          const trajectory = await p.builders.structure.parseTrajectory(download, 'mmcif');
          console.log('Step 3: Creating model...');
          const model = await p.builders.structure.createModel(trajectory);
          console.log('Step 4: Creating structure...');
          const structure = await p.builders.structure.createStructure(model);
          console.log('Step 5: Applying default preset...');
          // Use default preset to ensure proper component structure
          await p.builders.structure.hierarchy.applyPreset(structure, 'default');
          
          console.log('Step 6: Enforcing cartoon representation...');
          // Force cartoon representation using the SAFE approach
          try {
            const hierarchy = p.managers.structure.hierarchy.current;
            const update = p.state.data.build();
            
            console.log(`🔍 Enforcing cartoon on ${hierarchy.structures.length} structures, ${hierarchy.structures.flatMap(s => s.components).length} components`);
            
            // Update existing representations to cartoon (preserving component structure)
            for (const structure of hierarchy.structures) {
              for (const component of structure.components) {
                for (const representation of component.representations) {
                  // Update representation to cartoon in place
                  update.to(representation.cell.transform.ref).update({
                    type: { name: 'cartoon', params: {} },
                    colorTheme: { name: 'chain-id', params: {} },
                    sizeTheme: { name: 'uniform', params: { value: 1 } },
                  });
                }
              }
            }
            
            await update.commit();
            console.log('✅ Cartoon representation enforced');
            
            // Verify component structure is preserved
            const postHierarchy = p.managers.structure.hierarchy.current;
            console.log(`🔍 After cartoon: ${postHierarchy.structures.length} structures, ${postHierarchy.structures.flatMap(s => s.components).length} components`);
            
          } catch (cartoonError) {
            console.log('⚠️ Cartoon enforcement failed, keeping default representation:', cartoonError);
          }
          
          console.log('Step 7: Resetting camera...');
          PluginCommands.Camera.Reset(p, {});
          console.log('✅ 7MT0 structure loaded successfully!');
        } catch (e) {
          console.error('❌ Load error:', e);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize plugin:', error);
        setIsLoading(false);
      }
    };

    initialize();

    return () => {
      disposed = true;
      
      // Use setTimeout to defer cleanup until after current render
      setTimeout(() => {
        if (rootRef.current) {
          try {
            rootRef.current.unmount();
          } catch (e) {
            console.warn('Error unmounting React root:', e);
          }
        }
        
        if (pluginRef) {
          try {
            pluginRef.dispose();
          } catch (e) {
            console.warn('Error disposing plugin:', e);
          }
        }
      }, 0);
    };
  }, []); // Empty dependency array - only run once

  // Utility: get the structure state cell (parent for new components)
  const getStructureParent = useCallback(() => {
    const s = plugin?.managers.structure.hierarchy.current.structures[0];
    return s?.cell ?? null;
  }, [plugin]);

  // Utility: build MolScript expression for chain or chain+range
  const buildExpr = useCallback((r: Region) => {
    if (!molstarAPIsRef.current) return null;
    const { MS } = molstarAPIsRef.current;
    
    const chainProp = r.useAuth
      ? MS.struct.atomProperty.macromolecular.auth_asym_id()
      : MS.struct.atomProperty.macromolecular.label_asym_id();

    const seqProp = r.useAuth
      ? MS.struct.atomProperty.macromolecular.auth_seq_id()
      : MS.struct.atomProperty.macromolecular.label_seq_id();

    const chainTest = MS.core.rel.eq([chainProp, r.chain]);
    if (r.start != null && r.end != null) {
      const resTest = MS.core.rel.inRange([seqProp, r.start, r.end]);
      return MS.struct.generator.atomGroups({ 'chain-test': chainTest, 'residue-test': resTest });
    }
    return MS.struct.generator.atomGroups({ 'chain-test': chainTest });
  }, []);

  // Use selection-based approach instead of visibility
  const selectOnly = useCallback(async (region: Region | null) => {
    if (!plugin || !molstarAPIsRef.current) return;
    const { MS, Script } = molstarAPIsRef.current;
    
    try {
      // Clear existing selections first
      plugin.managers.structure.selection.clear();
      
      if (!region) {
        console.log('Cleared all selections');
        return;
      }
      
      // Get the structure data
      const structureData = plugin.managers.structure.hierarchy.current.structures[0]?.cell.obj?.data;
      if (!structureData) {
        console.error('No structure data available');
        return;
      }
      
      console.log('Creating selection for region:', region);
      
      // Build the selection using MolScript
      const chainProp = region.useAuth
        ? MS.struct.atomProperty.macromolecular.auth_asym_id()
        : MS.struct.atomProperty.macromolecular.label_asym_id();

      const seqProp = region.useAuth
        ? MS.struct.atomProperty.macromolecular.auth_seq_id()
        : MS.struct.atomProperty.macromolecular.label_seq_id();

      const chainTest = MS.core.rel.eq([chainProp, region.chain]);
      
      let expr;
      if (region.start != null && region.end != null) {
        const resTest = MS.core.rel.inRange([seqProp, region.start, region.end]);
        expr = MS.struct.generator.atomGroups({ 'chain-test': chainTest, 'residue-test': resTest });
      } else {
        expr = MS.struct.generator.atomGroups({ 'chain-test': chainTest });
      }
      
      // Create selection from expression
      const selection = Script.getStructureSelection(q => expr, structureData);
      console.log('Created selection:', selection);
      
      // Convert to loci
      const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
      const loci = StructureSelection.toLociWithSourceUnits(selection);
      console.log('Created loci:', loci);
      
      // Apply selection
      plugin.managers.interactivity.lociSelects.select({ loci });
      
      // Focus camera on selection
      plugin.managers.camera.focusLoci(loci);
      
      console.log('Selection and focus completed successfully!');
      
    } catch (error) {
      console.error('Selection failed:', error);
    }
  }, [plugin]);

  // Comprehensive state logging function
  const logCurrentState = useCallback(async (label: string = 'Current State') => {
    if (!plugin) return;
    
    try {
      console.log(`\n=== ${label.toUpperCase()} ===`);
      console.log('Timestamp:', new Date().toLocaleTimeString());
      
      // 1. Hierarchy Summary
      const hierarchy = plugin.managers.structure.hierarchy.current;
      console.log('\n--- HIERARCHY SUMMARY ---');
      console.log('Structures:', hierarchy.structures.length);
      
      for (let i = 0; i < hierarchy.structures.length; i++) {
        const structure = hierarchy.structures[i];
        console.log(`\nStructure ${i}:`);
        console.log(`  Components: ${structure.components.length}`);
        
        for (let j = 0; j < structure.components.length; j++) {
          const component = structure.components[j];
          console.log(`  Component ${j}: ${component.cell?.obj?.label} (${component.cell?.obj?.description})`);
          console.log(`    Key: ${component.key}`);
          console.log(`    Ref: ${component.cell?.ref}`);
          console.log(`    Visible: ${!component.cell?.state?.isHidden}`);
          
          // Check representations
          if (component.representations) {
            console.log(`    Representations: ${component.representations.length}`);
            for (let k = 0; k < component.representations.length; k++) {
              const rep = component.representations[k];
              console.log(`      Rep ${k}: ${rep.cell?.obj?.label} (Ref: ${rep.cell?.ref}, Hidden: ${rep.cell?.state?.isHidden})`);
            }
          }
        }
      }
      
      // 2. Complete State Tree with Visibility Status
      console.log('\n--- COMPLETE STATE TREE ---');
      const stateNodes: Array<{ref: string, label: string, transform: string, hidden: boolean, hasChildren: boolean}> = [];
      
      const traverse = (nodeRef: string, depth = 0) => {
        const node = plugin.state.data.select(nodeRef)[0];
        if (!node) return;
        
        const indent = '  '.repeat(depth);
        const isHidden = node.state?.isHidden || false;
        const children = plugin.state.data.tree.children.get(nodeRef);
        const hasChildren = children && children.size > 0;
        
        console.log(`${indent}${nodeRef}: ${node.obj?.label || 'No Label'} [${node.transform.transformer.id}] ${isHidden ? '(HIDDEN)' : '(VISIBLE)'}`);
        
        stateNodes.push({
          ref: nodeRef,
          label: node.obj?.label || 'No Label',
          transform: node.transform.transformer.id,
          hidden: isHidden,
          hasChildren
        });
        
        if (children) {
          for (const childRef of children.keys()) {
            traverse(childRef, depth + 1);
          }
        }
      };
      
      traverse(plugin.state.data.tree.root.ref);
      
      // 3. Summary Statistics
      console.log('\n--- SUMMARY STATISTICS ---');
      const visibleNodes = stateNodes.filter(n => !n.hidden);
      const hiddenNodes = stateNodes.filter(n => n.hidden);
      const componentNodes = stateNodes.filter(n => n.transform.includes('component'));
      const representationNodes = stateNodes.filter(n => n.transform.includes('representation'));
      
      console.log(`Total nodes: ${stateNodes.length}`);
      console.log(`Visible nodes: ${visibleNodes.length}`);
      console.log(`Hidden nodes: ${hiddenNodes.length}`);
      console.log(`Component nodes: ${componentNodes.length}`);
      console.log(`Representation nodes: ${representationNodes.length}`);
      
      if (hiddenNodes.length > 0) {
        console.log('\nHidden nodes:');
        hiddenNodes.forEach(node => {
          console.log(`  - ${node.ref}: ${node.label} [${node.transform}]`);
        });
      }
      
      // 4. Key References for Manual Comparison
      console.log('\n--- KEY REFERENCES ---');
      console.log('Water component ref: 46lfFW-H0o6spygnttTseg');
      console.log('Water representation ref: 2SDOM_71ktaP9q3nBatQxg');
      console.log('Ligand component ref: zZ_kFU4G-zaD366eIqESIQ');
      console.log('Ligand representation ref: CaDXjFoUMFl7BhyDLkWMDQ');
      
      // Check specific nodes
      const waterComp = plugin.state.data.select('46lfFW-H0o6spygnttTseg')[0];
      const waterRep = plugin.state.data.select('2SDOM_71ktaP9q3nBatQxg')[0];
      const ligandComp = plugin.state.data.select('zZ_kFU4G-zaD366eIqESIQ')[0];
      const ligandRep = plugin.state.data.select('CaDXjFoUMFl7BhyDLkWMDQ')[0];
      
      console.log(`Water component exists: ${!!waterComp}, hidden: ${waterComp?.state?.isHidden}`);
      console.log(`Water representation exists: ${!!waterRep}, hidden: ${waterRep?.state?.isHidden}`);
      console.log(`Ligand component exists: ${!!ligandComp}, hidden: ${ligandComp?.state?.isHidden}`);
      console.log(`Ligand representation exists: ${!!ligandRep}, hidden: ${ligandRep?.state?.isHidden}`);
      
      console.log(`\n=== END ${label.toUpperCase()} ===\n`);
      
    } catch (error) {
      console.error('Error logging state:', error);
    }
  }, [plugin]);

  // Legacy function for backward compatibility
  const listAllComponents = useCallback(() => logCurrentState('All Components'), [logCurrentState]);

  // Simple component removal approach
  const removeComponents = useCallback(async (componentTypes: string[]) => {
    if (!plugin) return;
    
    try {
      console.log('Removing component types:', componentTypes);
      
      // First, list all components to see what we're working with
      await listAllComponents();
      
      // Try to find and remove components by traversing state tree
      const componentsToRemove: string[] = [];
      
      const traverse = (nodeRef: string) => {
        const node = plugin.state.data.select(nodeRef)[0];
        if (!node) return;
        
        // Check if this node should be removed
        const label = node.obj?.label?.toLowerCase() || '';
        const description = node.obj?.description?.toLowerCase() || '';
        const transformId = node.transform.transformer.id.toLowerCase();
        
        const shouldRemove = componentTypes.some(type => 
          label.includes(type.toLowerCase()) ||
          description.includes(type.toLowerCase()) ||
          transformId.includes(type.toLowerCase())
        );
        
        if (shouldRemove) {
          console.log(`Found component to remove: ${nodeRef}`, {
            label: node.obj?.label,
            description: node.obj?.description,
            transform: node.transform.transformer.id
          });
          componentsToRemove.push(nodeRef);
        }
        
        // Traverse children
        const children = plugin.state.data.tree.children.get(nodeRef);
        if (children) {
          for (const childRef of children.keys()) {
            traverse(childRef);
          }
        }
      };
      
      traverse(plugin.state.data.tree.root.ref);
      
      console.log('Components to remove:', componentsToRemove);
      
      // Try to remove each component
      for (const ref of componentsToRemove) {
        try {
          console.log(`Attempting to remove: ${ref}`);
          await plugin.state.updateTree(plugin.state.build().delete(ref));
          console.log(`Successfully removed: ${ref}`);
        } catch (removeError) {
          console.error(`Failed to remove ${ref}:`, removeError);
          
          // Try hiding instead
          try {
            await plugin.state.updateTree(
              plugin.state.build().to(ref).update({ isHidden: true })
            );
            console.log(`Successfully hidden: ${ref}`);
          } catch (hideError) {
            console.error(`Failed to hide ${ref}:`, hideError);
          }
        }
      }
      
    } catch (error) {
      console.error('Error removing components:', error);
    }
  }, [plugin, listAllComponents]);

  // Simplified approach: just select the region (no component creation)
  const isolate = useCallback(async (region: Region, rep: RepName = 'cartoon') => {
    console.log('Isolating region using selection approach:', region);
    await selectOnly(region);
  }, [selectOnly]);

  // Direct component removal using known refs
  const removeWaterDirect = useCallback(async () => {
    if (!plugin) return;
    
    try {
      // Based on the logs, water component should be at this ref pattern
      const waterRef = '46lfFW-H0o6spygnttTseg'; // From the logs
      
      console.log('Attempting to remove water component directly:', waterRef);
      console.log('Plugin state methods:', Object.keys(plugin.state));
      console.log('Plugin state data methods:', Object.keys(plugin.state.data));
      console.log('Plugin managers:', Object.keys(plugin.managers));
      console.log('Plugin managers structure:', Object.keys(plugin.managers.structure));
      console.log('Plugin managers structure hierarchy:', Object.keys(plugin.managers.structure.hierarchy));
      
      // Try different approaches to remove the component
      
      // Approach 1: Try direct deletion
      try {
        if (plugin.state.build && typeof plugin.state.build === 'function') {
          await plugin.state.updateTree(plugin.state.build().delete(waterRef));
          console.log('Water component removed successfully with build()!');
          return;
        }
      } catch (buildError) {
        console.error('Build approach failed:', buildError);
      }
      
      // Approach 2: Try state update to hide
      try {
        await plugin.state.updateCellState(waterRef, { isHidden: true });
        console.log('Water component hidden with updateCellState!');
        return;
      } catch (cellError) {
        console.error('updateCellState failed:', cellError);
      }
      
      // Approach 3: Try direct node manipulation
      try {
        const node = plugin.state.data.select(waterRef)[0];
        if (node) {
          console.log('Found water node:', node);
          node.state.isHidden = true;
          await plugin.state.updateTree(); // Trigger update
          console.log('Water component hidden with direct manipulation!');
          return;
        }
      } catch (directError) {
        console.error('Direct manipulation failed:', directError);
      }
      
      // Approach 4: Try using representation system
      try {
        console.log('Trying representation-based approach...');
        
        // Find water representations and hide them
        const waterRepRef = '2SDOM_71ktaP9q3nBatQxg'; // From logs: Water -> Ball & Stick
        console.log('Trying to hide water representation:', waterRepRef);
        
        const repNode = plugin.state.data.select(waterRepRef)[0];
        if (repNode) {
          console.log('Found water representation node:', repNode);
          repNode.state.isHidden = true;
          console.log('Set water representation isHidden to true');
          
          // Try to trigger an update
          if (plugin.state.updateTree) {
            await plugin.state.updateTree();
            console.log('Triggered state tree update');
          }
          
          console.log('Water representation hidden via direct manipulation!');
          return;
        }
      } catch (repError) {
        console.error('Representation approach failed:', repError);
      }
      
      // Approach 5: Try using managers to hide representations
      try {
        console.log('Trying manager-based representation hiding...');
        
        const hierarchy = plugin.managers.structure.hierarchy.current;
        for (const structure of hierarchy.structures) {
          for (const component of structure.components) {
            if (component.cell?.obj?.label === 'Water') {
              console.log('Found water component in hierarchy:', component);
              
              // Try to hide representations of this component
              if (component.representations) {
                console.log('Component has representations:', component.representations);
                for (const rep of component.representations) {
                  console.log('Trying to hide representation:', rep);
                  if (rep.cell?.ref) {
                    const repNode = plugin.state.data.select(rep.cell.ref)[0];
                    if (repNode) {
                      repNode.state.isHidden = true;
                      console.log('Hidden representation:', rep.cell.ref);
                    }
                  }
                }
              }
            }
          }
        }
        
        // Trigger update
        if (plugin.state.updateTree) {
          await plugin.state.updateTree();
        }
        
        console.log('Manager-based representation hiding completed!');
        return;
        
      } catch (managerError) {
        console.error('Manager approach failed:', managerError);
      }
      
    } catch (error) {
      console.error('All approaches failed to remove water component:', error);
    }
  }, [plugin]);

  const removeLigandDirect = useCallback(async () => {
    if (!plugin) return;
    
    try {
      const ligandRef = 'zZ_kFU4G-zaD366eIqESIQ'; // From the logs
      
      console.log('Attempting to remove ligand component directly:', ligandRef);
      
      // Try the same approaches as water removal
      try {
        await plugin.state.updateCellState(ligandRef, { isHidden: true });
        console.log('Ligand component hidden with updateCellState!');
        return;
      } catch (cellError) {
        console.error('updateCellState failed for ligand:', cellError);
      }
      
      // Try direct node manipulation
      try {
        const node = plugin.state.data.select(ligandRef)[0];
        if (node) {
          console.log('Found ligand node:', node);
          node.state.isHidden = true;
          await plugin.state.updateTree(); // Trigger update
          console.log('Ligand component hidden with direct manipulation!');
          return;
        }
      } catch (directError) {
        console.error('Direct manipulation failed for ligand:', directError);
      }
      
    } catch (error) {
      console.error('All approaches failed to remove ligand component:', error);
    }
  }, [plugin]);

  // Component removal buttons (original approach)
  const removeWater = useCallback(() => removeComponents(['water', 'HOH', 'h2o']), [removeComponents]);
  const removeLigands = useCallback(() => removeComponents(['ligand', 'HEM', 'heme']), [removeComponents]);
  const removeWaterAndLigands = useCallback(() => removeComponents(['water', 'HOH', 'h2o', 'ligand', 'HEM', 'heme']), [removeComponents]);

  // ✅ CORRECT APPROACH - Using Selection + Subtraction (From GitHub Issues)
  const removeWaterCorrect = useCallback(async () => {
    if (!plugin || !molstarAPIsRef.current?.MS) return;
    
    try {
      console.log('🎯 Hiding water using selection + subtraction method...');
      
      const { MS, Script } = molstarAPIsRef.current;
      const hierarchy = plugin.managers.structure.hierarchy.current;
      
      if (!hierarchy.structures.length) {
        console.log('❌ No structures found');
        return;
      }
      
      const structure = hierarchy.structures[0];
      if (!structure.cell?.obj?.data) {
        console.log('❌ No structure data found');
        return;
      }
      
      // Build a selection for water molecules (HOH residues)
      const waterExpression = MS.struct.generator.atomGroups({
        'residue-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_comp_id(), 'HOH'
        ])
      });
      
      // Create selection from expression
      const waterSelection = Script.getStructureSelection(q => waterExpression, structure.cell.obj.data);
      
      // Convert selection to loci
      const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
      const waterLoci = StructureSelection.toLociWithSourceUnits(waterSelection);
      
      if (waterLoci.isEmpty) {
        console.log('❌ No water molecules found in structure');
        return;
      }
      
      console.log('✅ Found water molecules, adding to selection...');
      
      // Add water loci to current selection
      plugin.managers.structure.selection.fromLoci('set', waterLoci);
      
      // Get components with selection and subtract the selected parts
      const sel = plugin.managers.structure.hierarchy.getStructuresWithSelection();
      const componentsToModify: any[] = [];
      
      for (const s of sel) {
        componentsToModify.push(...s.components);
      }
      
      if (componentsToModify.length > 0) {
        console.log(`✅ Subtracting water from ${componentsToModify.length} components...`);
        plugin.managers.structure.component.modifyByCurrentSelection(componentsToModify, 'subtract');
        console.log('✅ Water molecules hidden successfully!');
      } else {
        console.log('❌ No components found to modify');
      }
      
      // Clear selection
      plugin.managers.structure.selection.clear();
      
    } catch (error) {
      console.error('Failed to hide water:', error);
    }
  }, [plugin]);

  const removeLigandsCorrect = useCallback(async () => {
    if (!plugin || !molstarAPIsRef.current?.MS) return;
    
    try {
      console.log('🎯 Hiding ligands using selection + subtraction method...');
      
      const { MS, Script } = molstarAPIsRef.current;
      const hierarchy = plugin.managers.structure.hierarchy.current;
      
      if (!hierarchy.structures.length) {
        console.log('❌ No structures found');
        return;
      }
      
      const structure = hierarchy.structures[0];
      if (!structure.cell?.obj?.data) {
        console.log('❌ No structure data found');
        return;
      }
      
      // Build a selection for ligand molecules (HEM for hemoglobin)
      const ligandExpression = MS.struct.generator.atomGroups({
        'residue-test': MS.core.rel.eq([
          MS.struct.atomProperty.macromolecular.label_comp_id(), 'HEM'
        ])
      });
      
      // Create selection from expression
      const ligandSelection = Script.getStructureSelection(q => ligandExpression, structure.cell.obj.data);
      
      // Convert selection to loci
      const { StructureSelection } = await import('molstar/lib/mol-model/structure/query');
      const ligandLoci = StructureSelection.toLociWithSourceUnits(ligandSelection);
      
      if (ligandLoci.isEmpty) {
        console.log('No ligand molecules (HEM) found in structure');
        return;
      }
      
      console.log('✅ Found ligand molecules, adding to selection...');
      
      // Add ligand loci to current selection
      plugin.managers.structure.selection.fromLoci('set', ligandLoci);
      
      // Get components with selection and subtract the selected parts
      const sel = plugin.managers.structure.hierarchy.getStructuresWithSelection();
      const componentsToModify: any[] = [];
      
      for (const s of sel) {
        componentsToModify.push(...s.components);
      }
      
      if (componentsToModify.length > 0) {
        console.log(`✅ Subtracting ligands from ${componentsToModify.length} components...`);
        plugin.managers.structure.component.modifyByCurrentSelection(componentsToModify, 'subtract');
        console.log('✅ Ligand molecules hidden successfully!');
      } else {
        console.log('❌ No components found to modify');
      }
      
      // Clear selection
      plugin.managers.structure.selection.clear();
      
    } catch (error) {
      console.error('Failed to hide ligands:', error);
    }
  }, [plugin]);

  const removeIonsCorrect = useCallback(async () => {
    if (!plugin || !molstarAPIsRef.current?.PluginCommands) return;
    
    try {
      console.log('🎯 Hiding ions using PluginCommands.State.SetSubtreeVisibility...');
      
      const { PluginCommands } = molstarAPIsRef.current;
      const hierarchy = plugin.managers.structure.hierarchy.current;
      let ionFound = false;
      
      for (const structure of hierarchy.structures) {
        for (const component of structure.components) {
          const label = (component.cell?.obj?.label ?? '').toLowerCase();
          if (label.includes('ion')) {
            const componentRef = component.cell.ref;
            console.log('Found ion component ref:', componentRef);
            
            await PluginCommands.State.SetSubtreeVisibility(plugin, {
              state: plugin.state.data,
              ref: componentRef,
              visible: false
            });
            
            console.log('✅ Ion component hidden via SetSubtreeVisibility');
            ionFound = true;
          }
        }
      }
      
      if (!ionFound) {
        console.log('❌ Ion component not found');
      }
      
    } catch (error) {
      console.error('Failed to hide ions:', error);
    }
  }, [plugin]);

  const showAllComponents = useCallback(async () => {
    if (!plugin || !molstarAPIsRef.current?.PluginCommands) return;
    
    try {
      console.log('🎯 Showing all components using PluginCommands.State.SetSubtreeVisibility...');
      
      const { PluginCommands } = molstarAPIsRef.current;
      const hierarchy = plugin.managers.structure.hierarchy.current;
      let componentsShown = 0;
      
      for (const structure of hierarchy.structures) {
        for (const component of structure.components) {
          const componentRef = component.cell.ref;
          
          // Show all components (set visible: true)
          await PluginCommands.State.SetSubtreeVisibility(plugin, {
            state: plugin.state.data,
            ref: componentRef,
            visible: true
          });
          
          console.log(`Showing component: ${component.cell?.obj?.label}`);
          componentsShown++;
        }
      }
      
      console.log(`✅ ${componentsShown} components shown via SetSubtreeVisibility`);
      
    } catch (error) {
      console.error('Failed to show components:', error);
    }
  }, [plugin]);
  
  // Selection buttons
  const isolateChainA = useCallback(() => isolate({ chain: 'A', useAuth: true }, 'cartoon'), [isolate]);
  const isolateChainA_Surface = useCallback(() => isolate({ chain: 'A', useAuth: true }, 'molecular-surface'), [isolate]);
  const isolateA_10_50 = useCallback(() => isolate({ chain: 'A', start: 10, end: 50, useAuth: true }, 'cartoon'), [isolate]);
  const showAll = useCallback(async () => { 
    console.log('Clearing all selections');
    await selectOnly(null); 
  }, [selectOnly]);

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Mol* Chain Isolation & Component Removal</h1>
        
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">AAV9 (7MT0) - Chain Isolation Testing</h2>
          {isLoading ? (
            <p className="text-gray-500">Loading Mol* plugin and AAV9 structure...</p>
          ) : (
            <div className="space-y-3">
              
              {/* 🎯 DYNAMIC COMPONENT DISCOVERY */}
              <DynamicComponentControls 
                plugin={plugin} 
                removeWaterCorrect={removeWaterCorrect}
                removeLigandsCorrect={removeLigandsCorrect}
                removeIonsCorrect={removeIonsCorrect}
              />

              {/* REPRESENTATION CONTROLS */}
              <RepresentationControls plugin={plugin} />

              {/* API-BASED REPRESENTATION CONTROLS */}
              <RepresentationAPIControls plugin={plugin} />

              {/* CHAIN ISOLATION */}
              <ChainIsolationControls plugin={plugin} />

            </div>
          )}
        </div>

        {/* Mol* container */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div
            ref={hostRef}
            style={{ 
              width: '100%', 
              height: '70vh', 
              position: 'relative',
              minHeight: '500px'
            }}
          />
        </div>
        
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h3 className="text-md font-semibold mb-2">Expected Results:</h3>
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-medium text-green-700">Component Removal (High Success Probability):</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li><strong>Remove Water:</strong> Should remove all water molecules (HOH) from the structure</li>
                <li><strong>Remove Heme Groups:</strong> Should remove the heme cofactors from hemoglobin</li>
                <li><strong>Remove Water + Heme:</strong> Should remove both water and heme components</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-700">Selection Tests (Experimental):</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li><strong>Select Chain A:</strong> Should highlight/select only chain A</li>
                <li><strong>Select A:10-50:</strong> Should highlight only residues 10-50 of chain A</li>
                <li><strong>Clear Selection:</strong> Should remove all selections</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            4HHB contains water molecules and heme groups that should be easily removable. The component removal approach uses direct state tree manipulation.
          </p>
        </div>
      </div>
    </div>
  );
}