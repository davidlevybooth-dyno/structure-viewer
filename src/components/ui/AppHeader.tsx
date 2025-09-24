import React from 'react';

interface AppHeaderProps {
  isViewerReady: boolean;
  className?: string;
}

export function AppHeader({ isViewerReady, className = '' }: AppHeaderProps) {
  return (
    <header className={`bg-white shadow-sm border-b ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Dyno Structure Viewer
          </h1>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
