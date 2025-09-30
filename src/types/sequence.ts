/**
 * Centralized type definitions for sequence interface
 * Provides type safety for all sequence-related operations
 */

// Re-export existing types for backward compatibility
export type {
  SequenceData,
  SequenceChain,
  SequenceResidue,
  SelectionRegion,
  SequenceSelection,
  SequenceInterfaceProps,
  SequenceInterfaceCallbacks,
} from '@/components/sequence-interface/types';

// Enhanced types for production use
export interface SequenceMetadata {
  organism?: string;
  resolution?: number;
  method?: string;
  depositionDate?: string;
  releaseDate?: string;
  authors?: string[];
  title?: string;
}

export interface ChainMetadata {
  type: 'protein' | 'dna' | 'rna' | 'other';
  length: number;
  molecularWeight?: number;
  organism?: string;
  description?: string;
}

export interface ResidueMetadata {
  name: string;
  code: string;
  type: 'standard' | 'modified' | 'unknown';
  properties?: {
    hydrophobic?: boolean;
    charged?: boolean;
    polar?: boolean;
    aromatic?: boolean;
  };
}

// Selection and interaction types
export type SelectionMode = 'single' | 'range' | 'multiple';

export type InteractionMode = 'select' | 'highlight' | 'readonly';

export interface SelectionConstraints {
  maxSelections?: number;
  maxRangeSize?: number;
  allowedChains?: string[];
  allowedResidues?: string[];
}

export interface SelectionState {
  regions: SelectionRegion[];
  mode: SelectionMode;
  constraints: SelectionConstraints;
  lastModified: number;
}

// Event types for sequence interface
export type SequenceEventType =
  | 'selection-changed'
  | 'residue-clicked'
  | 'residue-hovered'
  | 'chain-selected'
  | 'data-loaded'
  | 'error-occurred';

export interface SequenceEvent<T = unknown> {
  type: SequenceEventType;
  timestamp: number;
  source: 'user' | 'api' | 'system';
  data?: T;
}

// API types
export interface SequenceApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    requestId: string;
    timestamp: number;
    duration: number;
  };
}

export interface PdbApiResponse extends SequenceApiResponse<SequenceData> {
  data?: SequenceData & {
    metadata: SequenceMetadata;
    chains: (SequenceChain & { metadata: ChainMetadata })[];
  };
}

// Configuration types
export interface SequenceConfig {
  residuesPerRow: number;
  showRuler: boolean;
  showChainLabels: boolean;
  colorScheme: 'default' | 'hydrophobicity' | 'charge' | 'secondary-structure';
  interactionMode: InteractionMode;
  selectionMode: SelectionMode;
  constraints: SelectionConstraints;
}

// Performance optimization types
export interface VirtualizationConfig {
  enabled: boolean;
  itemHeight: number;
  overscan: number;
  threshold: number;
}

export interface SequencePerformanceConfig {
  virtualization: VirtualizationConfig;
  debounceMs: number;
  memoization: boolean;
  lazyLoading: boolean;
}

// Integration types for Molstar connection
export interface SequenceMolstarIntegration {
  highlightResidues: (ranges: ResidueRange[]) => Promise<void>;
  selectResidues: (ranges: ResidueRange[]) => Promise<void>;
  hideResidues: (ranges: ResidueRange[]) => Promise<void>;
  isolateResidues: (ranges: ResidueRange[]) => Promise<void>;
  getAvailableChains: () => Promise<string[]>;
}

// Re-export ResidueRange from molstar types for consistency
export type { ResidueRange } from './molstar';
