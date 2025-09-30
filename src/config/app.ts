/**
 * Application configuration
 * Centralized configuration for all app components
 */

import type { AppConfig } from '@/types';

/**
 * Default application configuration
 */
export const defaultAppConfig: AppConfig = {
  molstar: {
    layoutIsExpanded: false,
    layoutShowControls: false,
    layoutShowRemoteState: false,
    layoutShowSequence: false,
    layoutShowLog: false,
    layoutShowLeftPanel: false,
    viewportShowExpand: false,
    viewportShowSelectionMode: false,
    viewportShowAnimation: false,
    pdbProvider: 'https://www.ebi.ac.uk/pdbe/static/entry',
    emdbProvider: 'https://www.ebi.ac.uk/emdb/structures',
  },
  
  sequence: {
    residuesPerRow: 40,
    showRuler: true,
    showChainLabels: true,
    colorScheme: 'default',
    interactionMode: 'select',
    selectionMode: 'range',
    constraints: {
      maxSelections: 10,
      maxRangeSize: 1000,
    },
  },
  
  performance: {
    virtualization: {
      enabled: true,
      itemHeight: 20,
      overscan: 5,
      threshold: 1000,
    },
    debounceMs: 300,
    memoization: true,
    lazyLoading: true,
  },
  
  api: {
    baseUrl: 'https://www.ebi.ac.uk/pdbe/api',
    timeout: 30000,
    retries: 3,
  },
  
  logging: {
    level: 'info',
    enableConsole: true,
    enableRemote: false,
  },
};

/**
 * Environment-specific configuration overrides
 */
export const developmentConfig: Partial<AppConfig> = {
  logging: {
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
  },
};

export const productionConfig: Partial<AppConfig> = {
  logging: {
    level: 'warn',
    enableConsole: false,
    enableRemote: true,
  },
  performance: {
    virtualization: {
      enabled: true,
      itemHeight: 20,
      overscan: 3,
      threshold: 500,
    },
    debounceMs: 200,
    memoization: true,
    lazyLoading: true,
  },
};

/**
 * Get configuration for current environment
 */
export function getAppConfig(): AppConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  let config = { ...defaultAppConfig };
  
  if (isDevelopment) {
    config = { ...config, ...developmentConfig };
  } else if (isProduction) {
    config = { ...config, ...productionConfig };
  }
  
  return config;
}

/**
 * Validate configuration object
 */
export function validateConfig(config: Partial<AppConfig>): string[] {
  const errors: string[] = [];
  
  // Validate API configuration
  if (config.api) {
    if (config.api.timeout && config.api.timeout < 1000) {
      errors.push('API timeout must be at least 1000ms');
    }
    
    if (config.api.retries && (config.api.retries < 0 || config.api.retries > 10)) {
      errors.push('API retries must be between 0 and 10');
    }
  }
  
  // Validate sequence configuration
  if (config.sequence) {
    if (config.sequence.residuesPerRow && config.sequence.residuesPerRow < 10) {
      errors.push('Residues per row must be at least 10');
    }
    
    if (config.sequence.constraints?.maxSelections && config.sequence.constraints.maxSelections < 1) {
      errors.push('Max selections must be at least 1');
    }
  }
  
  // Validate performance configuration
  if (config.performance) {
    if (config.performance.debounceMs && config.performance.debounceMs < 0) {
      errors.push('Debounce time must be non-negative');
    }
    
    if (config.performance.virtualization?.threshold && config.performance.virtualization.threshold < 0) {
      errors.push('Virtualization threshold must be non-negative');
    }
  }
  
  return errors;
}
