/**
 * Protein structure viewer component
 */

'use client';

import React from 'react';

/**
 * Placeholder protein viewer component
 * TODO: Integrate with actual protein visualization library
 */
export function ProteinViewer() {
  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <div className="mb-4 text-6xl text-zinc-300">🧬</div>
        <h3 className="text-lg font-medium text-zinc-600 mb-2">
          Protein Structure Viewer
        </h3>
        <p className="text-sm text-zinc-500">
          Protein visualization will appear here
        </p>
      </div>
    </div>
  );
}
