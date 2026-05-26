import { HierarchyNode } from '@unity-asset-viewer/core-parser';
import { UnityViewer } from './UnityViewer';

// Re-export the main coordinate classes for advanced C# style modularity
export { UnityViewer } from './UnityViewer';
export { HierarchyTreeBuilder } from './HierarchyTreeBuilder';
export { RectTransformApplier } from './RectTransformApplier';
export { VisualComponentRenderer } from './VisualComponentRenderer';
export { LayoutGroupApplier, LayoutContext } from './LayoutGroupApplier';
export { ContentSizeFitterApplier } from './ContentSizeFitterApplier';

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
