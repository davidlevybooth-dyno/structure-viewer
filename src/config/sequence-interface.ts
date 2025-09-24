/**
 * Sequence Interface Configuration
 */

export interface SequenceInterfaceConfig {
  // Layout
  residuesPerRow: number;
  showPositions: boolean;
  showChainLabels: boolean;
  
  // Visual
  colorScheme: string;
  
  // Interaction
  selectionMode: 'single' | 'multiple' | 'range';
  enableCopyPaste: boolean;
}

/**
 * Default configuration - simplified to only what's actually used
 */
export const DEFAULT_SEQUENCE_CONFIG: SequenceInterfaceConfig = {
  residuesPerRow: 40,
  showPositions: true,
  showChainLabels: true,
  colorScheme: 'default',
  selectionMode: 'range',
  enableCopyPaste: true,
};
