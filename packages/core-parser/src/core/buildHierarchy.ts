import { UnityObject } from '../types/UnityObject';
import { HierarchyNode } from '../types/HierarchyNode';

export function buildHierarchy(objects: UnityObject[]): HierarchyNode[] {
  const objMap = new Map<string, UnityObject>();
  objects.forEach(obj => objMap.set(obj.id, obj));

  const gameObjects = objects.filter(obj => obj.typeStr === 'GameObject');
  const transforms = objects.filter(obj => obj.typeStr === 'Transform' || obj.typeStr === 'RectTransform');
  
  const nodes = new Map<string, HierarchyNode>();
  
  // Initialize nodes
  gameObjects.forEach(go => {
    nodes.set(go.id, {
      gameObject: go,
      components: go.properties.m_Component?.map((c: any) => c.component?.fileID ? objMap.get(c.component.fileID.toString()) : undefined).filter(Boolean) || [],
      children: []
    });
  });

  const rootNodes: HierarchyNode[] = [];

  // Build tree based on Transform parent/child
  transforms.forEach(t => {
    const goId = t.properties.m_GameObject?.fileID?.toString();
    if (!goId) return;

    const node = nodes.get(goId);
    if (!node) return;

    const parentId = t.properties.m_Father?.fileID?.toString();
    if (parentId && parentId !== "0") {
      // Find parent Transform
      const parentTransform = objMap.get(parentId);
      if (parentTransform) {
        const parentGoId = parentTransform.properties.m_GameObject?.fileID?.toString();
        const parentNode = parentGoId ? nodes.get(parentGoId) : undefined;
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}
