import { ParsedPrefab } from '../types/ParsedPrefab';
import { LocalRepoProvider } from '../providers/LocalRepoProvider';
import { parseUnityYaml } from './parseUnityYaml';
import { applyModifications } from './applyModifications';

/**
 * Fully parses a prefab, recursively resolving any prefab variants and merging
 * their properties using the provided LocalRepoProvider.
 */
export async function parsePrefabComplete(
  yamlString: string,
  repoProvider?: LocalRepoProvider
): Promise<ParsedPrefab> {
  let parsed = parseUnityYaml(yamlString);
  
  // Recursively resolve variant base prefabs
  while (parsed.variantInfo && repoProvider) {
    const baseGuid = parsed.variantInfo.basePrefabGuid;
    const baseYaml = await repoProvider.findPrefabByGuid(baseGuid);
    if (!baseYaml) {
      console.warn(`[core-parser] Could not find base prefab for GUID: ${baseGuid}`);
      break;
    }
    const baseParsed = await parsePrefabComplete(baseYaml, repoProvider);
    parsed = applyModifications(baseParsed, parsed);
  }
  
  return parsed;
}
