import * as YAML from 'yaml';

export interface UnityObject {
  id: string;
  typeId: string;
  typeStr: string;
  properties: any;
}

export interface PrefabVariantInfo {
  basePrefabGuid: string;
  modifications: Array<{
    targetFileId: string;
    propertyPath: string;
    value: any;
    objectReference?: any;
  }>;
}

export interface ParsedPrefab {
  objects: UnityObject[];
  variantInfo?: PrefabVariantInfo;
}

export function parseUnityYaml(yamlString: string): ParsedPrefab {
  const documents: UnityObject[] = [];
  let variantInfo: PrefabVariantInfo | undefined = undefined;
  
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
        if (typeStr === 'PrefabInstance') {
          const props = parsed[typeStr];
          if (props.m_SourcePrefab && props.m_SourcePrefab.guid) {
            variantInfo = {
              basePrefabGuid: props.m_SourcePrefab.guid,
              modifications: props.m_Modification?.m_Modifications?.map((mod: any) => ({
                targetFileId: mod.target?.fileID,
                propertyPath: mod.propertyPath,
                value: mod.value,
                objectReference: mod.objectReference
              })) || []
            };
          }
        }
      }
    } catch (e) {
      console.error(`Failed to parse document ${id} of type ${typeId}`, e);
    }
  }
  
  return { objects: documents, variantInfo };
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

export function applyModifications(baseParsed: ParsedPrefab, variantParsed: ParsedPrefab): ParsedPrefab {
  // Deep clone the base objects so we don't mutate the cached version
  const newObjects = JSON.parse(JSON.stringify(baseParsed.objects)) as UnityObject[];
  const objMap = new Map<string, UnityObject>();
  newObjects.forEach(obj => objMap.set(obj.id, obj));

  const variantInfo = variantParsed.variantInfo;
  if (variantInfo) {
    for (const mod of variantInfo.modifications) {
      const targetObj = objMap.get(mod.targetFileId);
      if (!targetObj) continue;

      const pathParts = mod.propertyPath.split('.');
      let current = targetObj.properties;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (current[pathParts[i]] === undefined || current[pathParts[i]] === null) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      const lastPart = pathParts[pathParts.length - 1];
      if (mod.objectReference !== undefined && mod.objectReference.fileID !== 0) {
        current[lastPart] = mod.objectReference;
      } else {
        current[lastPart] = mod.value;
      }
    }
  }

  // Append any local objects that were added directly in the variant file
  if (variantParsed.objects && variantParsed.objects.length > 0) {
    newObjects.push(...variantParsed.objects);
  }

  return { objects: newObjects };
}
