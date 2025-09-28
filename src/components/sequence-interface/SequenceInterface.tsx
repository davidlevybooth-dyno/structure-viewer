"use client";

import React from "react";
import { SequenceSelectionProvider } from "./context/SequenceSelectionContext";
import { ResidueGrid } from "./ResidueGrid";
import { SelectionSummary } from "./SelectionSummary";
import { SequenceHeader } from "./components/SequenceHeader";
import { ErrorState, LoadingState } from "./components/ErrorStates";
import { useSequenceInterface } from "./hooks/useSequenceInterface";
import { cn } from "./utils/cn";
import type { SequenceInterfaceProps } from "./types";

function SequenceInterfaceInternal({
  className = "",
  readOnly = false,
  callbacks,
  ...rest
}: SequenceInterfaceProps) {
  const { state, clearSelection, copyToClipboard } = useSequenceInterface({
    readOnly,
    callbacks,
    ...rest,
  });

  if (state.isLoading) {
    return <LoadingState className={className} />;
  }

  if (state.error) {
    return <ErrorState error={state.error} className={className} />;
  }

  return (
    <section
      className={cn("sequence-interface bg-white", className)}
      aria-label="Protein sequence interface"
    >
      <SequenceHeader
        data={state.data}
        selection={state.selection}
        readOnly={readOnly}
      />

      <ResidueGrid
        data={state.data}
        selection={state.selection}
        highlightedResidues={state.highlightedResidues}
        readOnly={readOnly}
      />

      {state.selection.regions.length > 0 && (
        <SelectionSummary
          selection={state.selection}
          onClearSelection={clearSelection}
          onRegionAction={callbacks?.onRegionAction}
          onCopy={copyToClipboard}
          readOnly={readOnly}
        />
      )}
    </section>
  );
}

export function SequenceInterface(props: SequenceInterfaceProps) {
  return (
    <SequenceSelectionProvider>
      <SequenceInterfaceInternal {...props} />
    </SequenceSelectionProvider>
  );
}
