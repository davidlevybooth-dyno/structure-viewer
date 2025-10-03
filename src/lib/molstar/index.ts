// Core highlighting functions
export {
  buildResidueRangeLoci,
  highlightOnly,
  selectOnly,
  clearAllHighlights,
  clearAllSelections,
  focusLoci,
  type ResidueRange,
} from "./highlighting";

// Type conversion utilities
export {
  selectionRegionsToResidueRanges,
  sequenceResiduesToResidueRanges,
  sequenceResidueToResidueRange,
  mergeResidueRanges,
} from "./sequenceToMolstar";

// Configuration constants
export {
  HIGHLIGHTING_CONFIG,
  SEQUENCE_HIGHLIGHTING_CONFIG,
  type HighlightingConfig,
  type SequenceHighlightingConfig,
} from "./config";

// Chain operations
export {
  getAvailableChains,
  hideChain,
  isolateChain,
  showAllChains,
} from "./chainOperations";

// Representation types
export type { RepresentationType } from "@/types/molstar";

// Main wrapper class
export { molstarWrapper } from "./MolstarWrapper";
