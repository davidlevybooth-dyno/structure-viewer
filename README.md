# Dyno Structure Viewer

An intelligent molecular structure viewer that combines the power of **Mol*** with intuitive sequence-structure interactions and natural language LLM control.

## 🎯 Project Overview

This project creates a modern, interactive molecular visualization platform that allows users to:
- Load and visualize protein structures from the PDB
- Interact with amino acid sequences through an advanced sequence interface
- Select regions in sequence view and see them highlighted in 3D structure
- Use natural language commands to control molecular visualizations (coming soon)

## ✨ Key Features

### 🧬 **Sequence Interface**
- **Interactive Sequence Display**: Click and drag to select amino acid regions
- **Multi-Region Selection**: Use Shift to select multiple non-contiguous regions
- **Real-time Highlighting**: Selected sequences are highlighted in the 3D structure
- **Modern UI**: Responsive design with horizontal scrolling and clean typography
- **Multiple Chains**: Support for multi-chain proteins with clear chain labeling

### 🔬 **Mol* Integration** 
- **Direct React Integration**: Native React components (no iframe embedding)
- **PDB Loading**: Automatic structure loading from PDB IDs
- **3D Visualization**: High-quality molecular rendering with multiple representation types
- **Error Handling**: Graceful error handling for failed structure loads

### 🎨 **Modern UI/UX**
- **Sliding Sidebar**: Collapsible control panel for structure management
- **Responsive Design**: Adapts to different screen sizes
- **Loading States**: Clear feedback during data fetching
- **TypeScript**: Fully typed for better development experience

## 🏗️ **Technical Architecture**

### **Component Structure**
```
src/
├── components/
│   ├── sequence-interface/           # Standalone sequence library
│   │   ├── SequenceInterface.tsx     # Main interactive component
│   │   ├── ResidueGrid.tsx          # Amino acid display grid
│   │   ├── SelectionSummary.tsx     # Selection state display
│   │   └── context/                 # State management
│   ├── ui/                          # Reusable UI components
│   │   ├── SlidingSidebar.tsx       # Collapsible sidebar
│   │   └── [other components]
│   └── MolstarViewer.tsx            # Mol* React integration
├── hooks/                           # Custom React hooks
│   ├── use-molstar-plugin.ts        # Mol* lifecycle management
│   ├── use-structure-loader.ts      # PDB loading logic
│   └── use-pdb-sequence.ts          # Sequence data fetching
├── lib/                             # Utility libraries
│   ├── amino-acid-colors.ts         # Color schemes for residues
│   ├── pdb-sequence-api.ts          # RCSB PDB GraphQL integration
│   └── molstar-utils.ts             # Mol* utility functions
└── types/                           # TypeScript definitions
    └── molstar.ts                   # Mol* type definitions
```

### **Data Flow**
```
User Input (PDB ID) 
    ↓
RCSB GraphQL API ← → PDB Data Fetching
    ↓
SequenceData Creation
    ↓
React Components (SequenceInterface + MolstarViewer)
    ↓
User Interactions (Selection, Highlighting)
    ↓
Bidirectional Updates (Sequence ↔ 3D Structure)
```

## 📊 **Data Structures**

### **Sequence Data**
```typescript
interface SequenceData {
  id: string;                    // PDB ID (e.g., "1CRN", "7MT0")
  name: string;                  // Full structure name
  chains: SequenceChain[];       // Array of protein chains
  metadata?: {
    organism?: string;           // Source organism
    method?: string;             // Experimental method
    resolution?: string;         // Resolution in Angstroms
  };
}

interface SequenceChain {
  id: string;                    // Chain identifier ("A", "B", "C")
  name?: string;                 // Chain description
  residues: SequenceResidue[];   // Ordered amino acid sequence
}

interface SequenceResidue {
  position: number;              // 1-based position in chain
  code: string;                  // Single-letter amino acid code
  chainId: string;               // Parent chain identifier
}
```

### **Selection Management**
```typescript
interface SequenceSelection {
  regions: SelectionRegion[];    // Array of selected regions
  activeRegion: string | null;   // Currently active region ID
}

interface SelectionRegion {
  id: string;                    // Unique identifier (e.g., "A-15-23")
  chainId: string;               // Target chain
  start: number;                 // First position (inclusive)
  end: number;                   // Last position (inclusive)
  sequence: string;              // Selected amino acid sequence
  label: string;                 // Display label (e.g., "A:15-23")
}
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm, yarn, or pnpm

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd dyno-structure

# Install dependencies
npm install
# or
yarn install
```

### **Development**
```bash
# Start the development server
npm run dev
# or
yarn dev

# Open http://localhost:3000 in your browser
```

### **Usage**
1. **Load a Structure**: Enter a PDB ID (e.g., "1CRN", "7MT0") in the sidebar
2. **Explore the Sequence**: Scroll through the amino acid sequence below the 3D viewer
3. **Select Regions**: Click and drag to select amino acid ranges
4. **Multi-Selection**: Hold Shift and drag to select multiple regions
5. **Copy Sequences**: Use the copy button to copy selected sequences to clipboard

## 🎨 **Sequence Interface Features**

### **Interactive Selection**
- **Single Region**: Click and drag across amino acids
- **Multiple Regions**: Hold Shift for non-contiguous selections
- **Visual Feedback**: Hover effects and selection highlighting
- **Copy Support**: Easy copying of selected sequences

### **Display Options**
- **Responsive Layout**: Adjusts residues per row based on screen width
- **Chain Headers**: Clear separation of different protein chains
- **Position Numbers**: Every 5th position is numbered for easy reference
- **Color Schemes**: Support for different amino acid coloring schemes

### **Selection Summary**
```
// Example selection display
A:15-23, A:45-52: ENLYFQSNN | GKDLAVEN (2 regions, 17 residues)
```

## 🔮 **Future Roadmap**

### **Phase 1: Foundation** ✅ **COMPLETE**
- [x] Mol* React integration
- [x] PDB structure loading
- [x] Sequence data fetching
- [x] Basic sequence interface
- [x] Selection management
- [x] Responsive UI design

### **Phase 2: Enhanced Interactions** 🚧 **IN PROGRESS**
- [x] Multi-region selection
- [x] Horizontal scrolling
- [x] Sorted region display
- [x] Sliding sidebar interface
- [ ] Bidirectional highlighting (sequence ↔ 3D)
- [ ] Structure-based sequence selection

### **Phase 3: AI Agent Integration** 📋 **PLANNED**
- [ ] Natural language command processing
- [ ] OpenAI Agents SDK integration
- [ ] Structured action system
- [ ] Voice command support
- [ ] Intelligent structure analysis

### **Phase 4: Advanced Features** 🎯 **FUTURE**
- [ ] Multiple structure comparison
- [ ] Sequence alignment visualization
- [ ] Conservation analysis
- [ ] Export capabilities (FASTA, PDB, images)
- [ ] Collaborative features

## 🛠️ **Technology Stack**

- **Frontend**: Next.js 14, React 18, TypeScript
- **3D Visualization**: Mol* (molstar)
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **Data Fetching**: RCSB PDB GraphQL API
- **Build Tool**: Next.js with custom webpack optimizations

## 📚 **API Integration**

### **RCSB PDB GraphQL**
The application fetches sequence data using the RCSB PDB GraphQL API:

```typescript
// Example query for PDB structure data
const query = `
  query GetPDBData($entryId: String!) {
    entry(entry_id: $entryId) {
      rcsb_id
      struct { title }
      polymer_entities {
        entity_poly {
          pdbx_seq_one_letter_code
          type
        }
        rcsb_polymer_entity_container_identifiers {
          auth_asym_ids
          entity_id
        }
      }
    }
  }
`;
```

## 🤝 **Contributing**

This project is in active development. Key areas for contribution:
- Bidirectional sequence-structure highlighting
- AI agent integration
- Advanced molecular visualization features
- Performance optimizations
- Test coverage

## 📄 **License**

[Add your license information here]

## 🙏 **Acknowledgments**

- **Mol*** team for the excellent molecular visualization library
- **RCSB PDB** for providing comprehensive structural biology data
- **Next.js** team for the robust React framework