interface StatusIndicatorProps {
  isReady: boolean;
  currentStructure?: string;
  className?: string;
}

/**
 * Status indicator showing current viewer state
 */
export function StatusIndicator({ 
  isReady, 
  currentStructure,
  className = '' 
}: StatusIndicatorProps) {
  return (
    <div className={`absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded ${className}`}>
      {!isReady ? (
        'Initializing...'
      ) : currentStructure ? (
        `Loaded: ${currentStructure}`
      ) : (
        'Ready to load structures'
      )}
    </div>
  );
}
