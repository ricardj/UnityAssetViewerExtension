import { parseUnityYaml, buildHierarchy } from '@unity-asset-viewer/core-parser';
import { renderHierarchy } from '@unity-asset-viewer/core-renderer';

window.addEventListener('message', event => {
  const message = event.data;
  
  if (message.command === 'parse') {
    try {
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = ''; // Clear previous content
        
        // Parse the prefab yaml text
        const parsed = parseUnityYaml(message.text);
        const nodes = buildHierarchy(parsed.objects);
        
        // Render the nodes
        const element = renderHierarchy(nodes);
        
        // Append to our root div
        root.appendChild(element);
      }
    } catch (error: any) {
      console.error('Failed to parse or render prefab:', error);
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = `<div style="color: red; padding: 20px;">Failed to render prefab: ${error.message}</div>`;
      }
    }
  }
});
