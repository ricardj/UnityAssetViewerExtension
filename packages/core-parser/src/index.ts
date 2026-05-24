import * as YAML from 'yaml';

export interface UnityObject {
  id: string;
  typeId: string;
  typeStr: string;
  properties: any;
}

export function parseUnityYaml(yamlString: string): UnityObject[] {
  const documents: UnityObject[] = [];
  
  // A regex to find the start of a document: --- !u!{typeId} &{id}
  // Unity YAML starts with %YAML 1.1 and %TAG... we can ignore those.
  // The negative lookahead at the end `(?=\n--- !u!|\n\.\.\.|$)` ensures we match until the next doc.
  const docRegex = /--- !u!(\d+)(?: &(\d+))?(?: stripped)?\r?\n([\s\S]*?)(?=\n--- !u!|\n\.\.\.|$)/g;
  
  let match;
  while ((match = docRegex.exec(yamlString)) !== null) {
    const typeId = match[1];
    const id = match[2] || '0';
    const body = match[3];
    
    try {
      const parsed = YAML.parse(body);
      if (parsed) {
        const typeStr = Object.keys(parsed)[0]; // e.g. "GameObject"
        documents.push({
          id,
          typeId,
          typeStr,
          properties: parsed[typeStr]
        });
      }
    } catch (e) {
      console.error(`Failed to parse document ${id} of type ${typeId}`, e);
    }
  }
  
  return documents;
}

// Helper to extract hierarchy
export interface HierarchyNode {
  gameObject: UnityObject;
  components: UnityObject[];
  children: HierarchyNode[];
}

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
      components: go.properties.m_Component?.map((c: any) => objMap.get(c.component.fileID)).filter(Boolean) || [],
      children: []
    });
  });

  const rootNodes: HierarchyNode[] = [];

  // Build tree based on Transform parent/child
  transforms.forEach(t => {
    const goId = t.properties.m_GameObject?.fileID;
    if (!goId) return;

    const node = nodes.get(goId);
    if (!node) return;

    const parentId = t.properties.m_Father?.fileID;
    if (parentId && parentId !== "0") {
      // Find parent Transform
      const parentTransform = objMap.get(parentId);
      if (parentTransform) {
        const parentGoId = parentTransform.properties.m_GameObject?.fileID;
        const parentNode = nodes.get(parentGoId);
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
