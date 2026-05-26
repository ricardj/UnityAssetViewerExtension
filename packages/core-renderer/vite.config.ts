import { defineConfig } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

// Dynamically read the Unity project root from the preview metadata
// so Vite can serve local asset files (images, prefabs) via /@fs/
function getUnityProjectRoot(): string | null {
  try {
    const metaPath = path.resolve(__dirname, 'tmp/preview-meta.json');
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (meta.unityProjectRoot) {
        return meta.unityProjectRoot.replace(/\\/g, '/');
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

const unityRoot = getUnityProjectRoot();
const extraAllowDirs = unityRoot ? [unityRoot] : [];

export default defineConfig({
  server: {
    fs: {
      // '..' allows access to sibling packages in the monorepo.
      // The unity project root allows Vite to serve asset files (sprites, prefabs).
      allow: ['..', ...extraAllowDirs]
    }
  }
});
