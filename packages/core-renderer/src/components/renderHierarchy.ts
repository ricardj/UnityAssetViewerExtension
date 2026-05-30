import { HierarchyNode } from '@unity-asset-viewer/core-parser';
import { UnityViewer } from './UnityViewer';

/**
 * Main backward-compatible entry point to render the entire prefab hierarchy.
 */
export function renderHierarchy(
  nodes: HierarchyNode[],
  scriptGuidMap?: Map<string, string>,
  globalGuidMap?: Map<string, string>
): HTMLElement {
  return UnityViewer.render(nodes, scriptGuidMap, globalGuidMap);
}
