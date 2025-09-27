'use client';

import { HeroUIProvider as HeroProvider } from '@heroui/react';
import { ThemeProvider } from 'next-themes';

interface HeroUIProviderProps {
  children: React.ReactNode;
}

export function HeroUIProvider({ children }: HeroUIProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      themes={['light', 'dark']}
      enableSystem={false}
    >
      <HeroProvider>
        {children}
      </HeroProvider>
    </ThemeProvider>
  );
}
