# Protein Sequence Components

PDB-specific sequence components that integrate with the standalone sequence interface library.

## Architecture

```
src/components/protein/sequence/
├── SequenceWorkspace.tsx    # UI orchestration & collapsible layout
├── SequenceViewer.tsx       # PDB data adapter & loading states  
├── ChainSelector.tsx        # Interactive chain multi-select
└── ChainTooltip.tsx         # Chain metadata tooltips
```

## Components

**`SequenceWorkspace`** - UI orchestration and layout management
- Collapsible interface with compact header
- Selection summary display
- Coordinates ChainSelector and SequenceViewer

**`SequenceViewer`** - PDB data adapter
- Fetches PDB data using `usePDBSequence`
- Transforms to generic sequence format
- Handles loading/error states

**`ChainSelector`** - Pure UI component
- Interactive pill-based multi-select
- Color-coded chains with pagination
- Tooltip integration

## Data Flow

```
SequenceWorkspace → SequenceViewer → SequenceInterface
```

## Usage

```tsx
// Full workspace with collapsible UI
<SequenceWorkspace
  pdbId="1CRN"
  selectedChainIds={['A']}
  onSelectionChange={handleSelection}
/>

// Just PDB data adapter
<SequenceViewer
  pdbId="1CRN"
  onSelectionChange={handleSelection}
/>
```
