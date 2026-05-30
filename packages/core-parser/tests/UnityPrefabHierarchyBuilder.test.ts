import { test, expect } from 'vitest';
import { UnityPrefabCompleteParser } from '../src/core/UnityPrefabCompleteParser';
import { UnityPrefabHierarchyBuilder } from '../src/core/UnityPrefabHierarchyBuilder';
import { ILocalRepoProvider } from '../src/providers/ILocalRepoProvider';
import * as fs from 'fs';
import * as path from 'path';

class LocalProvider implements ILocalRepoProvider {
  constructor(private root: string) {}

  async findPrefabByGuid(guid: string): Promise<string | null> {
    if (guid === 'd95e05825f62eda42b0480fc4189b298') {
      return fs.readFileSync(path.join(this.root, 'Assets/Prefab/Square2Images.prefab'), 'utf-8');
    }
    return null;
  }

  async getScriptGuidMap(): Promise<Map<string, string>> {
    return new Map();
  }
}

test('Prefab variant content is properly nested in the hierarchy', async () => {
  const rootDir = path.resolve(__dirname, '../../../unity-test-project');
  const provider = new LocalProvider(rootDir);
  const variantYaml = fs.readFileSync(path.join(rootDir, 'Assets/Prefab/Square2ImagesVariant.prefab'), 'utf-8');
  const parsed = await UnityPrefabCompleteParser.parse(variantYaml, provider);
  const roots = UnityPrefabHierarchyBuilder.build(parsed.objects);

  expect(roots).toHaveLength(1);
  const rootNode = roots[0];
  expect(rootNode.gameObject.properties.m_Name).toBe('Square2ImagesVariant');

  const childNames = rootNode.children.map(c => c.gameObject.properties.m_Name);
  expect(childNames).toContain('Image (1)');
  expect(childNames).toContain('Image_2 (1)');
  expect(childNames).toContain('Image');
  expect(childNames).toContain('Image_2');
});
