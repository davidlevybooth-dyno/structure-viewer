# Molstar Controls Implementation Project Plan

## 🎯 **Project Overview**

Implement comprehensive Molstar controls with a compact, modern UI that provides both direct user interaction and programmatic access for AI agents. This builds on the existing experimental code in the `dlb/regions` branch and integrates with the current architecture.

---

## 📊 **Current State Analysis**

### ✅ **Existing Foundation (dlb/regions branch)**
- **Working Molstar Integration**: Full plugin initialization and structure loading
- **Component Removal API**: Selection + subtraction method for water, ligands, ions
- **Chain Isolation**: Multiple approaches (hide others, true isolation, sequence regions)
- **Representation Control**: Safe in-place representation switching
- **Experimental UI Components**: `RegionIsolationControls`, `ComponentRemovalControls`
- **Comprehensive Documentation**: `MOLSTAR_ISOLATION_AND_REPRESENTATION_GUIDE.md`

### 🔍 **Architecture Strengths**
- **Battle-tested APIs**: Proven working patterns from extensive experimentation
- **Agent-ready Design**: Functions designed for programmatic control
- **Modular Structure**: Clean separation between UI and core functionality
- **Error Handling**: Robust error handling and fallback mechanisms

### 🎯 **Integration Target**
- **Current UI**: Sequence panel dropdown and chain selection as design reference
- **Target Location**: Integrate into existing `ProteinViewerControls.tsx`
- **Design Language**: Match existing compact, modern interface style

---

## 🏗️ **Proposed Architecture**

### **1. Core API Layer** (`src/lib/molstar/`)
```
src/lib/molstar/
├── camera-controls.ts      # Camera & view operations
├── chain-operations.ts     # Chain hide/isolate/color operations  
├── component-removal.ts    # ✅ Already exists - water/ligand/ion removal
├── representation.ts       # ✅ Partially exists - representation switching
├── sequence-operations.ts  # Sequence-based selection and isolation
├── highlighting.ts         # ✅ Already exists - highlighting operations
├── annotations.ts          # Custom labels and annotations
└── molstar-agent-api.ts    # High-level API for AI agent integration
```

### **2. UI Components Layer** (`src/components/protein/controls/`)
```
src/components/protein/controls/
├── ProteinViewerControls.tsx    # ✅ Main container (existing)
├── CameraControls.tsx           # Camera & view controls
├── ChainControls.tsx            # Chain operations dropdown
├── ComponentControls.tsx        # Component visibility dropdown  
├── RepresentationControls.tsx   # ✅ Partially exists
├── SequenceControls.tsx         # Sequence-based operations
├── HighlightingControls.tsx     # Highlighting & annotations
└── PresetControls.tsx           # Common workflow presets
```

### **3. Integration Points**
- **Sequence Interface**: Bidirectional communication for sequence-based operations
- **Chat Interface**: AI agent command execution
- **State Management**: Centralized control state and persistence

---

## 📋 **Detailed Implementation Plan**

### **Phase 1: Core API Development** (Week 1)

#### **1.1 Camera & View Controls API**
```typescript
// src/lib/molstar/camera-controls.ts
export interface CameraControls {
  // Zoom operations
  zoomIn(factor?: number): Promise<void>;
  zoomOut(factor?: number): Promise<void>;
  zoomToFit(): Promise<void>;
  
  // Rotation operations  
  rotate(axis: 'x' | 'y' | 'z', degrees: number): Promise<void>;
  resetRotation(): Promise<void>;
  
  // Pan operations
  pan(x: number, y: number): Promise<void>;
  
  // Focus operations
  focusOnSelection(): Promise<void>;
  focusOnChain(chainId: string): Promise<void>;
  focusOnResidue(chainId: string, residueId: number): Promise<void>;
  
  // Presets
  resetToDefault(): Promise<void>;
}
```

#### **1.2 Chain Operations API**
```typescript
// src/lib/molstar/chain-operations.ts
export interface ChainOperations {
  // Visibility operations
  hideChain(chainId: string): Promise<boolean>;
  showChain(chainId: string): Promise<boolean>;
  isolateChain(chainId: string): Promise<boolean>;
  showAllChains(): Promise<boolean>;
  
  // Coloring operations
  colorChainsByType(): Promise<void>;
  colorChainsByFunction(): Promise<void>;
  colorChainUnique(chainId: string, color: string): Promise<void>;
  resetChainColors(): Promise<void>;
  
  // Labeling operations
  labelChain(chainId: string, label?: string, persistent?: boolean): Promise<void>;
  clearChainLabels(): Promise<void>;
  
  // Discovery
  getAvailableChains(): string[];
  getChainInfo(chainId: string): ChainInfo;
}
```

#### **1.3 Sequence Operations API**
```typescript
// src/lib/molstar/sequence-operations.ts
export interface SequenceOperations {
  // Selection operations
  selectResidueRange(chainId: string, start: number, end: number): Promise<boolean>;
  selectResiduesByProperty(property: ResidueProperty): Promise<boolean>;
  
  // Isolation operations
  isolateResidueRange(chainId: string, start: number, end: number): Promise<boolean>;
  hideResidueRange(chainId: string, start: number, end: number): Promise<boolean>;
  
  // Mutation operations (future)
  replaceResidue(chainId: string, position: number, newResidue: string): Promise<boolean>;
  deleteResidues(chainId: string, positions: number[]): Promise<boolean>;
  insertResidues(chainId: string, position: number, residues: string[]): Promise<boolean>;
}
```

#### **1.4 Enhanced Representation API**
```typescript
// src/lib/molstar/representation.ts (enhance existing)
export interface RepresentationControls {
  // Basic representations
  setCartoon(): Promise<boolean>;
  setSurface(): Promise<boolean>;
  setBallAndStick(): Promise<boolean>;
  setSpacefill(): Promise<boolean>;
  setPoint(): Promise<boolean>;
  
  // Mixed representations
  setMixedRepresentation(config: MixedRepConfig): Promise<boolean>;
  
  // Surface controls
  setSurfaceTransparency(value: number): Promise<boolean>;
  
  // Advanced
  setCustomRepresentation(type: string, params: any): Promise<boolean>;
}
```

### **Phase 2: UI Components Development** (Week 2)

#### **2.1 Camera Controls Component**
```typescript
// src/components/protein/controls/CameraControls.tsx
interface CameraControlsProps {
  plugin: PluginUIContext | null;
  className?: string;
}

// Features:
// - Zoom in/out buttons with incremental and continuous modes
// - Rotation controls (free and axis-constrained)
// - Pan controls with directional buttons
// - Reset and fit-to-view buttons
// - Compact dropdown design matching existing UI
```

#### **2.2 Chain Controls Component**
```typescript
// src/components/protein/controls/ChainControls.tsx
interface ChainControlsProps {
  plugin: PluginUIContext | null;
  availableChains: string[];
  onChainChange?: (chainId: string, operation: ChainOperation) => void;
}

// Features:
// - Chain selector dropdown
// - Hide/Show/Isolate buttons
// - Color scheme selector
// - Label toggle
// - Multi-chain operations
```

#### **2.3 Component Controls Component**
```typescript
// src/components/protein/controls/ComponentControls.tsx
interface ComponentControlsProps {
  plugin: PluginUIContext | null;
  onComponentChange?: (type: ComponentType, visible: boolean) => void;
}

// Features:
// - Water molecules toggle
// - Ligands toggle with custom selection
// - Ions toggle with custom selection
// - Heteroatoms toggle
// - Custom component removal
```

#### **2.4 Enhanced Representation Controls**
```typescript
// Enhance existing RepresentationControls.tsx
// Features:
// - All basic representation types
// - Mixed representation builder
// - Surface transparency slider
// - Quick preset buttons
// - Advanced options dropdown
```

### **Phase 3: Integration & UI Polish** (Week 3)

#### **3.1 Main Controls Integration**
- Integrate all new controls into `ProteinViewerControls.tsx`
- Implement collapsible sections with consistent design
- Add keyboard shortcuts for common operations
- Implement state persistence

#### **3.2 Sequence Interface Integration**
- Connect sequence selections to 3D highlighting
- Implement bidirectional communication
- Add sequence-based operation triggers
- Ensure consistent state management

#### **3.3 Preset Workflows**
```typescript
// src/components/protein/controls/PresetControls.tsx
interface PresetControlsProps {
  plugin: PluginUIContext | null;
  onPresetApply?: (preset: PresetType) => void;
}

// Presets:
// - "Protein Analysis" (cartoon, hide water/ligands)
// - "Binding Site" (surface, isolate ligands, focus)
// - "Chain Comparison" (color by chain, hide water)
// - "Clean Structure" (remove all unwanted components)
// - Custom preset builder
```

### **Phase 4: AI Agent Integration** (Week 4)

#### **4.1 Agent API Development**
```typescript
// src/lib/molstar/molstar-agent-api.ts
export class MolstarAgentAPI {
  constructor(private plugin: PluginUIContext) {}
  
  // High-level commands for AI agents
  async executeCommand(command: MolstarCommand): Promise<CommandResult>;
  async analyzeStructure(): Promise<StructureAnalysis>;
  async applyWorkflow(workflow: WorkflowDefinition): Promise<boolean>;
  
  // Natural language command mapping
  async parseNaturalLanguageCommand(text: string): Promise<MolstarCommand[]>;
}
```

#### **4.2 Command Schema Definition**
```typescript
// src/types/molstar-commands.ts
export interface MolstarCommand {
  type: 'camera' | 'chain' | 'component' | 'representation' | 'sequence' | 'preset';
  action: string;
  parameters: Record<string, any>;
  target?: {
    chainId?: string;
    residueRange?: [number, number];
    componentType?: string;
  };
}
```

#### **4.3 Chat Interface Integration**
- Connect MolstarAgentAPI to chat message processing
- Implement command result visualization
- Add command history and undo functionality
- Create help system for available commands

---

## 🎨 **UI Design Specifications**

### **Design Principles**
1. **Compact & Modern**: Match existing sequence panel and chain selector design
2. **Hierarchical Organization**: Group related controls in collapsible sections
3. **Progressive Disclosure**: Show basic options first, advanced in dropdowns
4. **Consistent Interactions**: Use established patterns from existing UI
5. **Responsive Design**: Work well in the sidebar panel layout

### **Component Layout**
```
┌─ Structure Controls ────────────────────────┐
│ ┌─ Camera & View ─────────────────────────┐ │
│ │ [🔍+] [🔍-] [↻] [⌂] [📐]              │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Chains ────────────────────────────────┐ │
│ │ Chain: [A ▼] [👁] [🎯] [🎨] [🏷]        │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Components ────────────────────────────┐ │
│ │ [💧] [🧬] [⚛️] [🔬] [🧹 Clean All]      │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Representation ────────────────────────┐ │
│ │ [🎭] [🌊] [🔗] [⚫] [📊 Mixed]          │ │
│ └─────────────────────────────────────────┘ │
│ ┌─ Presets ───────────────────────────────┐ │
│ │ [🧬 Protein] [🏠 Binding] [🔬 Analysis] │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### **Interaction Patterns**
- **Primary Actions**: Direct buttons for common operations
- **Secondary Actions**: Dropdown menus for advanced options
- **State Indicators**: Visual feedback for current settings
- **Tooltips**: Helpful descriptions for all controls
- **Keyboard Shortcuts**: Power user efficiency

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- Test all API functions with mock Molstar plugin
- Verify error handling and edge cases
- Test command parsing and validation

### **Integration Tests**
- Test UI component interactions
- Verify bidirectional sequence-structure communication
- Test AI agent command execution

### **User Testing**
- Test with common protein analysis workflows
- Verify intuitive operation discovery
- Test with complex multi-chain structures

---

## 📈 **Success Metrics**

### **Functionality Metrics**
- ✅ All camera operations work smoothly
- ✅ Chain operations preserve structure integrity
- ✅ Component removal works reliably
- ✅ Representation switching maintains performance
- ✅ AI agent commands execute correctly

### **Usability Metrics**
- ⏱️ < 3 clicks for common operations
- 🎯 < 30s learning curve for new users
- 📱 Responsive design works on different screen sizes
- ⌨️ Keyboard shortcuts improve power user efficiency

### **Performance Metrics**
- ⚡ < 200ms response time for UI interactions
- 🔄 < 2s for complex operations (surface generation)
- 💾 Minimal memory footprint increase
- 🖥️ Smooth operation with large structures (>10k atoms)

---

## 🚀 **Implementation Timeline**

### **Week 1: Core APIs**
- Day 1-2: Camera controls API
- Day 3-4: Chain operations API  
- Day 5-7: Sequence operations API

### **Week 2: UI Components**
- Day 1-2: Camera controls UI
- Day 3-4: Chain controls UI
- Day 5-7: Component & representation controls UI

### **Week 3: Integration**
- Day 1-3: Main controls integration
- Day 4-5: Sequence interface integration
- Day 6-7: Preset workflows

### **Week 4: AI Integration**
- Day 1-3: Agent API development
- Day 4-5: Chat interface integration
- Day 6-7: Testing and polish

---

## 🔄 **Future Enhancements**

### **Advanced Features**
- **Custom Annotations**: User-defined labels and markers
- **Animation Controls**: Structure morphing and transitions
- **Export Options**: High-quality images and videos
- **Collaboration**: Shared sessions and annotations
- **Plugin System**: Extensible architecture for custom tools

### **AI Agent Enhancements**
- **Context Awareness**: Remember previous operations
- **Workflow Learning**: Suggest common operation sequences
- **Natural Language**: More sophisticated command parsing
- **Visual Feedback**: Show AI reasoning in the interface

---

## 📚 **Documentation Plan**

### **Developer Documentation**
- API reference for all Molstar control functions
- Component usage examples and props
- Integration guide for new controls
- Testing guide and examples

### **User Documentation**
- Interactive tutorial for common workflows
- Keyboard shortcuts reference
- Troubleshooting guide
- AI command reference

This comprehensive plan builds on the excellent experimental work in the `dlb/regions` branch and creates a production-ready, extensible system for Molstar controls that serves both direct users and AI agents.
