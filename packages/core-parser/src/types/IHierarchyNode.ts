import { IUnityObject } from './IUnityObject';

export interface IHierarchyNode {
  gameObject: IUnityObject;
  components: IUnityObject[];
  children: IHierarchyNode[];
}
