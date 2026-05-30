import { IUnityObject } from './IUnityObject';
import { IPrefabVariantInfo } from './IPrefabVariantInfo';

export interface IParsedPrefab {
  objects: IUnityObject[];
  variantInfo?: IPrefabVariantInfo;
}
