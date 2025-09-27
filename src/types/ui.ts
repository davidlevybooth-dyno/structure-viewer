/**
 * UI-specific types and interfaces
 */

import { ReactNode } from 'react';

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export interface ResizeHandleProps {
  className?: string;
}

export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  action: () => void;
  description: string;
}
