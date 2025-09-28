"use client";

import React from "react";
import { StructureWorkspace } from "../workspace/StructureWorkspace";
import { DEFAULT_STRUCTURE_ID } from "@/config/constants";

export function ProteinViewer() {
  return (
    <StructureWorkspace
      initialPdbId={DEFAULT_STRUCTURE_ID}
      className="h-full"
    />
  );
}
