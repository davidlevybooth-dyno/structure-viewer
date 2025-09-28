import React from "react";
import type { SequenceSelection, SelectionRegion, RegionAction } from "./types";

interface SelectionSummaryProps {
  selection: SequenceSelection;
  onClearSelection: () => void;
  onRegionAction?: (
    region: SelectionRegion | null,
    action: RegionAction,
  ) => void;
  onCopy?: (text: string) => Promise<void>;
  readOnly?: boolean;
}

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "copy" | "clear";
  title?: string;
}

function ActionButton({
  onClick,
  children,
  variant = "copy",
  title,
}: ActionButtonProps) {
  const baseClasses =
    "text-xs transition-colors px-1.5 py-0.5 rounded whitespace-nowrap";
  const variantClasses =
    variant === "copy"
      ? "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
      : "text-gray-600 hover:text-red-600 hover:bg-red-50";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses}`}
      title={title}
    >
      {children}
    </button>
  );
}

const sortRegions = (regions: SelectionRegion[]) =>
  [...regions].sort((a, b) =>
    a.chainId === b.chainId
      ? a.start - b.start
      : a.chainId.localeCompare(b.chainId),
  );

export function SelectionSummary({
  selection,
  onClearSelection,
  onRegionAction,
  onCopy,
  readOnly = false,
}: SelectionSummaryProps) {
  if (selection.regions.length === 0) return null;

  const sortedRegions = sortRegions(selection.regions);
  const totalResidues = selection.regions.reduce(
    (sum, region) => sum + (region.end - region.start + 1),
    0,
  );

  const handleCopyAll = async () => {
    const allSequences = sortedRegions.map((r) => r.sequence).join("");
    try {
      await onCopy?.(allSequences);
      onRegionAction?.(null, "copy");
    } catch (error) {
      console.warn("Failed to copy:", error);
    }
  };

  const handleCopyRegion = async (region: SelectionRegion) => {
    try {
      await onCopy?.(region.sequence);
      onRegionAction?.(region, "copy");
    } catch (error) {
      console.warn("Failed to copy:", error);
    }
  };

  const isMultiple = selection.regions.length > 1;

  return (
    <div className="border-t bg-gray-50 px-6 py-3 mb-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          {isMultiple ? (
            <>
              <div className="flex flex-wrap items-start gap-2 mb-2">
                {sortedRegions.map((region, index) => (
                  <span
                    key={region.id}
                    className="text-sm font-mono text-gray-700 break-words"
                  >
                    <span className="font-medium">{region.label}:</span>
                    <span className="ml-1">{region.sequence}</span>
                    {index < sortedRegions.length - 1 && (
                      <span className="text-gray-400 ml-2">|</span>
                    )}
                  </span>
                ))}
              </div>
              <div className="text-xs text-gray-500">
                {selection.regions.length} regions, {totalResidues} residues
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-gray-700 break-words">
                {sortedRegions[0].label}: {sortedRegions[0].sequence}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                ({totalResidues} residue{totalResidues !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-start gap-2 flex-shrink-0">
            {isMultiple ? (
              <ActionButton onClick={handleCopyAll} title="Copy all sequences">
                Copy All
              </ActionButton>
            ) : (
              <ActionButton
                onClick={() => handleCopyRegion(sortedRegions[0])}
                title="Copy sequence"
              >
                Copy
              </ActionButton>
            )}
            <ActionButton
              onClick={onClearSelection}
              variant="clear"
              title="Clear selection"
            >
              Clear
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}
