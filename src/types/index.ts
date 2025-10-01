/**
 * Centralized type exports for the entire application
 * Single source of truth for all type definitions
 */

// Core application types
export * from "./molstar";
export * from "./sequence";

// Common utility types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    requestId: string;
    timestamp: number;
    duration?: number;
  };
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorBoundary?: boolean;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  id?: string;
  "data-testid"?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

// Configuration types
export interface AppConfig {
  molstar: import("./molstar").MolstarConfig;
  sequence: import("./sequence").SequenceConfig;
  performance: import("./sequence").SequencePerformanceConfig;
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    enableConsole: boolean;
    enableRemote: boolean;
  };
}

// Event system types
export type EventType =
  | import("./molstar").MolstarEventType
  | import("./sequence").SequenceEventType
  | "app-initialized"
  | "config-changed"
  | "error-boundary-triggered";

export interface AppEvent<T = unknown> {
  type: EventType;
  timestamp: number;
  source: string;
  data?: T;
}

export type EventCallback<T = unknown> = (event: AppEvent<T>) => void;

// State management types
export interface AppState {
  initialized: boolean;
  config: AppConfig;
  molstar: import("./molstar").MolstarState;
  sequence: import("./sequence").SelectionState;
  ui: {
    sidebarOpen: boolean;
    activePanel: string;
    theme: "light" | "dark";
  };
  errors: ErrorState[];
}

// Hook return types
export interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export interface UseDebounceResult<T> {
  debouncedValue: T;
  isDebouncing: boolean;
}

// Validation types
export interface ValidationRule<T = any> {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: T) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormField<T = any> {
  value: T;
  rules: ValidationRule<T>[];
  touched: boolean;
  error?: string;
}
