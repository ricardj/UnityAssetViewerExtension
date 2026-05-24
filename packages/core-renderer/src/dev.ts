import { parseUnityYaml, buildHierarchy } from '@unity-asset-viewer/core-parser';
import { renderHierarchy } from './index';

// We fetch the raw text of the sample prefab.
// Vite serves files from the workspace root or local folders depending on config,
// so we can use a relative path, but importing it as raw text is easier.
import samplePrefab from '../../core-parser/tests/sample.prefab?raw';

function init() {
  const objects = parseUnityYaml(samplePrefab);
  console.log('Parsed Objects:', objects);
  
  const hierarchy = buildHierarchy(objects);
  console.log('Hierarchy:', hierarchy);
  
  const rootEl = renderHierarchy(hierarchy);
  document.getElementById('app')!.appendChild(rootEl);
}

init();
