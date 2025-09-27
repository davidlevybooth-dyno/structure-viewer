import { useState, useEffect } from 'react';
import { getStorageItem, setStorageItem } from '../utils/storage';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => getStorageItem(key, defaultValue));

  useEffect(() => {
    setStorageItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
}
