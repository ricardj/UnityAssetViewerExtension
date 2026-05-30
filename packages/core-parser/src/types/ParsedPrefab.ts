import { UnityObject } from './UnityObject';
import { PrefabVariantInfo } from './PrefabVariantInfo';

export interface ParsedPrefab {
  objects: UnityObject[];
  variantInfo?: PrefabVariantInfo;
}
