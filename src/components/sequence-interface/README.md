# Sequence Interface

A standalone, reusable React component library for displaying and interacting with protein sequences.

## Architecture

```
src/components/sequence-interface/
├── SequenceInterface.tsx          # Main component
├── ResidueGrid.tsx               # Interactive sequence grid
├── SelectionSummary.tsx          # Selection display
├── context/SequenceSelectionContext.tsx  # State management
├── hooks/useSequenceInterface.ts # Business logic
└── types.ts                      # TypeScript definitions
```

## Usage

```tsx
import { SequenceInterface } from '@/components/sequence-interface';

<SequenceInterface 
  data={sequenceData}
  selectedChainIds={['A', 'B']}
  onChainSelectionChange={setSelectedChains}
  callbacks={{
    onSelectionChange: handleSelection,
    onHighlightChange: handleHighlight
  }}
/>
```

## Key Features

- **Multi-region selection**: Drag to select sequence ranges
- **Chain filtering**: Show/hide specific protein chains  
- **Copy/export**: One-click sequence copying
- **Responsive**: Auto-adjusts layout to container width
- **Type-safe**: Full TypeScript support
- **Standalone**: No external dependencies, library-ready

## Core Types

```typescript
interface SequenceData {
  id: string;
  name: string;
  chains: SequenceChain[];
}

interface SequenceSelection {
  regions: SelectionRegion[];
  activeRegion: string | null;
}
```