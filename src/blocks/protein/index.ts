/**
 * Protein Block - Complete protein visualization functionality
 *
 * This block contains all protein-related components, including:
 * - 3D structure viewers (Molstar integration)
 * - Sequence viewers and selectors
 * - Structure controls and settings
 * - Workspace orchestration
 */

// Main protein components
export { ProteinViewer } from "./components/viewers/ProteinViewer";
export { MolstarViewer } from "./components/viewers/MolstarViewer";
export { SequenceViewer } from "./components/sequence/SequenceViewer";
export { SequenceWorkspace } from "./components/sequence/SequenceWorkspace";
export { StructureWorkspace } from "./components/workspace/StructureWorkspace";

// Controls and settings
export { StructureControls } from "./components/controls/StructureControls";
export { PDBLoader } from "./components/controls/PDBLoader";
export { ChainSelector } from "./components/sequence/ChainSelector";

// Re-export everything from components for convenience
export * from "./components";
