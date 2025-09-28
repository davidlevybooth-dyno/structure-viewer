interface ErrorDisplayProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Reusable error display component
 */
export function ErrorDisplay({ 
  error, 
  title = 'Error',
  onRetry,
  className = '' 
}: ErrorDisplayProps) {
  return (
    <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
      <div className="text-center p-8">
        <div className="text-red-500 text-lg font-semibold mb-2">
          {title}
        </div>
        <div className="text-gray-600 text-sm mb-4">
          {error}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
