const fs = require('fs');
const { parseUnityYaml, buildHierarchy, applyModifications } = require('../dist');
const { renderHierarchy } = require('@unity-asset-viewer/core-renderer');

const samplePrefab = fs.readFileSync('C:/Users/User/.gemini/antigravity/brain/e9e53762-57b3-4367-87fa-2f8d6c0080e1/.system_generated/steps/457/content.md', 'utf8');

const parsed = parseUnityYaml(samplePrefab);
console.log("Parsed objects count:", parsed.objects.length);

const transforms = parsed.objects.filter(obj => obj.typeStr === 'Transform' || obj.typeStr === 'RectTransform');
console.log("Transforms count:", transforms.length);

transforms.forEach(t => {
  const goId = t.properties.m_GameObject?.fileID?.toString();
  console.log(`Transform ID: ${t.id}, GameObject ID: ${goId}`);
  const parentId = t.properties.m_Father?.fileID?.toString();
  console.log(`  Parent ID: ${parentId}`);
});

const hierarchy = buildHierarchy(parsed.objects);
console.log("Hierarchy root count:", hierarchy.length);
