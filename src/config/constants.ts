import type { RepresentationType } from "@/types/molstar";

export const EXAMPLE_STRUCTURES = [
  { id: "1crn", name: "Crambin", description: "Small plant protein" },
  { id: "1ubq", name: "Ubiquitin", description: "Regulatory protein" },
  {
    id: "4hhb",
    name: "Hemoglobin",
    description: "Oxygen transport protein (4 chains)",
  },
  {
    id: "1aon",
    name: "Aspartate Carbamoyltransferase",
    description: "Enzyme complex (12 chains)",
  },
  {
    id: "1pma",
    name: "20S Proteasome",
    description: "Protein degradation complex (28 chains)",
  },
  {
    id: "8oz0",
    name: "Human 48S Ribosomal Complex",
    description: "Ribosomal initiation complex (48 chains)",
  },
  {
    id: "9a86",
    name: "52-mer Gasdermin Pore",
    description: "Gasdermin pore complex (52 chains)",
  },
  {
    id: "6m0j",
    name: "COVID-19 Spike Protein",
    description: "SARS-CoV-2 spike protein",
  },
  {
    id: "7mt0",
    name: "AAV9 Capsid",
    description: "Adeno-associated virus capsid (60 chains)",
  },
  { id: "1lyz", name: "Lysozyme", description: "Antimicrobial enzyme" },
  {
    id: "1gfl",
    name: "Green Fluorescent Protein",
    description: "Fluorescent marker protein",
  },
] as const;

// Default structure to load on app start
export const DEFAULT_STRUCTURE_ID = EXAMPLE_STRUCTURES[0].id;

export const REPRESENTATIONS: { value: RepresentationType; label: string }[] = [
  { value: "cartoon", label: "Cartoon" },
  { value: "ball-and-stick", label: "Ball & Stick" },
  { value: "spacefill", label: "Space Fill" },
  { value: "molecular-surface", label: "Surface" },
  { value: "point", label: "Point" },
  { value: "backbone", label: "Backbone" },
];
