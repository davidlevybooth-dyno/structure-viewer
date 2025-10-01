import React from "react";

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className = "" }: LoadingStateProps) {
  return (
    <div className={`p-8 text-center ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading sequence data...</p>
    </div>
  );
}

interface ErrorStateProps {
  error: string;
  className?: string;
}

export function ErrorState({ error, className = "" }: ErrorStateProps) {
  return (
    <div className={`p-8 text-center ${className}`}>
      <div className="mb-4 text-red-500">
        <svg
          className="mx-auto h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-red-900 mb-2">
        Error Loading Sequence
      </h3>
      <p className="text-sm text-red-700">{error}</p>
    </div>
  );
}

interface EmptyStateProps {
  className?: string;
}

export function EmptyState({ className = "" }: EmptyStateProps) {
  return (
    <div className={`p-8 text-center text-gray-500 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Sequence Data
        </h3>
        <p className="text-sm text-gray-600">
          Load a structure to view sequence interface
        </p>
      </div>
    </div>
  );
}
