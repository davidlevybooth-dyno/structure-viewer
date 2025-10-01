import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { useSequenceSelection } from "./context/SequenceSelectionContext";
import { getResidueColor, getResidueInfo } from "@/lib/aminoAcidColors";
import { SelectionContextMenu } from "./components/SelectionContextMenu";
import type {
  SequenceData,
  SequenceSelection,
  SequenceResidue,
  SelectionRegion,
} from "./types";

const DEFAULT_RESIDUES_PER_ROW = 40;

interface ResidueGridProps {
  data: SequenceData;
  selection: SequenceSelection;
  highlightedResidues: SequenceResidue[];
  readOnly?: boolean;
  onRegionAction?: (
    region: SelectionRegion,
    action: "hide" | "isolate" | "highlight" | "copy",
  ) => void;
}

/**
 * Interactive sequence grid with drag selection and highlighting
 */
export const ResidueGrid = React.memo(function ResidueGrid({
  data,
  selection,
  highlightedResidues,
  readOnly = false,
  onRegionAction,
}: ResidueGridProps) {
  const {
    addSelectionRegion,
    setHighlightedResidues,
    copyToClipboard,
    getSelectionSequence,
    replaceSelection,
  } = useSequenceSelection();

  const [dragStart, setDragStart] = useState<{
    chainId: string;
    position: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragRegion, setDragRegion] = useState<SelectionRegion | null>(null);
  const [residuesPerRow, setResiduesPerRow] = useState(
    DEFAULT_RESIDUES_PER_ROW,
  );
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
    region: SelectionRegion;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Responsive residues per row calculation
  useEffect(() => {
    const updateResiduesPerRow = () => {
      if (gridRef.current) {
        const containerWidth = gridRef.current.clientWidth;
        const availableWidth = containerWidth - 24; // padding
        const residueWidth = 19; // 18px + 1px gap
        const calculatedResidues = Math.max(
          30,
          Math.floor(availableWidth / residueWidth),
        );

        if (calculatedResidues !== residuesPerRow) {
          setResiduesPerRow(calculatedResidues);
        }
      }
    };

    const timer = setTimeout(updateResiduesPerRow, 100);
    const resizeObserver = new ResizeObserver(() =>
      setTimeout(updateResiduesPerRow, 50),
    );

    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [residuesPerRow]);

  const residueKey = useCallback(
    (r: SequenceResidue) => `${r.chainId}:${r.position}`,
    [],
  );

  const regionsByChain = useMemo(() => {
    const byChain = new Map<string, SelectionRegion[]>();
    for (const region of selection.regions) {
      const existing = byChain.get(region.chainId) ?? [];
      existing.push(region);
      byChain.set(region.chainId, existing);
    }
    return byChain;
  }, [selection.regions]);

  const highlightedSet = useMemo(
    () => new Set(highlightedResidues.map(residueKey)),
    [highlightedResidues, residueKey],
  );

  const isResidueSelected = useCallback(
    (residue: SequenceResidue) => {
      const chainRegions = regionsByChain.get(residue.chainId);
      const inSelection =
        chainRegions?.some(
          (region: SelectionRegion) =>
            residue.position >= region.start && residue.position <= region.end,
        ) || false;

      const inDragRegion =
        dragRegion &&
        dragRegion.chainId === residue.chainId &&
        residue.position >= dragRegion.start &&
        residue.position <= dragRegion.end;

      return inSelection || !!inDragRegion;
    },
    [regionsByChain, dragRegion],
  );

  const isResidueHighlighted = useCallback(
    (residue: SequenceResidue) => {
      return highlightedSet.has(residueKey(residue));
    },
    [highlightedSet, residueKey],
  );

  const getResidueRegion = useCallback(
    (residue: SequenceResidue) => {
      const chainRegions = regionsByChain.get(residue.chainId);
      return chainRegions?.find(
        (region: SelectionRegion) =>
          residue.position >= region.start && residue.position <= region.end,
      );
    },
    [regionsByChain],
  );

  const handleResidueClick = useCallback(
    (residue: SequenceResidue, event: React.MouseEvent) => {
      if (readOnly) return;
      event.preventDefault();

      const newRegion: SelectionRegion = {
        id: `${residue.chainId}-${residue.position}`,
        chainId: residue.chainId,
        start: residue.position,
        end: residue.position,
        sequence: residue.code,
        label: `${residue.chainId}:${residue.position}`,
      };
      addSelectionRegion(newRegion);
    },
    [readOnly, addSelectionRegion],
  );

  const handleResidueRightClick = useCallback(
    (residue: SequenceResidue, event: React.MouseEvent) => {
      if (readOnly || !onRegionAction) return;
      event.preventDefault();
      event.stopPropagation();

      // Find if this residue is part of an existing selection
      const existingRegion = getResidueRegion(residue);

      if (existingRegion) {
        // Show context menu for existing selection WITHOUT changing the selection
        setContextMenu({
          position: { x: event.clientX, y: event.clientY },
          region: existingRegion,
        });
      } else {
        // Create a single-residue selection and show context menu
        const newRegion: SelectionRegion = {
          id: `${residue.chainId}-${residue.position}`,
          chainId: residue.chainId,
          start: residue.position,
          end: residue.position,
          sequence: residue.code,
          label: `${residue.chainId}:${residue.position}`,
        };

        replaceSelection(newRegion);
        setContextMenu({
          position: { x: event.clientX, y: event.clientY },
          region: newRegion,
        });
      }
    },
    [readOnly, onRegionAction, getResidueRegion, replaceSelection],
  );

  const handleContextMenuAction = useCallback(
    (action: "hide" | "isolate" | "highlight" | "copy") => {
      if (!contextMenu) return;

      const { region } = contextMenu;

      if (action === "copy") {
        // Handle copy action locally
        const sequence = getSelectionSequence(region);
        copyToClipboard(sequence);
      } else {
        // Pass other actions to parent
        onRegionAction?.(region, action);
      }
    },
    [contextMenu, onRegionAction, getSelectionSequence, copyToClipboard],
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const [isAddMode, setIsAddMode] = useState(false);

  const handleMouseDown = useCallback(
    (residue: SequenceResidue) => {
      if (readOnly || contextMenu) return; // Don't start drag if context menu is open

      setIsDragging(true);
      setDragStart(residue);

      const initialDragRegion: SelectionRegion = {
        id: `drag-${residue.chainId}-${residue.position}`,
        chainId: residue.chainId,
        start: residue.position,
        end: residue.position,
        sequence: residue.code,
        label: `${residue.chainId}:${residue.position}`,
      };
      setDragRegion(initialDragRegion);
    },
    [readOnly, contextMenu],
  );

  const handleMouseEnter = useCallback(
    (residue: SequenceResidue) => {
      if (contextMenu) return; // Don't drag if context menu is open
      if (isDragging && dragStart && dragStart.chainId === residue.chainId) {
        const start = Math.min(dragStart.position, residue.position);
        const end = Math.max(dragStart.position, residue.position);

        const chain = data.chains.find((c) => c.id === residue.chainId);
        if (chain) {
          const residuesInRange = chain.residues.filter(
            (r) => r.position >= start && r.position <= end,
          );
          const sequence = residuesInRange.map((r) => r.code).join("");

          const newDragRegion: SelectionRegion = {
            id: `drag-${residue.chainId}-${start}-${end}`,
            chainId: residue.chainId,
            start,
            end,
            sequence,
            label: `${residue.chainId}:${start}-${end}`,
          };

          setDragRegion(newDragRegion);
        }
      } else if (!isDragging && !readOnly) {
        setHighlightedResidues([residue]);
      }
    },
    [
      isDragging,
      dragStart,
      data.chains,
      setHighlightedResidues,
      readOnly,
      contextMenu,
    ],
  );

  const handleMouseUp = useCallback(() => {
    // Don't modify selection if context menu is open
    if (contextMenu) {
      setIsDragging(false);
      setDragStart(null);
      setDragRegion(null);
      return;
    }

    if (dragRegion) {
      if (isAddMode) {
        addSelectionRegion(dragRegion);
      } else {
        replaceSelection(dragRegion);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragRegion(null);
  }, [
    dragRegion,
    isAddMode,
    addSelectionRegion,
    replaceSelection,
    contextMenu,
  ]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging && !readOnly && !contextMenu) {
      setHighlightedResidues([]);
    }
  }, [isDragging, setHighlightedResidues, readOnly, contextMenu]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey) setIsAddMode(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.shiftKey) setIsAddMode(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseUp]);

  const handleDoubleClick = useCallback(
    async (residue: SequenceResidue) => {
      if (readOnly) return;

      const region = getResidueRegion(residue);
      if (region) {
        const sequence = getSelectionSequence(region);
        try {
          await copyToClipboard(sequence);
        } catch (error) {
          console.warn("Failed to copy sequence:", error);
        }
      }
    },
    [readOnly, getResidueRegion, getSelectionSequence, copyToClipboard],
  );

  return (
    <div
      ref={gridRef}
      className="sequence-grid p-6 overflow-hidden select-none"
      onMouseLeave={handleMouseLeave}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {data.chains.map((chain) => {
        // Split residues into rows using dynamic residuesPerRow
        const rows: SequenceResidue[][] = [];
        for (let i = 0; i < chain.residues.length; i += residuesPerRow) {
          rows.push(chain.residues.slice(i, i + residuesPerRow));
        }

        return (
          <div key={chain.id} className="chain-section mb-8">
            <div className="chain-header mb-2 pb-1 border-b border-gray-200">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xs font-medium text-gray-600">
                  Chain {chain.id}
                  {chain.name && (
                    <span className="text-gray-500 ml-1 font-normal text-xs">
                      ({chain.name})
                    </span>
                  )}
                </h3>
                <div className="text-xs text-gray-500">
                  {chain.residues.length} residues
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="sequence-row">
                  <div className="mb-1">
                    <div
                      className="text-xs text-gray-400 text-center"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${row.length}, 18px)`,
                        gap: "1px",
                        fontSize: "10px",
                      }}
                    >
                      {row.map((residue, i) => (
                        <span
                          key={i}
                          className="text-center overflow-hidden text-ellipsis whitespace-nowrap"
                          style={{ width: "18px" }}
                        >
                          {residue.position % 2 === 1 ? residue.position : ""}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${row.length}, 18px)`,
                      gap: "1px",
                    }}
                  >
                    {row.map((residue) => {
                      const selected = isResidueSelected(residue);
                      const highlighted = isResidueHighlighted(residue);
                      const region = getResidueRegion(residue);
                      const residueInfo = getResidueInfo(residue.code);

                      return (
                        <div
                          key={`${residue.chainId}-${residue.position}`}
                          className={`
                            flex items-center justify-center font-mono
                            transition-all duration-150 text-white font-medium
                            ${readOnly ? "cursor-default" : "cursor-pointer"}
                          `}
                          style={{
                            width: "18px",
                            height: "18px",
                            fontSize: "11px",
                            backgroundColor: selected
                              ? "#000000"
                              : highlighted
                                ? "#245F73"
                                : getResidueColor(residue.code, "default"),
                          }}
                          onClick={(e) => handleResidueClick(residue, e)}
                          onContextMenu={(e) =>
                            handleResidueRightClick(residue, e)
                          }
                          onMouseDown={() => handleMouseDown(residue)}
                          onMouseEnter={() => handleMouseEnter(residue)}
                          onMouseLeave={handleMouseLeave}
                          onDoubleClick={() => handleDoubleClick(residue)}
                          title={`${residueInfo.name} (${residue.code}${residue.position}) - Chain ${residue.chainId}${region ? ` - Region: ${region.label}` : ""}`}
                        >
                          {residue.code}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu && (
        <SelectionContextMenu
          position={contextMenu.position}
          region={contextMenu.region}
          onAction={handleContextMenuAction}
          onClose={handleCloseContextMenu}
          isVisible={true}
        />
      )}
    </div>
  );
});
