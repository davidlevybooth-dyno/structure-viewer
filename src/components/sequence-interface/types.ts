/**
 * TypeScript types for the Sequence Interface component library
 */

import type { ColorScheme } from '@/lib/amino-acid-colors';

// Core sequence data structures
export interface SequenceResidue {
  position: number;
  code: string;
  chainId: string;
  secondaryStructure?: 'helix' | 'sheet' | 'loop';
}

export interface SequenceChain {
  id: string;
  name?: string;
  residues: SequenceResidue[];
}

export interface SequenceData {
  id: string;
  name: string;
  chains: SequenceChain[];
  metadata?: Record<string, any>;
}

// Selection system
export interface SelectionRegion {
  id: string;
  chainId: string;
  start: number;
  end: number;
  sequence: string;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface SequenceSelection {
  regions: SelectionRegion[];
  activeRegion: string | null;
  clipboard: string | null;
}

// Configuration is now handled by constants in individual components

// Callbacks and events
export interface SequenceInterfaceCallbacks {
  onSelectionChange?: (selection: SequenceSelection) => void;
  onHighlightChange?: (residues: SequenceResidue[]) => void;
  onSequencePaste?: (sequence: string, position?: { chainId: string; position: number }) => void;
  onSequenceCopy?: (sequence: string, region: SelectionRegion) => void;
  onRegionAction?: (action: string, region: SelectionRegion) => void;
}

// Component props
export interface SequenceInterfaceProps {
  /** Sequence data to display */
  data: SequenceData;
  /** Event callbacks */
  callbacks?: SequenceInterfaceCallbacks;
  /** CSS class name */
  className?: string;
  /** Whether the component is read-only */
  readOnly?: boolean;
}

// Context state
export interface SequenceInterfaceState {
  data: SequenceData;
  selection: SequenceSelection;
  highlightedResidues: SequenceResidue[];
  isLoading: boolean;
  error: string | null;
}

// Actions for useReducer
export type SequenceInterfaceAction =
  | { type: 'SET_DATA'; payload: SequenceData }
  | { type: 'SET_SELECTION'; payload: SequenceSelection }
  | { type: 'ADD_SELECTION_REGION'; payload: SelectionRegion }
  | { type: 'REMOVE_SELECTION_REGION'; payload: string }
  | { type: 'SET_ACTIVE_REGION'; payload: string | null }
  | { type: 'SET_HIGHLIGHTED_RESIDUES'; payload: SequenceResidue[] }
  | { type: 'SET_CLIPBOARD'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// Utility types
export type ResiduePosition = {
  chainId: string;
  position: number;
};

export type SelectionRange = {
  chainId: string;
  start: number;
  end: number;
};

// API-ready export formats
export interface SequenceSelectionExport {
  sequenceId: string;
  regions: {
    id: string;
    chainId: string;
    start: number;
    end: number;
    sequence: string;
    label?: string;
  }[];
  timestamp: string;
  metadata?: Record<string, any>;
}

// Color scheme integration
export interface SequenceColorScheme extends ColorScheme {
  // Additional properties specific to sequence visualization
  backgroundOpacity?: number;
  textColor?: string;
  selectionColor?: string;
  highlightColor?: string;
}
