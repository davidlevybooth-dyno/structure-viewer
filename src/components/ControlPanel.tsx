'use client';

import { useState } from 'react';
import type { LoadStructureOptions, RepresentationType, ColorScheme } from '@/types/molstar';

interface ControlPanelProps {
  onLoadStructure: (options: LoadStructureOptions) => Promise<void>;
  onApplyRepresentation: (type: RepresentationType, colorScheme?: ColorScheme) => Promise<void>;
  onClearStructures: () => Promise<void>;
  onResetCamera: () => void;
  isLoading: boolean;
  isReady: boolean;
  currentStructures: string[];
}

const EXAMPLE_STRUCTURES = [
  { id: '1CRN', name: 'Crambin (small protein)' },
  { id: '4HHB', name: 'Hemoglobin (classic)' },
  { id: '6M0J', name: 'COVID-19 Spike Protein' },
  { id: '7MT0', name: 'AAV9 Capsid' },
  { id: '3PQR', name: 'With ligands' },
  { id: '1BNA', name: 'DNA double helix' },
] as const;

const REPRESENTATIONS: { value: RepresentationType; label: string }[] = [
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'ball-and-stick', label: 'Ball & Stick' },
  { value: 'spacefill', label: 'Space Fill' },
  { value: 'surface', label: 'Surface' },
  { value: 'line', label: 'Line' },
];

const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: 'chain-id', label: 'By Chain' },
  { value: 'sequence-id', label: 'By Sequence' },
  { value: 'element-symbol', label: 'By Element' },
  { value: 'residue-name', label: 'By Residue' },
  { value: 'uniform', label: 'Uniform' },
];

export function ControlPanel({
  onLoadStructure,
  onApplyRepresentation,
  onClearStructures,
  onResetCamera,
  isLoading,
  isReady,
  currentStructures,
}: ControlPanelProps) {
  const [pdbInput, setPdbInput] = useState('1CRN');
  const [selectedRepr, setSelectedRepr] = useState<RepresentationType>('cartoon');
  const [selectedColor, setSelectedColor] = useState<ColorScheme>('chain-id');

  const handleLoadStructure = async () => {
    if (!pdbInput.trim() || !isReady) return;
    
    try {
      await onLoadStructure({
        id: pdbInput.trim().toUpperCase(),
        autoFocus: true,
        representation: selectedRepr,
        colorScheme: selectedColor,
      });
    } catch (error) {
      console.error('Failed to load structure:', error);
    }
  };

  const handleLoadExample = async (id: string) => {
    setPdbInput(id);
    try {
      await onLoadStructure({
        id,
        autoFocus: true,
        representation: selectedRepr,
        colorScheme: selectedColor,
      });
    } catch (error) {
      console.error('Failed to load example:', error);
    }
  };

  const handleApplyRepresentation = async () => {
    if (!isReady || currentStructures.length === 0) return;
    
    try {
      await onApplyRepresentation(selectedRepr, selectedColor);
    } catch (error) {
      console.error('Failed to apply representation:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Structure Controls</h2>
        <div className="text-sm">
          {isReady ? (
            <span className="text-green-600">✓ Ready</span>
          ) : (
            <span className="text-gray-500">⏳ Loading...</span>
          )}
        </div>
      </div>

      {/* Load Structure Section */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Load Structure</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDB ID
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={pdbInput}
              onChange={(e) => setPdbInput(e.target.value.toUpperCase())}
              placeholder="e.g., 1CRN"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleLoadStructure()}
              disabled={!isReady || isLoading}
            />
            <button
              onClick={handleLoadStructure}
              disabled={!isReady || isLoading || !pdbInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load
            </button>
          </div>
        </div>

        {/* Examples */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Examples
          </label>
          <div className="grid grid-cols-1 gap-2">
            {EXAMPLE_STRUCTURES.map((structure) => (
              <button
                key={structure.id}
                onClick={() => handleLoadExample(structure.id)}
                disabled={!isReady || isLoading}
                className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-mono text-blue-600">{structure.id}</div>
                <div className="text-xs text-gray-600">{structure.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Representation Section */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Representation</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Style
          </label>
          <select
            value={selectedRepr}
            onChange={(e) => setSelectedRepr(e.target.value as RepresentationType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {REPRESENTATIONS.map((repr) => (
              <option key={repr.value} value={repr.value}>
                {repr.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <select
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value as ColorScheme)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COLOR_SCHEMES.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleApplyRepresentation}
          disabled={!isReady || isLoading || currentStructures.length === 0}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply Style
        </button>
      </div>

      {/* Actions Section */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Actions</h3>
        
        <div className="space-y-2">
          <button
            onClick={onResetCamera}
            disabled={!isReady || currentStructures.length === 0}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset Camera
          </button>
          
          <button
            onClick={onClearStructures}
            disabled={!isReady || isLoading || currentStructures.length === 0}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Current Structures */}
      {currentStructures.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900">Loaded Structures</h3>
          <div className="text-sm text-gray-600">
            {currentStructures.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
