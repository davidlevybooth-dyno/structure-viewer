"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { REPRESENTATIONS } from "@/config/constants";
import type { MolstarRepresentationAPI } from "@/lib/molstar/representation";

interface RepresentationSelectorProps {
  api: MolstarRepresentationAPI | null;
  currentRepresentation: string;
  onRepresentationChange: (repType: string) => void;
}

export function RepresentationSelector({
  api,
  currentRepresentation,
  onRepresentationChange,
}: RepresentationSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleRepresentationClick = (repType: string) => {
    onRepresentationChange(repType);
    setIsExpanded(false);
  };

  const currentRepLabel =
    REPRESENTATIONS.find((r) => r.value === currentRepresentation)?.label ||
    "Cartoon";

  return (
    <div className="space-y-1">
      {/* Representation Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-2 py-1 text-sm hover:bg-zinc-50 rounded transition-colors"
      >
        <span className="font-medium text-zinc-700">Representation</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">{currentRepLabel}</span>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-zinc-400" />
          ) : (
            <ChevronRight className="h-3 w-3 text-zinc-400" />
          )}
        </div>
      </button>

      {/* Representation Options */}
      {isExpanded && (
        <div className="ml-4 space-y-0.5">
          {REPRESENTATIONS.map((rep) => (
            <button
              key={rep.value}
              onClick={() => handleRepresentationClick(rep.value)}
              disabled={!api}
              className={`block w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                currentRepresentation === rep.value
                  ? "bg-zinc-200 text-zinc-900 font-medium"
                  : "hover:bg-zinc-50 disabled:opacity-50"
              }`}
            >
              {rep.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
