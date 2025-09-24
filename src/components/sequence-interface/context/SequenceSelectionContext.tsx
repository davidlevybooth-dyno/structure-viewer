'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  SequenceInterfaceState,
  SequenceInterfaceAction,
  SequenceSelection,
  SelectionRegion,
  SequenceResidue,
  SequenceData,
  SequenceInterfaceConfig,
} from '../types';

// Default configuration
const DEFAULT_CONFIG: SequenceInterfaceConfig = {
  residuesPerRow: 50,
  showPositions: true,
  showChainLabels: true,
  colorScheme: 'default',
  selectionMode: 'range',
  enableCopyPaste: true,
  showScrollIndicators: true,
  numberingInterval: 5, // Show numbers every 5 residues
};

// Initial state
const initialState: SequenceInterfaceState = {
  data: { id: '', name: '', chains: [] },
  config: DEFAULT_CONFIG,
  selection: {
    regions: [],
    activeRegion: null,
    clipboard: null,
  },
  highlightedResidues: [],
  isLoading: false,
  error: null,
};

// Reducer function
function sequenceInterfaceReducer(
  state: SequenceInterfaceState,
  action: SequenceInterfaceAction
): SequenceInterfaceState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        selection: { regions: [], activeRegion: null, clipboard: state.selection.clipboard },
        error: null,
      };

    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    case 'SET_SELECTION':
      return {
        ...state,
        selection: action.payload,
      };

    case 'ADD_SELECTION_REGION':
      const newRegion = action.payload;
      const existingRegions = state.selection.regions.filter(r => r.id !== newRegion.id);
      return {
        ...state,
        selection: {
          ...state.selection,
          regions: [...existingRegions, newRegion],
          activeRegion: newRegion.id,
        },
      };

    case 'REMOVE_SELECTION_REGION':
      const regionIdToRemove = action.payload;
      return {
        ...state,
        selection: {
          ...state.selection,
          regions: state.selection.regions.filter(r => r.id !== regionIdToRemove),
          activeRegion: state.selection.activeRegion === regionIdToRemove ? null : state.selection.activeRegion,
        },
      };

    case 'SET_ACTIVE_REGION':
      return {
        ...state,
        selection: {
          ...state.selection,
          activeRegion: action.payload,
        },
      };

    case 'SET_HIGHLIGHTED_RESIDUES':
      return {
        ...state,
        highlightedResidues: action.payload,
      };

    case 'SET_CLIPBOARD':
      return {
        ...state,
        selection: {
          ...state.selection,
          clipboard: action.payload,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context type
interface SequenceSelectionContextType {
  state: SequenceInterfaceState;
  dispatch: React.Dispatch<SequenceInterfaceAction>;
  // Convenience methods
  setData: (data: SequenceData) => void;
  updateConfig: (config: Partial<SequenceInterfaceConfig>) => void;
  addSelectionRegion: (region: SelectionRegion) => void;
  removeSelectionRegion: (regionId: string) => void;
  setActiveRegion: (regionId: string | null) => void;
  setHighlightedResidues: (residues: SequenceResidue[]) => void;
  clearSelection: () => void;
  replaceSelection: (region: SelectionRegion) => void;
  copyToClipboard: (text: string) => void;
  getSelectionSequence: (region: SelectionRegion) => string;
}

// Create context
const SequenceSelectionContext = createContext<SequenceSelectionContextType | undefined>(undefined);

// Local storage key
const STORAGE_KEY = 'sequence-interface-state';

// Provider component
export function SequenceSelectionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(sequenceInterfaceReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        // Only restore selection and config, not data
        dispatch({ type: 'UPDATE_CONFIG', payload: parsedState.config || {} });
        dispatch({ type: 'SET_SELECTION', payload: parsedState.selection || { regions: [], activeRegion: null, clipboard: null } });
      }
    } catch (error) {
      console.warn('Failed to load sequence interface state from localStorage:', error);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      const stateToSave = {
        config: state.config,
        selection: state.selection,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save sequence interface state to localStorage:', error);
    }
  }, [state.config, state.selection]);

  // Convenience methods
  const setData = useCallback((data: SequenceData) => {
    dispatch({ type: 'SET_DATA', payload: data });
  }, []);

  const updateConfig = useCallback((config: Partial<SequenceInterfaceConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: config });
  }, []);

  const addSelectionRegion = useCallback((region: SelectionRegion) => {
    dispatch({ type: 'ADD_SELECTION_REGION', payload: region });
  }, []);

  const removeSelectionRegion = useCallback((regionId: string) => {
    dispatch({ type: 'REMOVE_SELECTION_REGION', payload: regionId });
  }, []);

  const setActiveRegion = useCallback((regionId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_REGION', payload: regionId });
  }, []);

  const setHighlightedResidues = useCallback((residues: SequenceResidue[]) => {
    dispatch({ type: 'SET_HIGHLIGHTED_RESIDUES', payload: residues });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTION', payload: { regions: [], activeRegion: null, clipboard: state.selection.clipboard } });
  }, [state.selection.clipboard]);

  const replaceSelection = useCallback((region: SelectionRegion) => {
    dispatch({ type: 'SET_SELECTION', payload: { regions: [region], activeRegion: region.id, clipboard: state.selection.clipboard } });
  }, [state.selection.clipboard]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      dispatch({ type: 'SET_CLIPBOARD', payload: text });
    }).catch((error) => {
      console.warn('Failed to copy to clipboard:', error);
    });
  }, []);

  const getSelectionSequence = useCallback((region: SelectionRegion) => {
    const chain = state.data.chains.find(c => c.id === region.chainId);
    if (!chain) return '';
    
    const residues = chain.residues.filter(r => r.position >= region.start && r.position <= region.end);
    return residues.map(r => r.code).join('');
  }, [state.data]);

  const contextValue: SequenceSelectionContextType = {
    state,
    dispatch,
    setData,
    updateConfig,
    addSelectionRegion,
    removeSelectionRegion,
    setActiveRegion,
    setHighlightedResidues,
    clearSelection,
    replaceSelection,
    copyToClipboard,
    getSelectionSequence,
  };

  return (
    <SequenceSelectionContext.Provider value={contextValue}>
      {children}
    </SequenceSelectionContext.Provider>
  );
}

// Hook to use the context
export function useSequenceSelection() {
  const context = useContext(SequenceSelectionContext);
  if (context === undefined) {
    throw new Error('useSequenceSelection must be used within a SequenceSelectionProvider');
  }
  return context;
}
