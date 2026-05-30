import { UnityObject } from './UnityObject';
import { ParsedPrefab } from './ParsedPrefab';

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
      if (mod.objectReference !== undefined && mod.objectReference.fileID !== 0 && mod.objectReference.fileID !== "0") {
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
