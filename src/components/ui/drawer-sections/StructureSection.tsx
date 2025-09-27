import React from 'react';
import { StructureLoader } from '@/components/ui/StructureLoader';

interface StructureSectionProps {
  pdbId: string;
  onLoadStructure: (pdbId: string) => void;
  isViewerReady: boolean;
}

export function StructureSection({
  pdbId,
  onLoadStructure,
  isViewerReady,
}: StructureSectionProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Load and manage molecular structures from the Protein Data Bank.
      </div>
      
      <StructureLoader
        initialValue={pdbId}
        onLoadStructure={onLoadStructure}
        isViewerReady={isViewerReady}
        currentPdbId={pdbId}
      />
      
      {/* Quick Structure Presets */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Load</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: '1CRN', name: 'Crambin', desc: 'Small protein' },
            { id: '4HHB', name: 'Hemoglobin', desc: 'Multi-chain' },
            { id: '7MT0', name: 'AAV9', desc: 'Viral capsid' },
            { id: '1BNA', name: 'DNA', desc: 'Double helix' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => onLoadStructure(preset.id)}
              className="p-2 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-sm text-gray-900">{preset.id}</div>
              <div className="text-xs text-gray-500">{preset.name}</div>
              <div className="text-xs text-gray-400">{preset.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StructureSection;
