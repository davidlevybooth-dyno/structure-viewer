/**
 * Application constants
 */

import type { RepresentationType, ColorScheme } from '@/types/molstar';

export const EXAMPLE_STRUCTURES = [
  { id: '1CRN', name: 'Crambin (small protein)' },
  { id: '4HHB', name: 'Hemoglobin (classic)' },
  { id: '6M0J', name: 'COVID-19 Spike Protein' },
  { id: '7MT0', name: 'AAV9 Capsid' },
  { id: '3PQR', name: 'With ligands' },
  { id: '1BNA', name: 'DNA double helix' },
] as const;

export const REPRESENTATIONS: { value: RepresentationType; label: string }[] = [
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'ball-and-stick', label: 'Ball & Stick' },
  { value: 'spacefill', label: 'Space Fill' },
  { value: 'surface', label: 'Surface' },
  { value: 'line', label: 'Line' },
];

export const COLOR_SCHEMES: { value: ColorScheme; label: string }[] = [
  { value: 'chain-id', label: 'By Chain' },
  { value: 'sequence-id', label: 'By Sequence' },
  { value: 'element-symbol', label: 'By Element' },
  { value: 'residue-name', label: 'By Residue' },
  { value: 'uniform', label: 'Uniform' },
];
