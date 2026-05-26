import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  parseUnityYaml,
  buildHierarchy,
  applyModifications,
  type ParsedPrefab,
  type UnityObject,
  type HierarchyNode,
} from '../src/index';

const samplePrefab = readFileSync(
  resolve(__dirname, 'sample.prefab'),
  'utf-8'
);

describe('parseUnityYaml', () => {
  it('parses the sample prefab into 6 objects', () => {
    const result = parseUnityYaml(samplePrefab);
    // 2 GameObjects, 2 RectTransforms, 1 Canvas, 1 MonoBehaviour
    expect(result.objects).toHaveLength(6);
  });

  it('extracts correct typeStr values', () => {
    const result = parseUnityYaml(samplePrefab);
    const typeStrs = result.objects.map((o) => o.typeStr);
    expect(typeStrs).toEqual([
      'GameObject',
      'RectTransform',
      'Canvas',
      'GameObject',
      'RectTransform',
      'MonoBehaviour',
    ]);
  });

  it('assigns correct ids from YAML anchors', () => {
    const result = parseUnityYaml(samplePrefab);
    const ids = result.objects.map((o) => o.id);
    expect(ids).toEqual(['12345', '67890', '11111', '33333', '22222', '44444']);
  });

  it('assigns correct typeIds from YAML tags', () => {
    const result = parseUnityYaml(samplePrefab);
    const typeIds = result.objects.map((o) => o.typeId);
    expect(typeIds).toEqual(['1', '224', '223', '1', '224', '114']);
  });

  it('extracts m_Name for GameObjects', () => {
    const result = parseUnityYaml(samplePrefab);
    const gameObjects = result.objects.filter((o) => o.typeStr === 'GameObject');
    expect(gameObjects).toHaveLength(2);
    expect(gameObjects[0].properties.m_Name).toBe('Canvas');
    expect(gameObjects[1].properties.m_Name).toBe('Background');
  });

  it('does not set variantInfo for a non-variant prefab', () => {
    const result = parseUnityYaml(samplePrefab);
    expect(result.variantInfo).toBeUndefined();
  });

  it('returns an empty objects array for YAML with no Unity documents', () => {
    const result = parseUnityYaml('%YAML 1.1\n%TAG !u! tag:unity3d.com,2011:\n');
    expect(result.objects).toEqual([]);
    expect(result.variantInfo).toBeUndefined();
  });
});

describe('buildHierarchy', () => {
  it('produces a single root node named Canvas', () => {
    const { objects } = parseUnityYaml(samplePrefab);
    const roots = buildHierarchy(objects);
    expect(roots).toHaveLength(1);
    expect(roots[0].gameObject.properties.m_Name).toBe('Canvas');
  });

  it('places Background as a child of Canvas', () => {
    const { objects } = parseUnityYaml(samplePrefab);
    const roots = buildHierarchy(objects);
    const canvas = roots[0];
    expect(canvas.children).toHaveLength(1);
    expect(canvas.children[0].gameObject.properties.m_Name).toBe('Background');
  });

  it('resolves components for the Canvas node', () => {
    const { objects } = parseUnityYaml(samplePrefab);
    const roots = buildHierarchy(objects);
    const canvas = roots[0];
    // Canvas GameObject references components 67890 (RectTransform) and 11111 (Canvas)
    const compTypes = canvas.components.map((c) => c.typeStr);
    expect(compTypes).toContain('RectTransform');
    expect(compTypes).toContain('Canvas');
  });

  it('resolves components for the Background node', () => {
    const { objects } = parseUnityYaml(samplePrefab);
    const roots = buildHierarchy(objects);
    const background = roots[0].children[0];
    // Background references components 22222 (RectTransform) and 44444 (MonoBehaviour)
    const compTypes = background.components.map((c) => c.typeStr);
    expect(compTypes).toContain('RectTransform');
    expect(compTypes).toContain('MonoBehaviour');
  });

  it('Background node has no children', () => {
    const { objects } = parseUnityYaml(samplePrefab);
    const roots = buildHierarchy(objects);
    const background = roots[0].children[0];
    expect(background.children).toHaveLength(0);
  });

  it('returns empty array when given no objects', () => {
    const roots = buildHierarchy([]);
    expect(roots).toEqual([]);
  });

  it('handles Transform pointing to a nonexistent m_Father ID', () => {
    const objects: UnityObject[] = [
      {
        id: '1',
        typeId: '1',
        typeStr: 'GameObject',
        properties: {
          m_Name: 'Orphan',
          m_Component: [{ component: { fileID: '2' } }],
        },
      },
      {
        id: '2',
        typeId: '4',
        typeStr: 'Transform',
        properties: {
          m_GameObject: { fileID: '1' },
          m_Father: { fileID: '999' }, // Nonexistent parent
        },
      },
    ];

    const roots = buildHierarchy(objects);
    expect(roots).toHaveLength(1);
    expect(roots[0].gameObject.properties.m_Name).toBe('Orphan');
  });
});

describe('applyModifications', () => {
  function makeBaseParsed(): ParsedPrefab {
    return {
      objects: [
        {
          id: '100',
          typeId: '1',
          typeStr: 'GameObject',
          properties: {
            m_Name: 'Original',
            m_Layer: 0,
            m_IsActive: 1,
            m_Component: [],
          },
        },
        {
          id: '200',
          typeId: '224',
          typeStr: 'RectTransform',
          properties: {
            m_GameObject: { fileID: 100 },
            m_AnchoredPosition: { x: 0, y: 0 },
          },
        },
      ],
    };
  }

  it('applies a simple property modification', () => {
    const base = makeBaseParsed();
    const variant: ParsedPrefab = {
      objects: [],
      variantInfo: {
        basePrefabGuid: 'abc123',
        modifications: [
          {
            targetFileId: '100',
            propertyPath: 'm_Name',
            value: 'Renamed',
          },
        ],
      },
    };

    const result = applyModifications(base, variant);
    const go = result.objects.find((o) => o.id === '100')!;
    expect(go.properties.m_Name).toBe('Renamed');
  });

  it('applies a nested property modification', () => {
    const base = makeBaseParsed();
    const variant: ParsedPrefab = {
      objects: [],
      variantInfo: {
        basePrefabGuid: 'abc123',
        modifications: [
          {
            targetFileId: '200',
            propertyPath: 'm_AnchoredPosition.x',
            value: 42,
          },
        ],
      },
    };

    const result = applyModifications(base, variant);
    const rt = result.objects.find((o) => o.id === '200')!;
    expect(rt.properties.m_AnchoredPosition.x).toBe(42);
  });

  it('creates intermediate objects for deep paths', () => {
    const base = makeBaseParsed();
    const variant: ParsedPrefab = {
      objects: [],
      variantInfo: {
        basePrefabGuid: 'abc123',
        modifications: [
          {
            targetFileId: '100',
            propertyPath: 'nested.deep.value',
            value: 'hello',
          },
        ],
      },
    };

    const result = applyModifications(base, variant);
    const go = result.objects.find((o) => o.id === '100')!;
    expect(go.properties.nested.deep.value).toBe('hello');
  });

  it('uses objectReference instead of value when objectReference has a non-zero fileID', () => {
    const base = makeBaseParsed();
    const objRef = { fileID: 999, guid: 'some-guid', type: 3 };
    const variant: ParsedPrefab = {
      objects: [],
      variantInfo: {
        basePrefabGuid: 'abc123',
        modifications: [
          {
            targetFileId: '100',
            propertyPath: 'm_Component',
            value: 'ignored',
            objectReference: objRef,
          },
        ],
      },
    };

    const result = applyModifications(base, variant);
    const go = result.objects.find((o) => o.id === '100')!;
    expect(go.properties.m_Component).toEqual(objRef);
  });

  it('appends local variant objects to the result', () => {
    const base = makeBaseParsed();
    const localObj: UnityObject = {
      id: '300',
      typeId: '114',
      typeStr: 'MonoBehaviour',
      properties: { m_Name: 'NewScript' },
    };
    const variant: ParsedPrefab = {
      objects: [localObj],
      variantInfo: {
        basePrefabGuid: 'abc123',
        modifications: [],
      },
    };

    const result = applyModifications(base, variant);
    // base had 2 objects, variant adds 1
    expect(result.objects).toHaveLength(3);
    expect(result.objects[2].id).toBe('300');
    expect(result.objects[2].typeStr).toBe('MonoBehaviour');
  });

  it('does not mutate the original base parsed object', () => {
    const base = makeBaseParsed();
    const originalName = base.objects[0].properties.m_Name;
    const variant: ParsedPrefab = {
      objects: [],
      variantInfo: {
        basePrefabGuid: 'abc123',
        modifications: [
          {
            targetFileId: '100',
            propertyPath: 'm_Name',
            value: 'Changed',
          },
        ],
      },
    };

    applyModifications(base, variant);
    expect(base.objects[0].properties.m_Name).toBe(originalName);
  });
});
