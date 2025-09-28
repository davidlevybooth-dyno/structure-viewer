import type { RepresentationType, ColorScheme } from '@/types/molstar';

export const EXAMPLE_STRUCTURES = [
  { id: '1CRN', name: 'Crambin', description: 'Small plant protein' },
  { id: '1UBQ', name: 'Ubiquitin', description: 'Regulatory protein' },
  { id: '4HHB', name: 'Hemoglobin', description: 'Oxygen transport protein' },
  { id: '6M0J', name: 'COVID-19 Spike Protein', description: 'SARS-CoV-2 spike protein' },
  { id: '7MT0', name: 'AAV9 Capsid', description: 'Adeno-associated virus capsid' },
  { id: '1LYZ', name: 'Lysozyme', description: 'Antimicrobial enzyme' },
  { id: '1GFL', name: 'Green Fluorescent Protein', description: 'Fluorescent marker protein' },
] as const;

// Default structure to load on app start
export const DEFAULT_STRUCTURE_ID = EXAMPLE_STRUCTURES[0].id;

export const REPRESENTATIONS: { value: RepresentationType; label: string }[] = [
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'ball-and-stick', label: 'Ball & Stick' },
  { value: 'spacefill', label: 'Space Fill' },
  { value: 'surface', label: 'Surface' },
  { value: 'line', label: 'Line' },
];

export const STYLE_REPRESENTATIONS = [
  { value: 'ribbon', label: 'Ribbon' },
  { value: 'tube', label: 'Tube' },
  { value: 'trace', label: 'Trace' },
] as const;

export const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: 'chain-id', label: 'By Chain' },
  { value: 'sequence-id', label: 'By Sequence' },
  { value: 'element-symbol', label: 'By Element' },
  { value: 'residue-name', label: 'By Residue' },
  { value: 'uniform', label: 'Uniform' },
];