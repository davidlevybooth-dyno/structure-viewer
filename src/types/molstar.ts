import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

export interface MolstarPlugin {
  readonly plugin: PluginUIContext;
  readonly isInitialized: boolean;
}

export interface PDBStructure {
  readonly id: string;
  readonly title?: string;
  readonly method?: string;
  readonly resolution?: number;
  readonly depositionDate?: string;
  readonly chains: Chain[];
}

export interface Chain {
  readonly id: string;
  readonly entityId?: string;
  readonly description?: string;
  readonly type: "protein" | "nucleic" | "ligand" | "water" | "other";
  readonly residueCount: number;
}

export interface LoadStructureOptions {
  id: string;
  assemblyId?: string;
  autoFocus?: boolean;
  representation?: RepresentationType;
  colorScheme?: ColorScheme;
}

export type RepresentationType =
  | "cartoon"
  | "ball-and-stick"
  | "spacefill"
  | "surface"
  | "line"
  | "point";

export type ColorScheme =
  | "chain-id"
  | "sequence-id"
  | "entity-id"
  | "residue-name"
  | "element-symbol"
  | "uniform";

export interface SelectionTarget {
  chainId?: string;
  residueRange?: { start: number; end: number };
  residueNumbers?: number[];
  ligandName?: string;
  element?: string;
}
export interface MolstarConfig {
  hideSequencePanel?: boolean;
  hideLogPanel?: boolean;
  showStructureControls?: boolean;
  showMeasurements?: boolean;
  showExport?: boolean;
  backgroundColor?: string;
  enableValidation?: boolean;
}
export interface MolstarEvents {
  onStructureLoaded?: (structure: PDBStructure) => void;
  onSelectionChanged?: (selection: SelectionTarget[]) => void;
  onError?: (error: string) => void;
  onReady?: (plugin: PluginUIContext) => void;
}

export interface MolstarViewerProps extends MolstarEvents {
  pdbId?: string;
  className?: string;
  config?: MolstarConfig;
  loadOptions?: Omit<LoadStructureOptions, "id">;
}
