import * as YAML from 'yaml';
import { IUnityObject } from '../types/IUnityObject';
import { IPrefabVariantInfo } from '../types/IPrefabVariantInfo';
import { IParsedPrefab } from '../types/IParsedPrefab';

export class UnityYamlParser {
  private static replaceBigInts(obj: any): any {
    if (typeof obj === 'bigint') {
      if (obj <= Number.MAX_SAFE_INTEGER && obj >= Number.MIN_SAFE_INTEGER) {
        return Number(obj);
      }
      return obj.toString();
    }
    if (Array.isArray(obj)) {
      return obj.map(UnityYamlParser.replaceBigInts);
    }
    if (obj !== null && typeof obj === 'object') {
      const newObj: any = {};
      for (const key in obj) {
        newObj[key] = UnityYamlParser.replaceBigInts(obj[key]);
      }
      return newObj;
    }
    return obj;
  }

  public static parse(yamlString: string): IParsedPrefab {
    const documents: IUnityObject[] = [];
    let variantInfo: IPrefabVariantInfo | undefined = undefined;
    
    // A regex to find the start of a document: --- !u!{typeId} &{id}
    // Unity YAML starts with %YAML 1.1 and %TAG... we can ignore those.
    // The negative lookahead at the end `(?=\n--- !u!|\n\.\.\.|$)` ensures we match until the next doc.
    const docRegex = /--- !u!(\d+)(?: &(\d+))?(?: stripped)?\r?\n([\s\S]*?)(?=\n--- !u!|\n\.\.\.|$)/g;
    
    let match;
    while ((match = docRegex.exec(yamlString)) !== null) {
      const typeId = match[1];
      const id = match[2] || '0';
      const body = match[3].trim();
      
      try {
        let parsed = YAML.parse(body, { intAsBigInt: true });
        if (parsed) {
          parsed = UnityYamlParser.replaceBigInts(parsed);
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
                  targetFileId: mod.target?.fileID?.toString(),
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
}
