import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

export interface MolstarPlugin extends PluginUIContext {}

export interface MolstarConfig {
  layoutIsExpanded?: boolean;
  layoutShowControls?: boolean;
  layoutShowRemoteState?: boolean;
  layoutShowSequence?: boolean;
  layoutShowLog?: boolean;
  layoutShowLeftPanel?: boolean;
  viewportShowExpand?: boolean;
  viewportShowSelectionMode?: boolean;
  viewportShowAnimation?: boolean;
  pdbProvider?: string;
  emdbProvider?: string;
}

// Structure operations
export type RepresentationType = 'cartoon' | 'surface' | 'ball-stick' | 'spacefill';
export type ChainOperation = 'hide' | 'isolate' | 'show';
export type ComponentType = 'water' | 'ligands' | 'ions';
export type ResidueOperation = 'hide' | 'isolate' | 'highlight' | 'copy';

// Selection and highlighting
export interface ResidueRange {
  chainId: string;
  start: number;
  end: number;
}

export interface HighlightOptions {
  color?: string;
  clearExisting?: boolean;
}

// Error types
export type MolstarErrorType = 
  | 'INITIALIZATION_ERROR'
  | 'LOADING_ERROR' 
  | 'OPERATION_ERROR'
  | 'SELECTION_ERROR'
  | 'NETWORK_ERROR';

export interface MolstarError extends Error {
  type: MolstarErrorType;
  code?: string;
  details?: Record<string, unknown>;
}

// Operation results
export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: MolstarError;
}

// Async operation status
export interface AsyncOperation {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  error?: MolstarError;
}

// Plugin state
export interface MolstarState {
  isInitialized: boolean;
  isLoading: boolean;
  currentPdbId?: string;
  loadedStructures: string[];
  currentRepresentation: RepresentationType;
  hiddenChains: Set<string>;
  hiddenComponents: Set<ComponentType>;
  activeOperations: AsyncOperation[];
}

// Event types
export type MolstarEventType = 
  | 'initialized'
  | 'structure-loaded'
  | 'structure-failed'
  | 'representation-changed'
  | 'selection-changed'
  | 'operation-started'
  | 'operation-completed'
  | 'operation-failed';

export interface MolstarEvent<T = unknown> {
  type: MolstarEventType;
  timestamp: number;
  data?: T;
}

// Callback types
export type MolstarEventCallback<T = unknown> = (event: MolstarEvent<T>) => void;

export interface MolstarCallbacks {
  onInitialized?: MolstarEventCallback;
  onStructureLoaded?: MolstarEventCallback<{ pdbId: string }>;
  onStructureFailed?: MolstarEventCallback<{ pdbId: string; error: MolstarError }>;
  onRepresentationChanged?: MolstarEventCallback<{ representation: RepresentationType }>;
  onSelectionChanged?: MolstarEventCallback<{ selection: ResidueRange[] }>;
  onOperationStarted?: MolstarEventCallback<AsyncOperation>;
  onOperationCompleted?: MolstarEventCallback<AsyncOperation>;
  onOperationFailed?: MolstarEventCallback<AsyncOperation>;
}