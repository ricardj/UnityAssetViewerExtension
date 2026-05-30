import { describe, it, expect } from 'vitest';
import { UnityPrefabCompleteParser, type ILocalRepoProvider } from '../src/index';

describe('UnityPrefabCompleteParser (Recursive Variant Resolution)', () => {
  it('correctly resolves deeply nested variant prefabs recursively and merges modifications', async () => {
    // 1. Define raw YAML strings for our grandparent, parent, and child variant.
    const grandparentYaml = `
--- !u!1 &100
GameObject:
  m_Name: Grandparent
  m_Layer: 0
  m_IsActive: 1
  m_Component: []
`;

    const parentYaml = `
--- !u!115 &1
PrefabInstance:
  m_SourcePrefab: {fileID: 100100000, guid: grandparent-guid, type: 3}
  m_Modification:
    m_Modifications:
      - target: {fileID: 100}
        propertyPath: m_Name
        value: Parent
      - target: {fileID: 100}
        propertyPath: m_Layer
        value: 5
`;

    const childYaml = `
--- !u!115 &1
PrefabInstance:
  m_SourcePrefab: {fileID: 100100000, guid: parent-guid, type: 3}
  m_Modification:
    m_Modifications:
      - target: {fileID: 100}
        propertyPath: m_Name
        value: Child
`;

    // 2. Setup the mock ILocalRepoProvider
    const mockRepo: ILocalRepoProvider = {
      async findPrefabByGuid(guid: string): Promise<string | null> {
        if (guid === 'grandparent-guid') return grandparentYaml;
        if (guid === 'parent-guid') return parentYaml;
        return null;
      },
      async getScriptGuidMap(): Promise<Map<string, string>> {
        return new Map();
      }
    };

    // 3. Parse the child prefab completely
    const parsed = await UnityPrefabCompleteParser.parse(childYaml, mockRepo);

    // 4. Assertions
    // It should have resolved all base prefabs recursively, merged their modifications,
    // and correctly overridden properties according to the priority (child overrides parent, which overrides grandparent).
    expect(parsed.objects).toHaveLength(3); // 2 PrefabInstances + GameObject 100
    
    const go = parsed.objects.find(o => o.id === '100');
    expect(go).toBeDefined();
    expect(go!.properties.m_Name).toBe('Child'); // Child overrode Parent, which overrode Grandparent
    expect(go!.properties.m_Layer).toBe(5); // Parent's modification is preserved
    expect(go!.properties.m_IsActive).toBe(1); // Grandparent's original value is preserved
  });

  it('handles unresolved base prefabs gracefully without throwing errors', async () => {
    const childYaml = `
--- !u!115 &1
PrefabInstance:
  m_SourcePrefab: {fileID: 100100000, guid: missing-parent-guid, type: 3}
  m_Modification:
    m_Modifications:
      - target: {fileID: 100}
        propertyPath: m_Name
        value: Child
`;

    const mockRepo: ILocalRepoProvider = {
      async findPrefabByGuid(): Promise<string | null> {
        return null; // Can't find anything
      },
      async getScriptGuidMap(): Promise<Map<string, string>> {
        return new Map();
      }
    };

    // Should not throw, should just return parsed child with console warning
    const parsed = await UnityPrefabCompleteParser.parse(childYaml, mockRepo);
    expect(parsed.variantInfo?.basePrefabGuid).toBe('missing-parent-guid');
    expect(parsed.objects).toHaveLength(1); // Only PrefabInstance
  });
});
