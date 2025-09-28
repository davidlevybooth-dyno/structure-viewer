import React from "react";

interface AgentPlaceholderProps {
  className?: string;
}

export function AgentPlaceholder({ className = "" }: AgentPlaceholderProps) {
  return (
    <div className={`mt-8 pt-6 border-t border-gray-200 ${className}`}>
      <h3 className="text-md font-medium text-gray-700 mb-3">AI Agent</h3>
      <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <p className="text-sm text-gray-500">Agent interface will go here</p>
          <p className="text-xs text-gray-400 mt-1">
            Natural language commands for structure analysis
          </p>
        </div>
      </div>
    </div>
  );
}

export default AgentPlaceholder;
