"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Search,
  Download,
  Upload,
  Database,
  Check,
} from "lucide-react";
import { cls } from "../../data/utils";
import { EXAMPLE_STRUCTURES } from "@/config/constants";

interface PDBLoaderProps {
  currentPdbId?: string;
  onLoadStructure: (pdbId: string) => void;
  isLoading?: boolean;
}

export function PDBLoader({
  currentPdbId,
  onLoadStructure,
  isLoading,
}: PDBLoaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState(currentPdbId || "");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter popular structures based on search
  const filteredStructures = EXAMPLE_STRUCTURES.filter(
    (structure) =>
      structure.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      structure.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      structure.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleLoadPDB = (pdbId: string) => {
    const cleanId = pdbId.toLowerCase().trim();
    if (cleanId && cleanId !== currentPdbId) {
      onLoadStructure(cleanId);
      setInputValue(cleanId);
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (inputValue.trim()) {
        handleLoadPDB(inputValue.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="relative">
      {/* Main PDB Input */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-md min-w-[160px] hover:border-zinc-300 transition-colors">
        <Database className="h-4 w-4 text-zinc-500" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          className="flex-1 text-sm font-mono uppercase bg-transparent border-none outline-none placeholder-zinc-400 cursor-text"
          placeholder="PDB ID"
          maxLength={4}
        />
        {isLoading ? (
          <div className="animate-spin h-3 w-3 border border-zinc-300 border-t-blue-500 rounded-full" />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex items-center justify-center w-6 h-6 -mr-1 hover:bg-zinc-100 rounded transition-colors cursor-pointer"
            title={isOpen ? "Close dropdown" : "Open dropdown"}
          >
            <ChevronDown
              className={cls(
                "h-4 w-4 text-zinc-400 transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-80 bg-white border border-zinc-200 rounded-lg shadow-lg">
          {/* Search Header */}
          <div className="p-3 border-b border-zinc-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search structures..."
              />
            </div>
          </div>

          {/* Popular Structures */}
          <div className="max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide px-2 py-1">
                Popular Structures
              </div>
              {filteredStructures.length > 0 ? (
                <div className="space-y-1">
                  {filteredStructures.map((structure) => (
                    <button
                      key={structure.id}
                      onClick={() => handleLoadPDB(structure.id)}
                      className={cls(
                        "w-full text-left p-2 rounded-md transition-colors group",
                        currentPdbId === structure.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-zinc-50",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-blue-600 uppercase">
                              {structure.id}
                            </span>
                            {currentPdbId === structure.id && (
                              <Check className="h-3 w-3 text-blue-600" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-zinc-900 truncate">
                            {structure.name}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">
                            {structure.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-zinc-500">
                  No structures found
                </div>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="p-3 border-t border-zinc-100 bg-zinc-50">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <button className="flex items-center gap-1 hover:text-zinc-700 transition-colors">
                <Upload className="h-3 w-3" />
                Upload File
              </button>
              <button className="flex items-center gap-1 hover:text-zinc-700 transition-colors">
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
