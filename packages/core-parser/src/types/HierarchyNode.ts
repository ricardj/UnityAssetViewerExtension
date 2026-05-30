import { UnityObject } from './UnityObject';

export interface HierarchyNode {
  gameObject: UnityObject;
  components: UnityObject[];
  children: HierarchyNode[];
}
