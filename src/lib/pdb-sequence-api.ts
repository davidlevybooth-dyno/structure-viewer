/**
 * RCSB PDB API integration for fetching real sequence data
 */

import type {
  SequenceData,
  SequenceChain,
  SequenceResidue,
} from "@/components/sequence-interface/types";

interface PDBPolymerEntity {
  entity_poly: {
    pdbx_seq_one_letter_code: string;
    type: string;
  };
  rcsb_entity_source_organism?: Array<{
    ncbi_scientific_name?: string;
  }>;
  rcsb_polymer_entity?: {
    pdbx_description?: string;
  };
  rcsb_polymer_entity_container_identifiers: {
    auth_asym_ids: string[];
    entity_id: string;
  };
}

interface PDBEntry {
  entry: {
    rcsb_id: string;
    struct?: {
      title?: string;
    };
    exptl?: Array<{
      method?: string;
    }>;
    refine?: Array<{
      ls_d_res_high?: number;
    }>;
    polymer_entities: PDBPolymerEntity[];
  };
}

/**
 * Fetch real sequence data from RCSB PDB GraphQL API
 */
export async function fetchPDBSequenceData(
  pdbId: string,
): Promise<SequenceData> {
  const query = `
    query GetPDBData($entryId: String!) {
      entry(entry_id: $entryId) {
        rcsb_id
        struct {
          title
        }
        exptl {
          method
        }
        refine {
          ls_d_res_high
        }
        polymer_entities {
          entity_poly {
            pdbx_seq_one_letter_code
            type
          }
          rcsb_entity_source_organism {
            ncbi_scientific_name
          }
          rcsb_polymer_entity {
            pdbx_description
          }
          rcsb_polymer_entity_container_identifiers {
            auth_asym_ids
            entity_id
          }
        }
      }
    }
  `;

  try {
    const response = await fetch("https://data.rcsb.org/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { entryId: pdbId.toUpperCase() },
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(
        `GraphQL errors: ${result.errors.map((e: any) => e.message).join(", ")}`,
      );
    }

    if (!result.data?.entry) {
      throw new Error(`No data found for PDB ID: ${pdbId}`);
    }

    return convertPDBDataToSequenceData(result.data as PDBEntry);
  } catch (error) {
    console.error("Error fetching PDB sequence data:", error);
    throw new Error(
      `Failed to fetch sequence data for ${pdbId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Convert PDB API response to our SequenceData format
 */
function convertPDBDataToSequenceData(data: PDBEntry): SequenceData {
  const entry = data.entry;
  const chains: SequenceChain[] = [];

  // Process each polymer entity directly
  entry.polymer_entities.forEach((entity) => {
    const sequence = entity.entity_poly.pdbx_seq_one_letter_code || "";
    const entityType = entity.entity_poly.type;
    const description =
      entity.rcsb_polymer_entity?.pdbx_description ||
      `Entity ${entity.rcsb_polymer_entity_container_identifiers.entity_id}`;
    const organism =
      entity.rcsb_entity_source_organism?.[0]?.ncbi_scientific_name ||
      "Unknown";

    // Only process polypeptide chains
    if (entityType === "polypeptide(L)" && sequence) {
      // Create a chain for each auth_asym_id
      entity.rcsb_polymer_entity_container_identifiers.auth_asym_ids.forEach(
        (chainId) => {
          const residues: SequenceResidue[] = [];

          for (let i = 0; i < sequence.length; i++) {
            const code = sequence[i];
            if (code && code !== "-" && code !== "X") {
              // Skip gaps and unknown residues
              residues.push({
                position: i + 1,
                code: code,
                chainId: chainId,
                // We don't have secondary structure info from the API, but Molstar will have it
                secondaryStructure: "loop", // Default, could be updated from Molstar later
              });
            }
          }

          chains.push({
            id: chainId,
            name: `Chain ${chainId}: ${description}`,
            residues,
            organism,
          });
        },
      );
    }
  });

  // Get metadata
  const organism =
    entry.polymer_entities[0]?.rcsb_entity_source_organism?.[0]
      ?.ncbi_scientific_name;
  const method = entry.exptl?.[0]?.method;
  const resolution = entry.refine?.[0]?.ls_d_res_high?.toFixed(2);
  const title = entry.struct?.title;

  return {
    id: entry.rcsb_id,
    name: title || entry.rcsb_id,
    chains,
    metadata: {
      organism,
      method,
      resolution: resolution ? `${resolution}` : undefined,
    },
  };
}

/**
 * Cache for PDB sequence data to avoid repeated API calls
 */
const sequenceCache = new Map<string, Promise<SequenceData>>();

/**
 * Get PDB sequence data with caching
 */
export async function getPDBSequenceData(pdbId: string): Promise<SequenceData> {
  const upperPdbId = pdbId.toUpperCase();

  if (!sequenceCache.has(upperPdbId)) {
    sequenceCache.set(upperPdbId, fetchPDBSequenceData(upperPdbId));
  }

  return sequenceCache.get(upperPdbId)!;
}
