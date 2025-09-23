import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import type { PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';

/**
 * Core Molstar plugin interface
 */
export interface MolstarPlugin {
  readonly plugin: PluginUIContext;
  readonly isInitialized: boolean;
}

/**
 * PDB structure information
 */
export interface PDBStructure {
  readonly id: string;
  readonly title?: string;
  readonly method?: string;
  readonly resolution?: number;
  readonly depositionDate?: string;
  readonly chains: Chain[];
}

/**
 * Chain information within a structure
 */
export interface Chain {
  readonly id: string;
  readonly entityId?: string;
  readonly description?: string;
  readonly type: 'protein' | 'nucleic' | 'ligand' | 'water' | 'other';
  readonly residueCount: number;
}

/**
 * Structure loading options
 */
export interface LoadStructureOptions {
  /** PDB ID to load */
  id: string;
  /** Assembly ID (default: 1) */
  assemblyId?: string;
  /** Whether to focus camera on structure after loading */
  autoFocus?: boolean;
  /** Representation type to apply */
  representation?: RepresentationType;
  /** Color scheme to apply */
  colorScheme?: ColorScheme;
}

/**
 * Available representation types
 */
export type RepresentationType = 
  | 'cartoon'
  | 'ball-and-stick'
  | 'spacefill'
  | 'surface'
  | 'line'
  | 'point';

/**
 * Available color schemes
 */
export type ColorScheme = 
  | 'chain-id'
  | 'sequence-id'
  | 'entity-id'
  | 'residue-name'
  | 'element-symbol'
  | 'uniform';

/**
 * Selection target for molecular operations
 */
export interface SelectionTarget {
  /** Chain identifier */
  chainId?: string;
  /** Residue number range */
  residueRange?: { start: number; end: number };
  /** Specific residue numbers */
  residueNumbers?: number[];
  /** Ligand name */
  ligandName?: string;
  /** Element type */
  element?: string;
}

/**
 * Molstar viewer configuration
 */
export interface MolstarConfig {
  /** Hide the sequence viewer panel */
  hideSequencePanel?: boolean;
  /** Hide the log panel */
  hideLogPanel?: boolean;
  /** Show structure controls */
  showStructureControls?: boolean;
  /** Show measurements tools */
  showMeasurements?: boolean;
  /** Show export controls */
  showExport?: boolean;
  /** Background color */
  backgroundColor?: string;
  /** Enable validation reports */
  enableValidation?: boolean;
}

/**
 * Molstar viewer events
 */
export interface MolstarEvents {
  onStructureLoaded?: (structure: PDBStructure) => void;
  onSelectionChanged?: (selection: SelectionTarget[]) => void;
  onError?: (error: string) => void;
  onReady?: (plugin: PluginUIContext) => void;
}

/**
 * Complete Molstar viewer props
 */
export interface MolstarViewerProps extends MolstarEvents {
  /** PDB ID to load initially */
  pdbId?: string;
  /** CSS class name */
  className?: string;
  /** Viewer configuration */
  config?: MolstarConfig;
  /** Loading structure options */
  loadOptions?: Omit<LoadStructureOptions, 'id'>;
}
