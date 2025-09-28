# AI Assistant UI Architecture

## Overview

This is a production-ready, modular AI Assistant interface built with React, TypeScript, and modern best practices. The architecture emphasizes clean separation of concerns, reusability, and maintainability.

## Directory Structure

```
src/
├── components/           # React components
│   ├── chat/            # Chat-specific components
│   ├── layout/          # Layout components
│   ├── ui/              # Reusable UI components
│   └── AIAssistantUI.tsx # Main component
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── index.ts files       # Clean exports
```

## Key Components

### `AIAssistantUI`

Main component that orchestrates the entire interface. Minimal and focused on composition.

### `ChatContainer`

Provides chat state management and keyboard shortcuts to child components using render props pattern.

### `ResizableLayout`

Handles the resizable panel layout with persistence. Completely reusable.

### `AppLayout`

Root layout wrapper that provides consistent styling and constraints.

## Custom Hooks

### `useChatState`

Manages all chat-related state including conversations, messages, and UI state.

### `usePanelResize`

Handles resizable panel logic with localStorage persistence.

### `useKeyboardShortcuts`

Manages keyboard shortcuts in a declarative way.

### `useLocalStorage`

Type-safe localStorage hook with error handling.

## Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Components are composed together
3. **Custom Hooks**: Logic is extracted into reusable hooks
4. **Type Safety**: Full TypeScript coverage with proper interfaces
5. **Error Handling**: Graceful error handling throughout
6. **Performance**: Proper memoization and optimization

## Usage

```tsx
import { AIAssistantUI } from "./components";

export default function App() {
  return <AIAssistantUI />;
}
```

## Extension Points

- Add new keyboard shortcuts in `ChatContainer`
- Extend chat state in `useChatState`
- Add new layout components in `layout/`
- Create new UI components in `ui/`
- Add utility functions in `utils/`

## Testing Strategy

Each component and hook is designed to be easily testable:

- Pure functions in utils
- Isolated custom hooks
- Components with clear props interfaces
- Minimal side effects
