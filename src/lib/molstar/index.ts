/**
 * Mol* Highlighting API
 * 
 * Clean, extensible interface for molecular structure highlighting
 * Provides sequence → structure highlighting with configurable options
 */

// Core highlighting functions
export {
  buildResidueRangeLoci,
  highlightOnly,
  selectOnly,
  clearAllHighlights,
  clearAllSelections,
  focusLoci,
  type ResidueRange,
} from './highlighting';

// Type conversion utilities  
export {
  selectionRegionsToResidueRanges,
  sequenceResiduesToResidueRanges,
  sequenceResidueToResidueRange,
  mergeResidueRanges,
} from './sequence-to-molstar';

// Configuration constants
export {
  HIGHLIGHTING_CONFIG,
  SEQUENCE_HIGHLIGHTING_CONFIG,
  type HighlightingConfig,
  type SequenceHighlightingConfig,
} from './config';

// Region isolation utilities
export {
  isolateRegion,
  showAllComponents,
  getAvailableChains,
  getIsolationStatus,
  type IsolationRegion,
  type IsolationOptions,
  type RepresentationType,
} from './isolation';
