# Production Sequence Interface System

A clean, modular, and production-ready sequence visualization system for protein structure analysis.

## 🎯 **System Overview**

This is a consolidated, single-version system with no redundant components. Everything is production-ready and optimized for real-world use.

## 📁 **Architecture**

```
src/components/
├── SequenceViewer.tsx              # Main sequence viewer (PDB data fetching + interface)
├── ui/
│   ├── CompactSequenceViewer.tsx   # Collapsible interface with chain selector
│   └── ChainSelector.tsx           # Interactive chain selection pills
└── sequence-interface/             # Core sequence interface library
    ├── SequenceInterface.tsx       # Main sequence visualization component
    ├── ResidueGrid.tsx            # Interactive amino acid grid with selection
    ├── SelectionSummary.tsx       # Selection display and actions
    ├── context/                   # React context for state management
    ├── hooks/                     # Custom hooks (useSequenceInterface, etc.)
    ├── components/                # Modular sub-components
    └── types.ts                   # TypeScript definitions
```

## 🚀 **Key Components**

### **SequenceViewer** (Main Entry Point)
- Fetches PDB data using `usePDBSequence` hook
- Handles loading/error states
- Renders `SequenceInterface` with data
- Clean, simple API: `<SequenceViewer pdbId="1CRN" onSelectionChange={...} />`

### **CompactSequenceViewer** (UI Wrapper)
- Collapsible header with expand/collapse functionality
- Integrated chain selector with pagination (handles 60+ chains)
- Selection counter and copy functionality
- Collapsed selection preview
- Smart chain selection (≤3 chains: all, >3 chains: first)

### **ChainSelector** (Chain Management)
- Interactive pill-based chain selection
- High-contrast selection (grey unselected, bright colors selected)
- Pagination for structures with many chains
- Tooltips with chain metadata
- Quick "All/One" actions for bulk selection

### **SequenceInterface** (Core Engine)
- Interactive residue grid with drag selection
- Multi-region selection support (Shift+drag)
- Real-time highlighting sync with structure viewer
- Context-based state management
- Performance optimized for large structures

## 🔧 **Usage Examples**

### **Basic Usage**
```tsx
import { SequenceViewer } from '@/components/SequenceViewer';

<SequenceViewer 
  pdbId="1CRN"
  onSelectionChange={(selection) => console.log(selection)}
  onHighlightChange={(residues) => highlightInStructure(residues)}
/>
```

### **Compact Interface**
```tsx
import { CompactSequenceViewer } from '@/components/ui/CompactSequenceViewer';

<CompactSequenceViewer
  pdbId="7MT0"
  isViewerReady={true}
  selectedChainIds={['A', 'B']}
  onChainSelectionChange={setSelectedChains}
  onSelectionChange={handleSelection}
/>
```

## 📊 **Data Structures**

### **Selection Format**
```typescript
interface SequenceSelection {
  regions: SelectionRegion[];
  activeRegion: string | null;
  clipboard: string | null;
}

interface SelectionRegion {
  id: string;
  chainId: string;
  start: number;
  end: number;
  sequence: string;
  label?: string;
}
```

### **Chain Information**
```typescript
interface ChainInfo {
  id: string;           // Chain identifier (A, B, C, etc.)
  name?: string;        // Chain description
  residueCount: number; // Number of residues
  description?: string; // Additional metadata
}
```

## ✨ **Features**

### **Selection System**
- ✅ **Single click** → Select individual residue
- ✅ **Click + drag** → Select sequence range
- ✅ **Shift + drag** → Add multiple regions
- ✅ **Real-time preview** → Shows selection as you drag
- ✅ **Selection summary** → Displays selected sequences with copy/clear actions

### **Chain Management**
- ✅ **Smart defaults** → Auto-select appropriate chains based on structure size
- ✅ **Pagination** → Handle structures with 60+ chains (like viral capsids)
- ✅ **Visual feedback** → High-contrast selection with distinct colors
- ✅ **Bulk actions** → "All" and "One" buttons for quick selection

### **Performance**
- ✅ **Optimized rendering** → Memoized components and efficient re-renders
- ✅ **Responsive layout** → Adapts residues per row based on container width
- ✅ **Large structures** → Handles multi-chain proteins efficiently
- ✅ **Memory management** → Proper cleanup and state management

### **Integration**
- ✅ **Structure sync** → Bidirectional highlighting with 3D structure viewer
- ✅ **Export ready** → Clean selection data for external tools
- ✅ **TypeScript** → Full type safety throughout
- ✅ **SSR compatible** → Works with Next.js server-side rendering

## 🎨 **Styling**

- **Tailwind CSS** → Utility-first styling with custom components
- **Responsive design** → Adapts to different screen sizes
- **Consistent spacing** → Proper margins and padding throughout
- **Accessible colors** → High contrast for readability

## 🔄 **State Management**

- **React Context** → `SequenceSelectionProvider` for sequence state
- **Custom hooks** → `useSequenceInterface` for component logic
- **Local storage** → Persistent selection state across sessions
- **Optimistic updates** → Immediate UI feedback with proper error handling

## 📈 **Performance Optimizations**

- **Memoized components** → Prevent unnecessary re-renders
- **Efficient lookups** → Map-based region checking for O(1) performance
- **Responsive grid** → Dynamic residues per row based on container width
- **Lazy loading** → Only render visible components

## 🧪 **Testing**

The system is designed for easy testing:
- **Pure functions** → Utility functions are easily testable
- **Isolated hooks** → Custom hooks can be tested independently
- **Clear interfaces** → Components have well-defined props
- **Minimal side effects** → State changes are predictable

## 🚀 **Production Ready**

This system is:
- ✅ **Battle-tested** → Used in real protein structure analysis
- ✅ **Performance optimized** → Handles large structures efficiently
- ✅ **Type-safe** → Full TypeScript coverage
- ✅ **Accessible** → ARIA labels and keyboard navigation
- ✅ **Responsive** → Works on all screen sizes
- ✅ **Maintainable** → Clean, modular architecture

Perfect for integration into protein analysis tools, structural biology applications, and bioinformatics platforms.
