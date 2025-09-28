"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';

interface MolstarContextValue {
  plugin: PluginUIContext | null;
  setPlugin: (plugin: PluginUIContext | null) => void;
  isReady: boolean;
  setIsReady: (ready: boolean) => void;
}

const MolstarContext = createContext<MolstarContextValue | null>(null);

interface MolstarProviderProps {
  children: React.ReactNode;
}

export function MolstarProvider({ children }: MolstarProviderProps) {
  const [plugin, setPluginState] = useState<PluginUIContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  const setPlugin = useCallback((newPlugin: PluginUIContext | null) => {
    setPluginState(newPlugin);
    setIsReady(!!newPlugin);
  }, []);

  const value: MolstarContextValue = {
    plugin,
    setPlugin,
    isReady,
    setIsReady,
  };

  return (
    <MolstarContext.Provider value={value}>
      {children}
    </MolstarContext.Provider>
  );
}

export function useMolstar() {
  const context = useContext(MolstarContext);
  if (!context) {
    throw new Error('useMolstar must be used within a MolstarProvider');
  }
  return context;
}
