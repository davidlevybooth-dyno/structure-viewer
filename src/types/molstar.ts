import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import type { ResidueRange } from "./sequence";

export interface MolstarPlugin extends PluginUIContext {
  // Additional molstar plugin properties can be added here
  readonly _brand?: "MolstarPlugin";
}

export type RepresentationType =
  | "cartoon"
  | "molecular-surface"
  | "ball-and-stick"
  | "spacefill"
  | "point"
  | "backbone";

export type ChainOperation = "hide" | "isolate" | "show";
export type ComponentType = "water" | "ligands" | "ions";
export type ResidueOperation = "hide" | "isolate" | "highlight" | "copy";

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
// Selection and highlighting
export type { ResidueRange } from "./sequence";

export interface HighlightOptions {
  color?: string;
  clearExisting?: boolean;
}

export type MolstarErrorType =
  | "INITIALIZATION_ERROR"
  | "LOADING_ERROR"
  | "OPERATION_ERROR"
  | "SELECTION_ERROR"
  | "NETWORK_ERROR";

export interface MolstarError extends Error {
  type: MolstarErrorType;
  code?: string;
  details?: Record<string, unknown>;
}

export interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: MolstarError;
}

export interface AsyncOperation {
  id: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  progress?: number;
  error?: MolstarError;
}

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

export type MolstarEventType =
  | "initialized"
  | "structure-loaded"
  | "structure-failed"
  | "representation-changed"
  | "selection-changed"
  | "operation-started"
  | "operation-completed"
  | "operation-failed";

export interface MolstarEvent<T = unknown> {
  type: MolstarEventType;
  timestamp: number;
  data?: T;
}

export type MolstarEventCallback<T = unknown> = (
  event: MolstarEvent<T>,
) => void;

export interface MolstarCallbacks {
  onInitialized?: MolstarEventCallback;
  onStructureLoaded?: MolstarEventCallback<{ pdbId: string }>;
  onStructureFailed?: MolstarEventCallback<{
    pdbId: string;
    error: MolstarError;
  }>;
  onRepresentationChanged?: MolstarEventCallback<{
    representation: RepresentationType;
  }>;
  onSelectionChanged?: MolstarEventCallback<{ selection: ResidueRange[] }>;
  onOperationStarted?: MolstarEventCallback<AsyncOperation>;
  onOperationCompleted?: MolstarEventCallback<AsyncOperation>;
  onOperationFailed?: MolstarEventCallback<AsyncOperation>;
}
