import { IUnityObject } from '../types/IUnityObject';
import { IHierarchyNode } from '../types/IHierarchyNode';

export class UnityPrefabHierarchyBuilder {
  public static build(objects: IUnityObject[]): IHierarchyNode[] {
    const objMap = new Map<string, IUnityObject>();
    objects.forEach(obj => objMap.set(obj.id, obj));

    const gameObjects = objects.filter(obj => obj.typeStr === 'GameObject');
    const transforms = objects.filter(obj => obj.typeStr === 'Transform' || obj.typeStr === 'RectTransform');
    
    const nodes = new Map<string, IHierarchyNode>();
    
    // Initialize nodes
    gameObjects.forEach(go => {
      nodes.set(go.id, {
        gameObject: go,
        components: go.properties.m_Component?.map((c: any) => c.component?.fileID ? objMap.get(c.component.fileID.toString()) : undefined).filter(Boolean) || [],
        children: []
      });
    });

    const rootNodes: IHierarchyNode[] = [];

    // Build tree based on Transform parent/child
    transforms.forEach(t => {
      const goId = t.properties.m_GameObject?.fileID?.toString();
      if (!goId) return;

      const node = nodes.get(goId);
      if (!node) return;

      const parentId = t.properties.m_Father?.fileID?.toString();
      if (parentId && parentId !== "0") {
        // Find parent Transform
        let parentTransform = objMap.get(parentId);

        // Resolve stripped variant parent transforms via m_CorrespondingSourceObject
        while (parentTransform && parentTransform.properties.m_CorrespondingSourceObject) {
          const correspondingId = parentTransform.properties.m_CorrespondingSourceObject.fileID?.toString();
          if (correspondingId) {
            const nextTransform = objMap.get(correspondingId);
            if (nextTransform) {
               parentTransform = nextTransform;
               continue;
            }
          }
          break;
        }

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
}
