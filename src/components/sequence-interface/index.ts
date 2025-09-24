/**
 * Sequence Interface Component Library
 * 
 * A standalone, interactive sequence visualization and manipulation library
 * designed for bioinformatics applications with structure viewer integration.
 */

// Main component
export { SequenceInterface as default, SequenceInterface } from './SequenceInterface';

// Context and hooks
export { SequenceSelectionProvider, useSequenceSelection } from './context/SequenceSelectionContext';

// Individual components
export { ResidueGrid } from './ResidueGrid';
export { SelectionSummary } from './SelectionSummary';

// Types
export type {
  SequenceData,
  SequenceChain,
  SequenceResidue,
  SequenceSelection,
  SelectionRegion,
  SequenceInterfaceConfig,
  SequenceInterfaceCallbacks,
  SequenceInterfaceProps,
  SequenceInterfaceState,
  SequenceInterfaceAction,
  ResiduePosition,
  SelectionRange,
  SequenceSelectionExport,
  SequenceColorScheme,
} from './types';

// Utilities
export {
  COLOR_SCHEMES,
  COLOR_SCHEME_OPTIONS,
  getResidueColor,
  getResidueInfo,
  getResidueGroup,
} from '@/lib/amino-acid-colors';
