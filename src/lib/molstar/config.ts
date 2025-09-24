/**
 * Configuration constants for Mol* highlighting and visualization
 */

export const HIGHLIGHTING_CONFIG = {
  /** Default debounce delay for hover highlighting (ms) */
  HOVER_DEBOUNCE_MS: 150,
  
  /** Whether to use auth numbering (author) vs label numbering by default */
  USE_AUTH_NUMBERING: true,
  
  /** Default highlight color themes */
  COLORS: {
    /** Transient hover highlighting color */
    HOVER: '#FFD700', // Gold
    
    /** Persistent selection color */
    SELECTION: '#FF6B35', // Orange-red
    
    /** Error/warning highlight color */
    ERROR: '#FF4444', // Red
  },
} as const;

export const SEQUENCE_HIGHLIGHTING_CONFIG = {
  /** Maximum number of regions to highlight simultaneously for performance */
  MAX_REGIONS: 50,
  
  /** Whether to automatically focus camera on highlighted regions */
  AUTO_FOCUS: false,
  
  /** Whether to merge adjacent/overlapping ranges for better performance */
  MERGE_RANGES: true,
} as const;

export type HighlightingConfig = typeof HIGHLIGHTING_CONFIG;
export type SequenceHighlightingConfig = typeof SEQUENCE_HIGHLIGHTING_CONFIG;
