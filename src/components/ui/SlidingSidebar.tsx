import React, { useState } from 'react';

interface SlidingSidebarProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function SlidingSidebar({ 
  children, 
  defaultOpen = true, 
  className = '' 
}: SlidingSidebarProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${className}
      `}>
        {/* Toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-10 top-4 bg-white shadow-md rounded-r-md p-2 hover:bg-gray-50 transition-colors"
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {/* Sidebar content */}
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

export default SlidingSidebar;
