/**
 * Comprehensive amino acid color schemes and utilities
 * Based on chemical properties and visual clarity
 */

// Standard amino acid codes
export const AMINO_ACIDS = [
  "A",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "V",
  "W",
  "Y",
  "-",
  "*",
] as const;

export type AminoAcid = (typeof AMINO_ACIDS)[number];

// Chemical property groupings
export const RESIDUE_GROUPS: Record<string, string[]> = {
  nonpolar: ["A", "G", "I", "L", "M", "P", "V"],
  polar: ["C", "N", "Q", "S", "T"],
  aromatic: ["F", "W", "Y"],
  acidic: ["D", "E"],
  basic: ["H", "K", "R"],
  special: ["-", "*"],
};

// Full amino acid names
export const RESIDUE_NAMES: Record<string, string> = {
  A: "Alanine",
  C: "Cysteine",
  D: "Aspartic Acid",
  E: "Glutamic Acid",
  F: "Phenylalanine",
  G: "Glycine",
  H: "Histidine",
  I: "Isoleucine",
  K: "Lysine",
  L: "Leucine",
  M: "Methionine",
  N: "Asparagine",
  P: "Proline",
  Q: "Glutamine",
  R: "Arginine",
  S: "Serine",
  T: "Threonine",
  V: "Valine",
  W: "Tryptophan",
  Y: "Tyrosine",
  "-": "Gap",
  "*": "Stop",
};

// Color scheme definitions
export interface ColorScheme {
  id: string;
  name: string;
  description: string;
  colors: Record<string, string>;
  darkColors?: Record<string, string>; // Optional dark mode colors
  groups?: Record<string, string[]>;
}

// Enhanced color schemes with modern, neutral palette
export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  default: {
    id: "default",
    name: "Modern Neutral",
    description: "Clean, modern design with neutral gray base",
    colors: {
      // All residues use neutral gray for clean, minimal appearance
      A: "#BBBDBC",
      C: "#BBBDBC",
      D: "#BBBDBC",
      E: "#BBBDBC",
      F: "#BBBDBC",
      G: "#BBBDBC",
      H: "#BBBDBC",
      I: "#BBBDBC",
      K: "#BBBDBC",
      L: "#BBBDBC",
      M: "#BBBDBC",
      N: "#BBBDBC",
      P: "#BBBDBC",
      Q: "#BBBDBC",
      R: "#BBBDBC",
      S: "#BBBDBC",
      T: "#BBBDBC",
      V: "#BBBDBC",
      W: "#BBBDBC",
      Y: "#BBBDBC",
      // Special characters
      "-": "#F2F0EF",
      "*": "#F2F0EF",
    },
    darkColors: {
      // Dark mode: lighter gray on dark background
      A: "#909EAE",
      C: "#909EAE",
      D: "#909EAE",
      E: "#909EAE",
      F: "#909EAE",
      G: "#909EAE",
      H: "#909EAE",
      I: "#909EAE",
      K: "#909EAE",
      L: "#909EAE",
      M: "#909EAE",
      N: "#909EAE",
      P: "#909EAE",
      Q: "#909EAE",
      R: "#909EAE",
      S: "#909EAE",
      T: "#909EAE",
      V: "#909EAE",
      W: "#909EAE",
      Y: "#909EAE",
      // Special characters
      "-": "#736F60",
      "*": "#736F60",
    },
    groups: RESIDUE_GROUPS,
  },

  sophisticated: {
    id: "sophisticated",
    name: "Sophisticated",
    description: "Modern color palette inspired by your design preferences",
    colors: {
      // Aromatic (sophisticated blue-gray)
      F: "#5C8DC5",
      W: "#5C8DC5",
      Y: "#5C8DC5",
      // Acidic (muted red-brown)
      D: "#AD9E90",
      E: "#AD9E90",
      // Basic (teal accent)
      H: "#245F73",
      K: "#245F73",
      R: "#245F73",
      // Nonpolar (neutral gray - most residues)
      A: "#BBBDBC",
      G: "#BBBDBC",
      I: "#BBBDBC",
      L: "#BBBDBC",
      M: "#BBBDBC",
      P: "#BBBDBC",
      V: "#BBBDBC",
      // Polar (warm brown accent)
      C: "#733E24",
      N: "#733E24",
      Q: "#733E24",
      S: "#733E24",
      T: "#733E24",
      // Special (very light gray)
      "-": "#F2F0EF",
      "*": "#F2F0EF",
    },
    groups: RESIDUE_GROUPS,
  },

  chemical: {
    id: "chemical",
    name: "Chemical Properties",
    description: "Based on chemical properties with distinct colors",
    colors: {
      // Aromatic (yellow) - from provided data
      F: "#f0e442",
      W: "#f0e442",
      Y: "#f0e442",
      // Acidic (pink/red) - from provided data
      D: "#cc79a7",
      E: "#cc79a7",
      // Basic (blue) - from provided data
      H: "#56b4e9",
      K: "#56b4e9",
      R: "#56b4e9",
      // Nonpolar (orange) - from provided data
      A: "#e69f00",
      G: "#e69f00",
      I: "#e69f00",
      L: "#e69f00",
      M: "#e69f00",
      P: "#e69f00",
      V: "#e69f00",
      // Polar (green) - from provided data
      C: "#009e73",
      N: "#009e73",
      Q: "#009e73",
      S: "#009e73",
      T: "#009e73",
      // Special (black/gray)
      "-": "#000000",
      "*": "#000000",
    },
    groups: RESIDUE_GROUPS,
  },

  hydrophobicity: {
    id: "hydrophobicity",
    name: "Hydrophobicity",
    description: "Gradient from hydrophobic (blue) to hydrophilic (red)",
    colors: {
      // Most hydrophobic (dark blue)
      F: "#1e3a8a",
      W: "#1e40af",
      I: "#1e40af",
      L: "#2563eb",
      V: "#2563eb",
      M: "#3b82f6",
      // Moderately hydrophobic (medium blue)
      A: "#60a5fa",
      Y: "#93c5fd",
      C: "#bfdbfe",
      // Neutral (light blue/gray)
      T: "#dbeafe",
      S: "#e0e7ff",
      P: "#f1f5f9",
      G: "#f8fafc",
      // Hydrophilic (light red to red)
      H: "#fecaca",
      N: "#fca5a5",
      Q: "#f87171",
      D: "#ef4444",
      E: "#dc2626",
      K: "#b91c1c",
      R: "#991b1b",
      // Special
      "-": "#6b7280",
      "*": "#374151",
    },
  },

  charge: {
    id: "charge",
    name: "Charge",
    description: "Based on electrical charge at physiological pH",
    colors: {
      // Positive (blue shades)
      K: "#3b82f6",
      R: "#2563eb",
      H: "#60a5fa",
      // Negative (red shades)
      D: "#ef4444",
      E: "#dc2626",
      // Polar uncharged (green shades)
      S: "#10b981",
      T: "#059669",
      N: "#34d399",
      Q: "#6ee7b7",
      C: "#a7f3d0",
      Y: "#d1fae5",
      // Nonpolar (gray shades)
      A: "#d1d5db",
      I: "#d1d5db",
      L: "#d1d5db",
      M: "#d1d5db",
      F: "#d1d5db",
      W: "#d1d5db",
      V: "#d1d5db",
      // Special (yellow)
      G: "#fbbf24",
      P: "#f59e0b",
      // Gaps/stops
      "-": "#6b7280",
      "*": "#374151",
    },
  },

  taylor: {
    id: "taylor",
    name: "Taylor",
    description: "Classic Taylor color scheme for amino acids",
    colors: {
      A: "#ccff00",
      C: "#ffff00",
      D: "#ff0000",
      E: "#ff0066",
      F: "#00ff66",
      G: "#ff9900",
      H: "#0066ff",
      I: "#66ff00",
      K: "#6600ff",
      L: "#33ff00",
      M: "#00ff00",
      N: "#cc00ff",
      P: "#ffcc00",
      Q: "#ff00cc",
      R: "#0000ff",
      S: "#ff3300",
      T: "#ff6600",
      V: "#99ff00",
      W: "#00ccff",
      Y: "#00ffcc",
      "-": "#ffffff",
      "*": "#000000",
    },
  },
};

// Utility functions
export function getResidueGroup(residue: string): string {
  for (const [group, residues] of Object.entries(RESIDUE_GROUPS)) {
    if (residues.includes(residue as any)) {
      return group;
    }
  }
  return "unknown";
}

export function getResidueColor(
  residue: string,
  schemeId: string = "default",
  isDarkMode: boolean = false,
): string {
  const scheme = COLOR_SCHEMES[schemeId];
  if (!scheme) return "#f3f4f6";

  // Use dark colors if available and in dark mode
  if (isDarkMode && scheme.darkColors) {
    return scheme.darkColors[residue] || scheme.colors[residue] || "#f3f4f6";
  }

  return scheme.colors[residue] || "#f3f4f6";
}

export function getResidueInfo(residue: string) {
  return {
    code: residue,
    name: RESIDUE_NAMES[residue] || "Unknown",
    group: getResidueGroup(residue),
  };
}

// Export color scheme options for UI
export const COLOR_SCHEME_OPTIONS = Object.values(COLOR_SCHEMES).map(
  (scheme) => ({
    value: scheme.id,
    label: scheme.name,
    description: scheme.description,
  }),
);
