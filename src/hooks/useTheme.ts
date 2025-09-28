import { useMemo } from 'react';
import themeConfig from '@/config/theme.json';

export function useTheme() {
  return useMemo(() => themeConfig, []);
}

export type Theme = typeof themeConfig;
