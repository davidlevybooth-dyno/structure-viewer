"use client";

import React, { useEffect, useRef } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EyeOff, Focus, Eye, Copy } from 'lucide-react';
import type { SelectionRegion } from '../types';

interface SelectionContextMenuProps {
  position: { x: number; y: number };
  region: SelectionRegion;
  onAction: (action: 'hide' | 'isolate' | 'highlight' | 'copy') => void;
  onClose: () => void;
  isVisible: boolean;
}

/**
 * Context menu for sequence selections
 * Provides residue-level operations: hide, isolate, highlight, copy
 */
export function SelectionContextMenu({
  position,
  region,
  onAction,
  onClose,
  isVisible,
}: SelectionContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  // Adjust position to keep menu on screen
  const adjustedPosition = React.useMemo(() => {
    if (!isVisible) return position;

    const menuWidth = 200;
    const menuHeight = 160;
    const padding = 10;

    let { x, y } = position;

    // Adjust horizontal position
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Adjust vertical position
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  }, [position, isVisible]);

  if (!isVisible) return null;

  const handleAction = (action: 'hide' | 'isolate' | 'highlight' | 'copy') => {
    onAction(action);
    onClose();
  };

  const residueCount = region.end - region.start + 1;
  const regionLabel = `${region.chainId}:${region.start}-${region.end}`;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 min-w-[180px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-100">
        <div className="text-xs font-medium text-zinc-700">{regionLabel}</div>
        <div className="text-xs text-zinc-500">
          {residueCount} residue{residueCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <button
          onClick={() => handleAction('hide')}
          className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors"
        >
          <EyeOff className="h-4 w-4" />
          <span>Hide Selection</span>
        </button>

        <button
          onClick={() => handleAction('isolate')}
          className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2 transition-colors"
        >
          <Focus className="h-4 w-4" />
          <span>Isolate Selection</span>
        </button>

        <button
          onClick={() => handleAction('highlight')}
          className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-2 transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span>Highlight Selection</span>
        </button>

        <div className="border-t border-zinc-100 my-1" />

        <button
          onClick={() => handleAction('copy')}
          className="w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
        >
          <Copy className="h-4 w-4" />
          <span>Copy Sequence</span>
        </button>
      </div>
    </div>
  );
}
