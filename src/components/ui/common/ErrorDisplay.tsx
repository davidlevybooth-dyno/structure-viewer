/**
 * Simple error display component
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  className?: string;
}

export function ErrorDisplay({ error, className = '' }: ErrorDisplayProps) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm ${className}`}>
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
}