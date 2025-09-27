import { useCallback, useState, useEffect, useMemo } from 'react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../utils/storage';

interface UsePanelResizeOptions {
  defaultSizes?: [number, number];
  minSize?: number;
  maxSize?: number;
}

export function usePanelResize(options: UsePanelResizeOptions = {}) {
  const { defaultSizes = [30, 70], minSize = 20, maxSize = 60 } = options;
  
  // Memoize default sizes to prevent re-renders
  const memoizedDefaults = useMemo(() => defaultSizes, [defaultSizes[0], defaultSizes[1]]);
  
  // Initialize with default sizes to avoid hydration mismatch
  const [panelSizes, setPanelSizes] = useState<[number, number]>(memoizedDefaults);

  // Load from localStorage after component mounts (client-side only)
  useEffect(() => {
    const savedSizes = getStorageItem(STORAGE_KEYS.PANEL_SIZES, memoizedDefaults);
    setPanelSizes(savedSizes);
  }, []); // Empty dependency - only run once on mount

  const handleResize = useCallback((sizes: number[]) => {
    const newSizes: [number, number] = [sizes[0], sizes[1]];
    setPanelSizes(newSizes);
    setStorageItem(STORAGE_KEYS.PANEL_SIZES, newSizes);
  }, []);

  const collapseSidebar = useCallback(() => {
    handleResize([minSize, 100 - minSize]);
  }, [handleResize, minSize]);

  const expandSidebar = useCallback(() => {
    handleResize([40, 60]);
  }, [handleResize]);

  return {
    panelSizes,
    handleResize,
    collapseSidebar,
    expandSidebar,
    constraints: { minSize, maxSize },
  };
}
