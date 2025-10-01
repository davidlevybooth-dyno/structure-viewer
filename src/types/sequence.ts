export interface SequenceResidue {
  position: number;
  code: string;
  chainId: string;
  secondaryStructure?: "helix" | "sheet" | "loop";
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
  metadata?: Record<string, unknown>;
}

export interface SelectionRegion {
  id: string;
  chainId: string;
  start: number;
  end: number;
  sequence: string;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface SequenceSelection {
  regions: SelectionRegion[];
  activeRegion: string | null;
  clipboard: string | null;
}

export type RegionAction = "hide" | "isolate" | "highlight" | "copy";

export interface SequenceInterfaceCallbacks {
  onSelectionChange?: (selection: SequenceSelection) => void;
  onHighlightChange?: (residues: SequenceResidue[]) => void;
  onSequencePaste?: (
    sequence: string,
    position?: { chainId: string; position: number },
  ) => void;
  onSequenceCopy?: (sequence: string, region: SelectionRegion) => void;
  onRegionAction?: (
    region: SelectionRegion | null,
    action: RegionAction,
  ) => void;
  onResidueAction?: (residue: SequenceResidue, action: RegionAction) => void;
}

export interface SequenceInterfaceProps {
  data?: SequenceData;
  selection?: SequenceSelection;
  highlightedResidues?: SequenceResidue[];
  selectedChainIds?: string[];
  colorScheme?: string;
  className?: string;
  readOnly?: boolean;
  callbacks?: SequenceInterfaceCallbacks;
  onChainSelectionChange?: (chainIds: string[]) => void;
}

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
  type: "protein" | "dna" | "rna" | "other";
  length: number;
  molecularWeight?: number;
  organism?: string;
  description?: string;
}

export interface ResidueMetadata {
  name: string;
  code: string;
  type: "standard" | "modified" | "unknown";
  properties?: {
    hydrophobic?: boolean;
    charged?: boolean;
    polar?: boolean;
    aromatic?: boolean;
  };
}

export type SelectionMode = "single" | "range" | "multiple";

export type InteractionMode = "select" | "highlight" | "readonly";

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

export type SequenceEventType =
  | "selection-changed"
  | "residue-clicked"
  | "residue-hovered"
  | "chain-selected"
  | "data-loaded"
  | "error-occurred";

export interface SequenceEvent<T = unknown> {
  type: SequenceEventType;
  timestamp: number;
  source: "user" | "api" | "system";
  data?: T;
}

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

export interface SequenceConfig {
  residuesPerRow: number;
  showRuler: boolean;
  showChainLabels: boolean;
  colorScheme: "default" | "hydrophobicity" | "charge" | "secondary-structure";
  interactionMode: InteractionMode;
  selectionMode: SelectionMode;
  constraints: SelectionConstraints;
}

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

export interface SequenceMolstarIntegration {
  highlightResidues: (ranges: ResidueRange[]) => Promise<void>;
  selectResidues: (ranges: ResidueRange[]) => Promise<void>;
  hideResidues: (ranges: ResidueRange[]) => Promise<void>;
  isolateResidues: (ranges: ResidueRange[]) => Promise<void>;
  getAvailableChains: () => Promise<string[]>;
}

export interface ResidueRange {
  chainId: string;
  start: number;
  end: number;
}
