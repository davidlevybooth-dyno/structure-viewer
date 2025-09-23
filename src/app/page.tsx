'use client';

import { useState } from 'react';
import MolstarViewer from '@/components/MolstarViewer';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

export default function Home() {
  const [pdbId, setPdbId] = useState('1CRN');
  const [inputValue, setInputValue] = useState('1CRN');
  const [isViewerReady, setIsViewerReady] = useState(false);

  const handleViewerReady = (pluginInstance: PluginUIContext) => {
    setIsViewerReady(true);
  };

  const handleError = (error: string) => {
    // Error handling could be enhanced with user notifications
  };

  const handleLoadStructure = () => {
    if (inputValue.trim()) {
      setPdbId(inputValue.trim().toUpperCase());
    }
  };

  const exampleStructures = [
    { id: '1CRN', name: 'Crambin (small)' },
    { id: '4HHB', name: 'Hemoglobin' },
    { id: '6M0J', name: 'COVID Spike' },
    { id: '7MT0', name: 'AAV9 Capsid' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Dyno Structure Viewer
            </h1>
            <div className="text-sm text-gray-500">
              Powered by Mol* | Status: {isViewerReady ? '✅ Ready' : '⏳ Loading...'}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Load Structure</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDB ID
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                      placeholder="e.g., 1CRN"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleLoadStructure()}
                    />
                    <button
                      onClick={handleLoadStructure}
                      disabled={!isViewerReady}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Load
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Examples
                  </label>
                  <div className="space-y-2">
                    {exampleStructures.map((structure) => (
                      <button
                        key={structure.id}
                        onClick={() => {
                          setInputValue(structure.id);
                          setPdbId(structure.id);
                        }}
                        disabled={!isViewerReady}
                        className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border disabled:opacity-50"
                      >
                        <div className="font-mono text-blue-600">{structure.id}</div>
                        <div className="text-xs text-gray-600">{structure.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {isViewerReady && (
                  <div className="mt-6 p-3 bg-blue-50 rounded">
                    <div className="text-sm font-medium text-blue-900">
                      Current: {pdbId}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Sequence panel hidden ✓
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Molstar Viewer */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <MolstarViewer
                pdbId={pdbId}
                className="h-[600px]"
                onReady={handleViewerReady}
                onError={handleError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}