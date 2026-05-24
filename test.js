const fs = require('fs');
const { parseUnityYaml, buildHierarchy, applyModifications } = require('./packages/core-parser/dist/index.js');
const { renderHierarchy } = require('./packages/core-renderer/dist/index.js');

const samplePrefab = fs.readFileSync('./packages/core-parser/tests/sample.prefab', 'utf8');

const parsed = parseUnityYaml(samplePrefab);
console.log("Parsed objects count:", parsed.objects.length);

const hierarchy = buildHierarchy(parsed.objects);
console.log("Hierarchy root count:", hierarchy.length);

if (hierarchy.length > 0) {
  console.log("Root go name:", hierarchy[0].gameObject.properties.m_Name);
  console.log("Root children:", hierarchy[0].children.length);
  if (hierarchy[0].children.length > 0) {
     console.log("Child name:", hierarchy[0].children[0].gameObject.properties.m_Name);
  }
}
