# Dyno Structure Viewer

A modern molecular structure viewer combining **Molstar 5.0** with an intuitive sequence interface, featuring robust highlighting, chain operations, and production-ready architecture.

## 🎯 Overview

Production-ready molecular visualization platform with:

- **Working Molstar Integration** - Official Molstar 5.0 APIs with persistent highlighting
- **Advanced Sequence Interface** - Interactive sequence viewer with right-click context menus
- **Chain Operations** - Hide, isolate, and show chains with bulletproof camera focusing
- **Component Management** - Toggle water, ligands, and ions with visual feedback
- **Clean Architecture** - Modular `blocks/` structure with comprehensive type safety

## ✨ Key Features

### 🧬 **Sequence Interface**
- **Interactive Selection** - Click and drag to select residue ranges
- **Right-Click Actions** - Context menu for hide, isolate, highlight, and copy operations
- **Multi-Chain Support** - Smart defaults and chain filtering for large structures
- **Persistent Highlighting** - Selections survive mouse interaction with the 3D viewer

### 🔬 **Molstar Integration**
- **Official APIs** - Built on Molstar 5.0 with proper lifecycle management
- **Chain Operations** - Hide, isolate, and show specific chains
- **Component Removal** - Toggle water, ligands, and ions with visual feedback
- **Bulletproof Camera** - Automatic focusing after isolation operations

### 🎨 **Modern UI**
- **Accordion Controls** - Collapsible structure and sequence control panels
- **Responsive Design** - Adapts to different screen sizes and container widths
- **Visual Feedback** - Loading states, error handling, and operation confirmations

## 🏗️ **Architecture**

### **Directory Structure**

```
src/
├── blocks/                        # Feature-based components
│   ├── chat/                      # Chat interface
│   ├── protein/                   # Protein viewer and controls
│   └── sequence/                  # Sequence interface
├── lib/                           # Core libraries
│   ├── molstar/                   # Molstar integration
│   │   ├── molstarWrapper.ts      # Main Molstar API
│   │   ├── highlighting.ts        # Highlighting utilities
│   │   └── [operations]/          # Chain/structure operations
│   └── pdbSequenceApi.ts          # RCSB PDB data fetching
├── hooks/                         # React hooks
│   ├── useChatState.ts            # Chat state management
│   ├── usePanelResize.ts          # Layout resizing
│   └── usePdbSequence.ts          # PDB data fetching
├── types/                         # TypeScript definitions
│   ├── molstar.ts                 # Molstar types
│   └── sequence.ts                # Sequence types
└── config/                        # Configuration
    └── constants.ts               # App constants
```

### **Data Flow**

```
User Input (PDB ID)
    ↓
RCSB PDB API → Sequence Data
    ↓
Molstar Plugin → 3D Structure
    ↓
Sequence Selection → Structure Highlighting
    ↓
Right-Click Actions → Chain/Residue Operations
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- npm/yarn/pnpm

### **Installation**
```bash
git clone <repository-url>
cd dyno-structure
npm install
```

### **Development**
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint check
npm run format       # Prettier formatting
```

## 🧪 **Testing**

### **Recommended Test Structures**
- **1CRN** - Small structure (46 residues, 1 chain)
- **4HHB** - Hemoglobin (4 chains) 
- **7MT0** - AAV9 Capsid (60 chains, 1200+ residues)

## 🛠️ **Tech Stack**
- **Next.js 15** with Turbopack
- **React 19** with TypeScript 5
- **Molstar 5.0** for 3D visualization
- **Tailwind CSS 4** for styling

## 🔮 **Roadmap**
- ✅ **Phase 4 Complete** - Molstar integration & code quality
- 🚧 **Phase 5 Next** - LLM agent integration
- 🔮 **Future** - Advanced analytics and collaboration features

## 📄 **License**
[Add your license information here]
