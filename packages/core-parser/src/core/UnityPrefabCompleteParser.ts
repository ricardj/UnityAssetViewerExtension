import { IParsedPrefab } from '../types/IParsedPrefab';
import { ILocalRepoProvider } from '../providers/ILocalRepoProvider';
import { UnityYamlParser } from './UnityYamlParser';
import { UnityPrefabModificationApplier } from './UnityPrefabModificationApplier';

export class UnityPrefabCompleteParser {
  /**
   * Fully parses a prefab, recursively resolving any prefab variants and merging
   * their properties using the provided ILocalRepoProvider.
   */
  public static async parse(
    yamlString: string,
    repoProvider?: ILocalRepoProvider
  ): Promise<IParsedPrefab> {
    let parsed = UnityYamlParser.parse(yamlString);
    
    // Recursively resolve variant base prefabs
    while (parsed.variantInfo && repoProvider) {
      const baseGuid = parsed.variantInfo.basePrefabGuid;
      const baseYaml = await repoProvider.findPrefabByGuid(baseGuid);
      if (!baseYaml) {
        console.warn(`[core-parser] Could not find base prefab for GUID: ${baseGuid}`);
        break;
      }
      const baseParsed = await UnityPrefabCompleteParser.parse(baseYaml, repoProvider);
      parsed = UnityPrefabModificationApplier.apply(baseParsed, parsed);
    }
    
    return parsed;
  }
}
