# Dyno Structure Viewer

A molecular structure viewer built with Molstar 5.0 and React, featuring an interactive sequence interface and chain manipulation tools.

## What it does

This application provides a web-based interface for viewing and analyzing protein structures from the Protein Data Bank (PDB). It combines 3D molecular visualization with an interactive sequence viewer that allows you to select, highlight, and manipulate specific regions of proteins.

## Key features

- **3D Structure Visualization** - Uses Molstar 5.0 for rendering molecular structures
- **Interactive Sequence Interface** - Click and drag to select amino acid residues
- **Chain Operations** - Hide, isolate, or show specific protein chains
- **Component Management** - Toggle visibility of water molecules, ligands, and ions
- **Persistent Highlighting** - Sequence selections remain highlighted during 3D interaction
- **Right-click Context Menu** - Quick access to hide, isolate, highlight, and copy operations

## Architecture

```
src/
├── blocks/                        # Feature-based components
│   ├── chat/                      # Chat interface
│   ├── protein/                   # Protein viewer and controls
│   └── sequence/                  # Sequence interface
├── lib/                           # Core libraries
│   ├── molstar/                   # Molstar integration
│   └── pdbSequenceApi.ts          # PDB data fetching
├── hooks/                         # React hooks
├── types/                         # TypeScript definitions
└── config/                        # Configuration
```

## Getting started

### Prerequisites
- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation
```bash
git clone <repository-url>
cd dyno-structure
npm install
```

### Development
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run linting
npm run format       # Format code with Prettier
```

The application will be available at `http://localhost:3000`.

## Testing

Try these PDB structures to test different features:
- **1CRN** - Small structure (46 residues, 1 chain)
- **4HHB** - Hemoglobin (4 chains) 
- **7MT0** - AAV9 Capsid (60 chains, 1200+ residues)

## Technology stack

- Next.js 15 with Turbopack
- React 19 with TypeScript 5
- Molstar 5.0 for 3D visualization
- Tailwind CSS 4 for styling

## License

[Add your license information here]