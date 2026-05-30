import { IHierarchyNode } from '@unity-asset-viewer/core-parser';
import { UnityViewer } from './UnityViewer';

export class UnityHierarchyRenderer {
  /**
   * Main entry point to render the entire prefab hierarchy.
   */
  public static render(
    nodes: IHierarchyNode[],
    scriptGuidMap?: Map<string, string>,
    globalGuidMap?: Map<string, string>
  ): HTMLElement {
    return UnityViewer.render(nodes, scriptGuidMap, globalGuidMap);
  }
}
