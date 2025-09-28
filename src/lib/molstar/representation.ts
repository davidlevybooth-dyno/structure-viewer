/**
 * Representation Control API for Mol*
 *
 * Safe representation switching that preserves component structure
 * Based on proven patterns from experimental testing
 */

import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

export type RepresentationType =
  | "cartoon"
  | "molecular-surface"
  | "ball-and-stick"
  | "spacefill"
  | "point"
  | "backbone";

export interface RepresentationOptions {
  /** Log progress to console (default: false) */
  verbose?: boolean;
  /** Color theme to apply (default: 'chain-id') */
  colorTheme?: string;
  /** Size theme parameters */
  sizeTheme?: { name: string; params: any };
}

/**
 * Molstar Representation API - Exact copy from working dlb/regions implementation
 */
export class MolstarRepresentationAPI {
  constructor(private plugin: PluginUIContext) {}

  // Core method to set representation safely
  async setRepresentation(repType: string): Promise<boolean> {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;

      // Validate hierarchy structure
      if (hierarchy.structures.length === 0) return false;
      const totalComponents = hierarchy.structures.flatMap(
        (s) => s.components,
      ).length;
      if (totalComponents === 0) return false;
      const totalRepresentations = hierarchy.structures
        .flatMap((s) => s.components)
        .flatMap((c) => c.representations).length;
      if (totalRepresentations === 0) return false;

      const update = this.plugin.state.data.build();

      // Update existing representations in place
      for (const structure of hierarchy.structures) {
        for (const component of structure.components) {
          for (const representation of component.representations) {
            update.to(representation.cell.transform.ref).update({
              type: { name: repType, params: {} },
              colorTheme: { name: "chain-id", params: {} },
              sizeTheme: { name: "uniform", params: { value: 1 } },
            });
          }
        }
      }

      await update.commit();
      return true;
    } catch (error) {
      console.error(`Failed to set representation to ${repType}:`, error);
      return false;
    }
  }

  // Convenience methods for specific representations
  async setCartoon(): Promise<boolean> {
    return this.setRepresentation("cartoon");
  }
  async setSurface(): Promise<boolean> {
    return this.setRepresentation("molecular-surface");
  }
  async setBallAndStick(): Promise<boolean> {
    return this.setRepresentation("ball-and-stick");
  }
  async setSpacefill(): Promise<boolean> {
    return this.setRepresentation("spacefill");
  }
  async setPoint(): Promise<boolean> {
    return this.setRepresentation("point");
  }

  // Get current representation (if we need it)
  getCurrentRepresentation(): string | null {
    try {
      const hierarchy = this.plugin.managers.structure.hierarchy.current;
      const firstRep =
        hierarchy.structures[0]?.components[0]?.representations[0];
      return firstRep?.cell?.params?.type?.name || null;
    } catch {
      return null;
    }
  }
}

/**
 * Wrapper function that uses the working API class
 */
export async function setRepresentation(
  plugin: PluginUIContext,
  repType: RepresentationType,
  options: RepresentationOptions = {},
): Promise<boolean> {
  const api = new MolstarRepresentationAPI(plugin);
  return api.setRepresentation(repType);
}

/**
 * Convenience methods for specific representations
 */
export async function setCartoon(
  plugin: PluginUIContext,
  options?: RepresentationOptions,
): Promise<boolean> {
  return setRepresentation(plugin, "cartoon", options);
}

export async function setSurface(
  plugin: PluginUIContext,
  options?: RepresentationOptions,
): Promise<boolean> {
  return setRepresentation(plugin, "molecular-surface", options);
}

export async function setBallAndStick(
  plugin: PluginUIContext,
  options?: RepresentationOptions,
): Promise<boolean> {
  return setRepresentation(plugin, "ball-and-stick", options);
}

export async function setSpacefill(
  plugin: PluginUIContext,
  options?: RepresentationOptions,
): Promise<boolean> {
  return setRepresentation(plugin, "spacefill", options);
}

export async function setPoint(
  plugin: PluginUIContext,
  options?: RepresentationOptions,
): Promise<boolean> {
  return setRepresentation(plugin, "point", options);
}

export async function setBackbone(
  plugin: PluginUIContext,
  options?: RepresentationOptions,
): Promise<boolean> {
  return setRepresentation(plugin, "backbone", options);
}

/**
 * Get current representation type
 */
export function getCurrentRepresentation(
  plugin: PluginUIContext,
): string | null {
  try {
    const hierarchy = plugin.managers.structure.hierarchy.current;
    const firstRep = hierarchy.structures[0]?.components[0]?.representations[0];
    return firstRep?.cell?.params?.type?.name || null;
  } catch {
    return null;
  }
}

/**
 * Set surface transparency (only works with surface representations)
 */
export async function setSurfaceTransparency(
  plugin: PluginUIContext,
  transparency: number,
  options: RepresentationOptions = {},
): Promise<boolean> {
  const { verbose = false } = options;

  try {
    if (verbose)
      console.log(`🎨 Setting surface transparency to ${transparency}`);

    const hierarchy = plugin.managers.structure.hierarchy.current;
    const update = plugin.state.data.build();

    // Update surface representations with transparency
    for (const structure of hierarchy.structures) {
      for (const component of structure.components) {
        for (const representation of component.representations) {
          const repType = representation.cell?.params?.type?.name;
          if (repType === "molecular-surface") {
            update.to(representation.cell.transform.ref).update({
              type: {
                name: "molecular-surface",
                params: {
                  alpha: 1 - transparency, // Mol* uses alpha (1 = opaque, 0 = transparent)
                },
              },
            });
          }
        }
      }
    }

    await update.commit();

    if (verbose) console.log(`✅ Surface transparency set to ${transparency}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set surface transparency:`, error);
    return false;
  }
}

/**
 * Apply mixed representation (different types for different components)
 */
export interface MixedRepresentationConfig {
  chains?: { [chainId: string]: RepresentationType };
  ligands?: RepresentationType;
  water?: RepresentationType;
  default?: RepresentationType;
}

export async function setMixedRepresentation(
  plugin: PluginUIContext,
  config: MixedRepresentationConfig,
  options: RepresentationOptions = {},
): Promise<boolean> {
  const { verbose = false } = options;

  try {
    if (verbose) console.log("🎨 Applying mixed representation configuration");

    // For now, apply the default representation to all components
    // TODO: Implement chain-specific and component-specific representations
    const defaultRep = config.default || "cartoon";
    return await setRepresentation(plugin, defaultRep, options);
  } catch (error) {
    console.error("❌ Failed to apply mixed representation:", error);
    return false;
  }
}
