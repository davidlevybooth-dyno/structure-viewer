import type { RepresentationType } from "@/lib/molstar/representation";

export const EXAMPLE_STRUCTURES = [
  { id: "1CRN", name: "Crambin", description: "Small plant protein" },
  { id: "1UBQ", name: "Ubiquitin", description: "Regulatory protein" },
  { id: "4HHB", name: "Hemoglobin", description: "Oxygen transport protein" },
  {
    id: "6M0J",
    name: "COVID-19 Spike Protein",
    description: "SARS-CoV-2 spike protein",
  },
  {
    id: "7MT0",
    name: "AAV9 Capsid",
    description: "Adeno-associated virus capsid",
  },
  { id: "1LYZ", name: "Lysozyme", description: "Antimicrobial enzyme" },
  {
    id: "1GFL",
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
