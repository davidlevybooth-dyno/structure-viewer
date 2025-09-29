import { useCallback, useState } from "react";
import type { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";

export interface StructureLoadingState {
  isLoading: boolean;
  currentPdbId: string | null;
  error: string | null;
}

export interface LoadStructureOptions {
  pdbId: string;
  representation?:
    | "cartoon"
    | "ball-and-stick"
    | "spacefill"
    | "line"
    | "backbone"
    | "label";
  colorScheme?: "chain-id" | "sequence-id" | "element-symbol" | "uniform";
  autoFocus?: boolean;
}

interface UseStructureLoaderOptions {
  onStructureLoaded?: (pdbId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for loading molecular structures into Molstar
 * Handles PDB loading, representation, and error states
 */
export function useStructureLoader(
  plugin: PluginUIContext | null,
  options: UseStructureLoaderOptions = {},
) {
  const { onStructureLoaded, onError } = options;

  const [state, setState] = useState<StructureLoadingState>({
    isLoading: false,
    currentPdbId: null,
    error: null,
  });

  // Clear all existing structures
  const clearStructures = useCallback(async () => {
    if (!plugin) return;

    try {
      const { PluginCommands } = await import(
        "molstar/lib/mol-plugin/commands"
      );

      await PluginCommands.State.RemoveObject(plugin, {
        state: plugin.state.data,
        ref: plugin.state.data.tree.root.ref,
      });
    } catch (err) {
      // Silently handle structure clearing errors
    }
  }, [plugin]);

  // Load a structure by PDB ID
  const loadStructure = useCallback(
    async (options: LoadStructureOptions) => {
      if (!plugin) {
        return;
      }

      const {
        pdbId,
        representation = "cartoon",
        colorScheme = "chain-id",
        autoFocus = true,
      } = options;

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        // Clear existing structures
        await clearStructures();

        // Build download URL
        const url = `https://files.rcsb.org/download/${pdbId.toLowerCase()}.cif`;

        // Load structure data
        const data = await plugin.builders.data.download(
          {
            url,
            isBinary: false,
          },
          { state: { isGhost: false } },
        );

        // Parse trajectory and create model
        const trajectory = await plugin.builders.structure.parseTrajectory(
          data,
          "mmcif",
        );
        const model = await plugin.builders.structure.createModel(trajectory);
        const structure =
          await plugin.builders.structure.createStructure(model);

        // Apply default preset to ensure proper component structure and store preset objects
        const presetStateObjects = await plugin.builders.structure.hierarchy.applyPreset(structure, 'default');
        
        // Store preset objects for highlighting system to use
        if (presetStateObjects) {
          (plugin as any)._presetStateObjects = presetStateObjects;
        }
        
        // Enforce representation using the working pattern, but preserve selection theme
        try {
          const hierarchy = plugin.managers.structure.hierarchy.current;
          const update = plugin.state.data.build();
          
          // Update existing representations in place (preserving component structure)
          for (const struct of hierarchy.structures) {
            for (const component of struct.components) {
              for (const rep of component.representations) {
                update.to(rep.cell.transform.ref).update({
                  type: { name: representation, params: {} },
                  colorTheme: { name: colorScheme, params: {} },
                  sizeTheme: { name: 'uniform', params: { value: 1 } },
                });
              }
            }
          }
          
          await update.commit();
          
          // Configure selection color to be more visible
          try {
            const { PluginCommands } = await import('molstar/lib/mol-plugin/commands');
            const renderer = plugin.canvas3d!.props.renderer;
            await PluginCommands.Canvas3D.SetSettings(plugin, { 
              settings: { 
                renderer: { 
                  ...renderer, 
                  selectColor: 0xff0000, // Bright red for selections
                  highlightColor: 0xffff00 // Bright yellow for highlights
                } 
              } 
            });
            console.log('🎯 Selection colors configured');
          } catch (colorError) {
            console.warn('Selection color setup failed:', colorError);
          }
          
        } catch (repError) {
          console.warn('Representation enforcement failed, keeping default:', repError);
        }

        // Focus camera if requested
        if (autoFocus && structure.data) {
          const { StructureElement } = await import(
            "molstar/lib/mol-model/structure"
          );
          const loci = StructureElement.Loci.all(structure.data);
          plugin.managers.camera.focusLoci(loci);
        }

        // Update state
        setState((prev) => ({
          ...prev,
          isLoading: false,
          currentPdbId: pdbId.toUpperCase(),
        }));

        onStructureLoaded?.(pdbId.toUpperCase());
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load structure";
        const fullMessage = `Failed to load ${pdbId}: ${message}`;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: fullMessage,
        }));

        onError?.(fullMessage);
        throw new Error(fullMessage);
      }
    },
    [plugin, clearStructures, onStructureLoaded, onError],
  );

  return {
    state,
    loadStructure,
    clearStructures,
  };
}
