import { HierarchyNode, UnityObject } from '@unity-asset-viewer/core-parser';

/**
 * Well-known Unity script GUIDs → human-readable names.
 * These are the GUIDs Unity uses for built-in UI components.
 */
const KNOWN_SCRIPT_GUIDS: Record<string, string> = {
  'fe87c0e1cc204ed48ad3b37840f39efc': 'Image',
  'f4688fdb7df04437aeb418b961361dc5': 'TextMeshProUGUI',
  '1344c3c82d62a2a41a3576d8abb8e3ea': 'TextMeshPro',
  '4e29b573a2db71c488bc2e7ea672d6e7': 'Button',
  '2a4db7a114972834c8e4117be1d82ba3': 'Canvas',
  '1367256f5765c6749a3d74b6e50bff65': 'CanvasScaler',
  '0cd44c1031e13a943bb63640046fad76': 'GraphicRaycaster',
  '4e097bff4e851b74d904e5e5c4a9bd68': 'Toggle',
  '1aa08ab6e0e44e3404f5110e5f886c56': 'ScrollRect',
  '30649d3a9faa99c48a7b1166b86bf2a0': 'Slider',
  'cc11f24cf0dad7643b745e89a5c0bd28': 'InputField',
  'b5f852f95e462c54fb684b8e40ffe685': 'InputFieldTMP',
  'd199490a83bb4e845b4e73b4beb2a29c': 'LayoutElement',
  '3245ec927659c4140ac6dcff0d3908b4': 'HorizontalLayoutGroup',
  '30649d3a9faa99c44a7b1166b86bf2a0': 'VerticalLayoutGroup',
  '59f8146938fff824cb2e9ae9eaae4e69': 'GridLayoutGroup',
  'ef17fee4e8e2aa44ab1a2cd626e38a6a': 'ContentSizeFitter',
  '306cc22290013e746bf78c85d4d20ba0': 'AspectRatioFitter',
  'aedde3d9a5c19f040b90abd32018041f': 'Mask',
  '31a19414c41e5ae4aae2af33c9f705f5': 'RectMask2D',
  '5f7201a12d95ffc409449d95f23cf332': 'Text',
  'dc42784cf5484c88ecbe7f57db9c39e4': 'RawImage',
  '80d32ecd40eae61499e95a4cc7a2764e': 'Outline',
  '098311e4738267b44a0a4c00524b924e': 'Shadow',
  'cfabb0440166ab443bba8876756fdfa9': 'Dropdown',
  '2fafe2cfe61f6f942b0385e444a0a30a': 'DropdownTMP',
};

/**
 * Derive a human-readable script name for a MonoBehaviour component.
 */
function getScriptDisplayName(comp: UnityObject, scriptGuidMap?: Map<string, string>): string {
  // Check well-known property patterns first
  if (comp.properties.m_text !== undefined) return 'TextMeshProUGUI';
  if (comp.properties.m_Text !== undefined) return 'Text';
  if (comp.properties.m_Sprite !== undefined) return 'Image';

  // Extract the m_Script GUID
  const scriptRef = comp.properties.m_Script;
  const guid: string = scriptRef?.guid ?? '';

  // Check the local project's script map first (resolves custom scripts)
  if (guid && scriptGuidMap?.has(guid)) {
    return scriptGuidMap.get(guid)!;
  }

  // Fall back to well-known built-in Unity GUIDs
  if (guid && KNOWN_SCRIPT_GUIDS[guid]) {
    return KNOWN_SCRIPT_GUIDS[guid];
  }

  // Check m_EditorClassIdentifier for a class name hint
  const classId = comp.properties.m_EditorClassIdentifier;
  if (classId && typeof classId === 'string' && classId.trim().length > 0) {
    // Format: "Assembly/Namespace/ClassName" — take the last part
    const parts = classId.split('/');
    return parts[parts.length - 1] || `Script (${guid.substring(0, 8)}…)`;
  }

  // Fallback: show truncated GUID if available
  if (guid) {
    return `Script (${guid.substring(0, 8)}…)`;
  }

  return 'MonoBehaviour';
}

export function renderHierarchy(nodes: HierarchyNode[], scriptGuidMap?: Map<string, string>): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'unity-viewer-layout';
  wrapper.style.display = 'flex';
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  wrapper.style.fontFamily = 'sans-serif';
  wrapper.style.color = '#fff';

  // --- Left Side: Visual Render ---
  const viewport = document.createElement('div');
  viewport.className = 'unity-render-viewport';
  viewport.style.flex = '1';
  viewport.style.position = 'relative';
  viewport.style.overflow = 'hidden';
  // Default Unity skybox gradient
  viewport.style.background = 'linear-gradient(to bottom, #314D79 0%, #76899A 50%, #4B4B4B 50%, #222222 100%)';

  const container = document.createElement('div');
  container.className = 'unity-prefab-container';
  container.style.position = 'absolute';
  container.style.left = '0';
  container.style.right = '0';
  container.style.top = '0';
  container.style.bottom = '0';
  
  for (const node of nodes) {
    const el = renderNode(node);
    if (el) container.appendChild(el);
  }
  viewport.appendChild(container);

  // --- Right Side: Hierarchy Panel ---
  const hierarchyPanel = document.createElement('div');
  hierarchyPanel.className = 'unity-hierarchy-panel';
  hierarchyPanel.style.width = '300px';
  hierarchyPanel.style.backgroundColor = '#383838'; // Unity Dark Theme
  hierarchyPanel.style.borderLeft = '1px solid #222';
  hierarchyPanel.style.overflowY = 'auto';
  hierarchyPanel.style.padding = '8px';
  hierarchyPanel.style.fontSize = '13px';
  hierarchyPanel.style.lineHeight = '1.4';

  const hierarchyTitle = document.createElement('div');
  hierarchyTitle.textContent = 'Hierarchy';
  hierarchyTitle.style.fontWeight = 'bold';
  hierarchyTitle.style.marginBottom = '10px';
  hierarchyTitle.style.paddingBottom = '4px';
  hierarchyTitle.style.borderBottom = '1px solid #222';
  hierarchyPanel.appendChild(hierarchyTitle);

  for (const node of nodes) {
    hierarchyPanel.appendChild(buildHierarchyTree(node, scriptGuidMap));
  }

  wrapper.appendChild(viewport);
  wrapper.appendChild(hierarchyPanel);

  return wrapper;
}

function buildHierarchyTree(node: HierarchyNode, scriptGuidMap?: Map<string, string>): HTMLElement {
  const item = document.createElement('div');
  item.style.paddingLeft = '14px'; // Indent for children
  item.style.marginTop = '2px';
  
  const label = document.createElement('div');
  label.textContent = `🧊 ${node.gameObject.properties.m_Name || 'GameObject'}`;
  label.style.cursor = 'default';
  label.style.padding = '2px 4px';
  label.style.borderRadius = '3px';
  label.addEventListener('mouseover', () => label.style.backgroundColor = '#444');
  label.addEventListener('mouseout', () => label.style.backgroundColor = 'transparent');
  
  item.appendChild(label);
  
  const childrenContainer = document.createElement('div');
  
  // Render Components as collapsible children
  if (node.components && node.components.length > 0) {
    const compsContainer = document.createElement('div');
    compsContainer.style.paddingLeft = '14px';
    compsContainer.style.borderLeft = '1px dashed #555';
    compsContainer.style.marginBottom = '4px';
    compsContainer.style.display = 'none'; // collapsed by default
    
    label.style.cursor = 'pointer';
    label.addEventListener('click', (e) => {
      e.stopPropagation();
      compsContainer.style.display = compsContainer.style.display === 'none' ? 'block' : 'none';
    });

    for (const comp of node.components) {
      const compLabel = document.createElement('div');
      let compName = comp.typeStr;
      if (compName === 'MonoBehaviour') {
        compName = getScriptDisplayName(comp, scriptGuidMap);
      }
      compLabel.textContent = `🧩 ${compName}`;
      compLabel.style.color = '#9cdcfe'; // Unity component color in some themes
      compLabel.style.fontSize = '12px';
      compLabel.style.padding = '1px 4px';
      compsContainer.appendChild(compLabel);
    }
    item.appendChild(compsContainer);
  }

  for (const child of node.children) {
    childrenContainer.appendChild(buildHierarchyTree(child, scriptGuidMap));
  }
  item.appendChild(childrenContainer);
  
  return item;
}

function renderNode(node: HierarchyNode): HTMLElement | null {
  const rectTransform = node.components.find(c => c.typeStr === 'RectTransform');
  if (!rectTransform) {
    // Only UI objects have RectTransform, skip non-UI for now
    return null;
  }

  const el = document.createElement('div');
  el.className = `unity-go unity-go-${node.gameObject.properties.m_Name?.replace(/[^a-zA-Z0-9-]/g, '-') || 'unnamed'}`;
  el.style.position = 'absolute';
  el.style.boxSizing = 'border-box';
  
  // Apply RectTransform styling
  applyRectTransform(el, rectTransform.properties);

  // RectTransform outline
  el.style.border = '1px solid red';

  // Simple rendering of specific components
  const image = node.components.find(c => c.typeStr === 'Image' || (c.typeStr === 'MonoBehaviour' && c.properties.m_Sprite !== undefined));
  if (image) {
    const color = image.properties.m_Color;
    if (color) {
      el.style.backgroundColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
    } else {
      el.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; // default translucent
    }
  }

  // Text / TextMeshPro
  const textComp = node.components.find(c => c.typeStr === 'Text' || (c.typeStr === 'MonoBehaviour' && c.properties.m_text !== undefined) || c.properties.m_Text !== undefined);
  if (textComp) {
    const textEl = document.createElement('div');
    textEl.style.width = '100%';
    textEl.style.height = '100%';
    textEl.style.display = 'flex';
    textEl.style.alignItems = 'center';
    textEl.style.justifyContent = 'center';
    textEl.style.overflow = 'hidden';
    textEl.style.fontSize = (textComp.properties.m_fontSize || textComp.properties.m_FontSize || 14) + 'px';
    
    const textStr = textComp.properties.m_text || textComp.properties.m_Text || '';
    textEl.textContent = textStr;
    
    const color = textComp.properties.m_fontColor || textComp.properties.m_Color;
    if (color) {
      textEl.style.color = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a || 1})`;
    } else {
      textEl.style.color = '#fff';
    }
    
    el.appendChild(textEl);
  }

  // Children
  for (const child of node.children) {
    const childEl = renderNode(child);
    if (childEl) {
      el.appendChild(childEl);
    }
  }

  return el;
}

function applyRectTransform(el: HTMLElement, props: any) {
  const aMin = props.m_AnchorMin || { x: 0.5, y: 0.5 };
  const aMax = props.m_AnchorMax || { x: 0.5, y: 0.5 };
  const pivot = props.m_Pivot || { x: 0.5, y: 0.5 };
  const pos = props.m_AnchoredPosition || { x: 0, y: 0 };
  const size = props.m_SizeDelta || { x: 0, y: 0 };

  const anchorWidth = (aMax.x - aMin.x) * 100;
  const anchorHeight = (aMax.y - aMin.y) * 100;

  // Use CSS variables for width and height so we can reference them
  el.style.setProperty('--w', `calc(${anchorWidth}% + ${size.x}px)`);
  el.style.setProperty('--h', `calc(${anchorHeight}% + ${size.y}px)`);
  
  el.style.width = 'var(--w)';
  el.style.height = 'var(--h)';

  // Calculate left and bottom edges based on anchor, position, and pivot
  el.style.left = `calc(${aMin.x * 100}% + ${pos.x}px - calc(var(--w) * ${pivot.x}))`;
  el.style.bottom = `calc(${aMin.y * 100}% + ${pos.y}px - calc(var(--h) * ${pivot.y}))`;
}
