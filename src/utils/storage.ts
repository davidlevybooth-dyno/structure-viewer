/**
 * Local storage utilities with error handling and type safety
 */

/**
 * Safely get an item from localStorage with JSON parsing
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely set an item in localStorage with JSON stringification
 */
export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save to localStorage:`, error);
  }
}

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  PANEL_SIZES: 'panel-sizes',
  SIDEBAR_COLLAPSED: 'sidebar-collapsed',
  THEME: 'theme',
} as const;
