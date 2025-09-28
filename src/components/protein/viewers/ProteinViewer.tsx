/**
 * Protein structure viewer component - Now uses StructureWorkspace
 */

'use client';

import React from 'react';
import { StructureWorkspace } from '../workspace/StructureWorkspace';

/**
 * Protein viewer component that provides integrated 3D structure and sequence analysis
 */
export function ProteinViewer() {
  return (
    <StructureWorkspace 
      initialPdbId="1crn"
      className="h-full"
    />
  );
}
