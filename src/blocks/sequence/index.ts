/**
 * Sequence Block - Complete sequence interface functionality
 *
 * This block contains all sequence-related components for:
 * - Interactive sequence visualization
 * - Residue selection and highlighting
 * - Sequence-to-structure integration
 */

// Main sequence components
export { SequenceInterface } from "./components/SequenceInterface";
export { ResidueGrid } from "./components/ResidueGrid";
export { SelectionContextMenu } from "./components/components/SelectionContextMenu";
export { SequenceHeader } from "./components/components/SequenceHeader";
export { SelectionSummary } from "./components/SelectionSummary";

// Hooks
export { useSequenceInterface } from "./components/hooks/useSequenceInterface";

// Types (now centralized in src/types/sequence.ts)
export type * from "@/types/sequence";

// Re-export everything from components for convenience
export * from "./components";
