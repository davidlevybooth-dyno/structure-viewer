'use client';

import { useCallback, useState } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import {
  removeWaterMolecules,
  removeLigandMolecules,
  removeIonMolecules,
  removeCommonUnwantedComponents,
  type ComponentRemovalOptions
} from '@/lib/molstar/component-removal';

interface ComponentRemovalControlsProps {
  plugin: PluginUIContext | null;
  className?: string;
}

export function ComponentRemovalControls({ plugin, className = '' }: ComponentRemovalControlsProps) {
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  
  const handleRemoval = useCallback(async (
    type: string,
    removalFn: () => Promise<boolean>
  ) => {
    if (!plugin || isRemoving) return;
    
    setIsRemoving(type);
    try {
      const success = await removalFn();
      if (!success) {
        console.warn(`No ${type} components found to remove`);
      }
    } catch (error) {
      console.error(`Failed to remove ${type}:`, error);
    } finally {
      setIsRemoving(null);
    }
  }, [plugin, isRemoving]);
  
  const removeWater = useCallback(() => {
    handleRemoval('water', () => 
      removeWaterMolecules(plugin!, { verbose: true })
    );
  }, [plugin, handleRemoval]);
  
  const removeLigands = useCallback(() => {
    handleRemoval('ligands', () => 
      removeLigandMolecules(plugin!, ['HEM', 'ATP', 'ADP', 'NAD', 'FAD'], { verbose: true })
    );
  }, [plugin, handleRemoval]);
  
  const removeIons = useCallback(() => {
    handleRemoval('ions', () => 
      removeIonMolecules(plugin!, ['NA', 'CL', 'K', 'MG', 'CA', 'ZN', 'FE'], { verbose: true })
    );
  }, [plugin, handleRemoval]);
  
  const removeAll = useCallback(() => {
    handleRemoval('all unwanted components', async () => {
      const results = await removeCommonUnwantedComponents(plugin!, { 
        verbose: true,
        removeWater: true,
        removeLigands: true,
        removeIons: true
      });
      return results.water || results.ligands || results.ions;
    });
  }, [plugin, handleRemoval]);
  
  if (!plugin) {
    return null;
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700">Clean Structure</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={removeWater}
          disabled={!!isRemoving}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRemoving === 'water' ? 'Removing...' : 'Remove Water'}
        </button>
        
        <button
          onClick={removeLigands}
          disabled={!!isRemoving}
          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRemoving === 'ligands' ? 'Removing...' : 'Remove Ligands'}
        </button>
        
        <button
          onClick={removeIons}
          disabled={!!isRemoving}
          className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRemoving === 'ions' ? 'Removing...' : 'Remove Ions'}
        </button>
        
        <button
          onClick={removeAll}
          disabled={!!isRemoving}
          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRemoving === 'all unwanted components' ? 'Cleaning...' : 'Clean All'}
        </button>
      </div>
      
      {isRemoving && (
        <p className="text-xs text-gray-500">
          Removing {isRemoving}... Check console for details.
        </p>
      )}
    </div>
  );
}
