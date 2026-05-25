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

// Icons for well-known component types (matching Unity editor style)
const COMPONENT_ICONS: Record<string, string> = {
  'Transform': '🔄',
  'RectTransform': '🔲',
  'Canvas': '🖼️',
  'CanvasRenderer': '🎨',
  'CanvasScaler': '📐',
  'GraphicRaycaster': '🎯',
  'Image': '🖼️',
  'RawImage': '🖼️',
  'Text': '📝',
  'TextMeshProUGUI': '📝',
  'TextMeshPro': '📝',
  'Button': '🔘',
  'Toggle': '☑️',
  'Slider': '🎚️',
  'ScrollRect': '📜',
  'InputField': '📝',
  'InputFieldTMP': '📝',
  'Dropdown': '📋',
  'DropdownTMP': '📋',
  'LayoutElement': '📐',
  'HorizontalLayoutGroup': '↔️',
  'VerticalLayoutGroup': '↕️',
  'GridLayoutGroup': '⊞',
  'ContentSizeFitter': '📏',
  'AspectRatioFitter': '📏',
  'Mask': '🎭',
  'RectMask2D': '🎭',
  'Outline': '✏️',
  'Shadow': '🌑',
  'MonoBehaviour': '📜',
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

function getComponentIcon(name: string): string {
  return COMPONENT_ICONS[name] || '🧩';
}

export function renderHierarchy(nodes: HierarchyNode[], scriptGuidMap?: Map<string, string>): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'unity-viewer-layout';
  wrapper.style.display = 'flex';
  wrapper.style.width = '100%';
  wrapper.style.height = '100%';
  wrapper.style.fontFamily = 'sans-serif';
  wrapper.style.color = '#fff';

  // --- Left: Visual Render ---
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
    const el = renderNode(node, true);
    if (el) container.appendChild(el);
  }
  viewport.appendChild(container);

  // --- Right: Hierarchy Panel (with components as tree children) ---
  const hierarchyPanel = document.createElement('div');
  hierarchyPanel.className = 'unity-hierarchy-panel';
  hierarchyPanel.style.width = '280px';
  hierarchyPanel.style.backgroundColor = '#383838';
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

/**
 * Build the hierarchy tree with GameObjects AND their components as child nodes.
 */
function buildHierarchyTree(node: HierarchyNode, scriptGuidMap?: Map<string, string>): HTMLElement {
  const item = document.createElement('div');
  item.style.paddingLeft = '14px';
  item.style.marginTop = '2px';
  
  const label = document.createElement('div');
  label.className = 'unity-hierarchy-item';
  label.setAttribute('data-id', node.gameObject.id);
  label.style.display = 'flex';
  label.style.alignItems = 'center';
  
  const hasExpandableContent = (node.children && node.children.length > 0) || (node.components && node.components.length > 0);
  
  const toggleIcon = document.createElement('span');
  toggleIcon.textContent = hasExpandableContent ? '▼ ' : '  ';
  toggleIcon.style.marginRight = '4px';
  toggleIcon.style.fontSize = '10px';
  toggleIcon.style.width = '12px';
  toggleIcon.style.display = 'inline-block';
  toggleIcon.style.cursor = hasExpandableContent ? 'pointer' : 'default';
  toggleIcon.style.userSelect = 'none';
  
  const text = document.createElement('span');
  text.textContent = `🧊 ${node.gameObject.properties.m_Name || 'GameObject'}`;
  text.style.cursor = 'pointer';
  text.style.padding = '2px 4px';
  text.style.borderRadius = '3px';
  text.style.flex = '1';
  
  label.appendChild(toggleIcon);
  label.appendChild(text);
  
  text.addEventListener('mouseover', () => {
    if (label.style.backgroundColor !== 'rgb(44, 93, 135)') {
      label.style.backgroundColor = '#444';
    }
  });
  text.addEventListener('mouseout', () => {
    if (label.style.backgroundColor !== 'rgb(44, 93, 135)') {
      label.style.backgroundColor = 'transparent';
    }
  });
  
  item.appendChild(label);
  
  // Container for components + child GameObjects
  const childrenContainer = document.createElement('div');

  // Add components as child nodes under the GameObject
  if (node.components && node.components.length > 0) {
    for (const comp of node.components) {
      const compItem = document.createElement('div');
      compItem.style.paddingLeft = '14px';
      compItem.style.marginTop = '1px';
      
      const compLabel = document.createElement('div');
      compLabel.className = 'unity-hierarchy-component';
      compLabel.style.display = 'flex';
      compLabel.style.alignItems = 'center';
      compLabel.style.padding = '1px 4px';
      compLabel.style.borderRadius = '3px';
      compLabel.style.color = '#9cdcfe';
      compLabel.style.fontSize = '12px';
      
      let compName = comp.typeStr;
      if (compName === 'MonoBehaviour') {
        compName = getScriptDisplayName(comp, scriptGuidMap);
      }
      
      const icon = getComponentIcon(compName);
      compLabel.textContent = `${icon} ${compName}`;
      
      compLabel.addEventListener('mouseover', () => {
        compLabel.style.backgroundColor = '#444';
      });
      compLabel.addEventListener('mouseout', () => {
        compLabel.style.backgroundColor = 'transparent';
      });
      
      compItem.appendChild(compLabel);
      childrenContainer.appendChild(compItem);
    }
  }
  
  // Add child GameObjects
  for (const child of node.children) {
    childrenContainer.appendChild(buildHierarchyTree(child, scriptGuidMap));
  }
  
  // Toggle expand/collapse
  toggleIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    if (hasExpandableContent) {
      const isCollapsed = childrenContainer.style.display === 'none';
      childrenContainer.style.display = isCollapsed ? 'block' : 'none';
      toggleIcon.textContent = isCollapsed ? '▼ ' : '▶ ';
    }
  });
  
  item.appendChild(childrenContainer);
  
  return item;
}

// ─── Visual Renderer ───────────────────────────────────────────────

function renderNode(node: HierarchyNode, isRoot: boolean = false): HTMLElement | null {
  const rectTransform = node.components.find(c => c.typeStr === 'RectTransform');
  if (!rectTransform) {
    // Only UI objects have RectTransform, skip non-UI for now
    return null;
  }

  const el = document.createElement('div');
  el.className = `unity-go unity-go-${node.gameObject.properties.m_Name?.replace(/[^a-zA-Z0-9-]/g, '-') || 'unnamed'}`;
  el.style.position = 'absolute';
  el.style.boxSizing = 'border-box';

  const hasCanvas = node.components.some(c => c.typeStr === 'Canvas');

  if (isRoot && hasCanvas) {
    // Root Canvas: fill the entire viewport, like Unity's Screen Space - Overlay
    applyRootCanvas(el, node);
  } else {
    // Standard RectTransform layout
    applyRectTransform(el, rectTransform.properties);
  }

  // Blue RectTransform wireframe outline (matching Unity's blue rect handles)
  el.style.outline = '1px solid rgba(68, 140, 255, 0.6)';
  el.style.outlineOffset = '-1px';

  // Apply visual components (Image, Text, etc.)
  applyVisualComponents(el, node);

  // Children
  for (const child of node.children) {
    const childEl = renderNode(child, false);
    if (childEl) {
      el.appendChild(childEl);
    }
  }

  return el;
}

/**
 * Root canvas fills the viewport like Unity's Screen Space - Overlay mode.
 * We look at CanvasScaler reference resolution to determine the aspect ratio.
 */
function applyRootCanvas(el: HTMLElement, node: HierarchyNode) {
  // Find CanvasScaler for reference resolution
  const canvasScaler = node.components.find(c => {
    if (c.typeStr === 'CanvasScaler') return true;
    if (c.typeStr === 'MonoBehaviour') {
      const guid = c.properties.m_Script?.guid;
      return guid === '0cd44c1031e13a943bb63640046fad76';
    }
    return false;
  });

  let refWidth = 1920;
  let refHeight = 1080;

  if (canvasScaler) {
    const refRes = canvasScaler.properties.m_ReferenceResolution;
    if (refRes) {
      refWidth = refRes.x || refWidth;
      refHeight = refRes.y || refHeight;
    }
  }

  // Fill viewport while maintaining reference resolution aspect ratio
  el.style.left = '0';
  el.style.top = '0';
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.position = 'relative';
  el.style.overflow = 'hidden';
}

function applyVisualComponents(el: HTMLElement, node: HierarchyNode) {
  // Image component
  const image = node.components.find(c =>
    c.typeStr === 'Image' ||
    (c.typeStr === 'MonoBehaviour' && c.properties.m_Sprite !== undefined)
  );
  if (image) {
    const color = image.properties.m_Color;
    if (color) {
      el.style.backgroundColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
    } else {
      el.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    }
  }

  // Text / TextMeshPro
  const textComp = node.components.find(c =>
    c.typeStr === 'Text' ||
    (c.typeStr === 'MonoBehaviour' && c.properties.m_text !== undefined) ||
    c.properties.m_Text !== undefined
  );
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
}

/**
 * Apply RectTransform positioning the Unity way.
 *
 * Unity RectTransform layout:
 *   - Anchors (AnchorMin/AnchorMax) define a reference rectangle within the parent as fractions (0..1)
 *   - When anchors are the same point → element has a fixed size (SizeDelta = width/height)
 *   - When anchors form a rect → element stretches, SizeDelta becomes padding/insets
 *   - AnchoredPosition is the offset of the pivot from the anchor center
 *   - Pivot defines the element's own origin point (0..1)
 *
 * Unity uses a bottom-left origin system. In CSS we also use bottom-left by setting
 * `bottom` and `left` instead of `top`.
 */
function applyRectTransform(el: HTMLElement, props: any) {
  const aMin = props.m_AnchorMin || { x: 0.5, y: 0.5 };
  const aMax = props.m_AnchorMax || { x: 0.5, y: 0.5 };
  const pivot = props.m_Pivot || { x: 0.5, y: 0.5 };
  const pos = props.m_AnchoredPosition || { x: 0, y: 0 };
  const size = props.m_SizeDelta || { x: 100, y: 100 };
  const scale = props.m_LocalScale || { x: 1, y: 1, z: 1 };
  const rotation = props.m_LocalRotation || { x: 0, y: 0, z: 0, w: 1 };

  // Determine if anchors are a point (same min/max) or a stretch region
  const isStretchX = Math.abs(aMax.x - aMin.x) > 0.001;
  const isStretchY = Math.abs(aMax.y - aMin.y) > 0.001;

  if (isStretchX) {
    // Stretched horizontally: SizeDelta.x becomes negative inset (left/right padding)
    // In Unity: left = anchorMin.x * parentWidth - sizeDelta.x * 0.5 (approx)
    // More precisely, offsetMin.x and offsetMax.x are used
    // offsetMin.x = anchoredPosition.x - sizeDelta.x * pivot.x
    // offsetMax.x = anchoredPosition.x + sizeDelta.x * (1 - pivot.x)
    const offsetMinX = pos.x - size.x * pivot.x;
    const offsetMaxX = pos.x + size.x * (1 - pivot.x);
    el.style.left = `calc(${aMin.x * 100}% + ${offsetMinX}px)`;
    el.style.right = `calc(${(1 - aMax.x) * 100}% - ${offsetMaxX}px)`;
    el.style.width = 'auto';
  } else {
    // Fixed width
    el.style.width = `${size.x}px`;
    // Left edge = anchor position + offset - pivot * size
    el.style.left = `calc(${aMin.x * 100}% + ${pos.x}px - ${size.x * pivot.x}px)`;
  }

  if (isStretchY) {
    // Stretched vertically (using bottom/top)
    const offsetMinY = pos.y - size.y * pivot.y;
    const offsetMaxY = pos.y + size.y * (1 - pivot.y);
    el.style.bottom = `calc(${aMin.y * 100}% + ${offsetMinY}px)`;
    el.style.top = `calc(${(1 - aMax.y) * 100}% - ${offsetMaxY}px)`;
    el.style.height = 'auto';
  } else {
    // Fixed height
    el.style.height = `${size.y}px`;
    el.style.bottom = `calc(${aMin.y * 100}% + ${pos.y}px - ${size.y * pivot.y}px)`;
  }

  // CSS transform-origin: pivot.x from left, (1-pivot.y) from top (CSS Y is inverted)
  el.style.transformOrigin = `${pivot.x * 100}% ${(1 - pivot.y) * 100}%`;

  let transformStr = '';
  
  // Apply scale
  if (scale.x !== 1 || scale.y !== 1) {
    transformStr += `scale(${scale.x}, ${scale.y})`;
  }
  
  // Convert quaternion to 2D Z-rotation angle
  if (rotation.w !== undefined && rotation.z !== undefined) {
    let angleRad = 2 * Math.acos(Math.min(Math.max(rotation.w, -1), 1));
    if (rotation.z < 0) angleRad = -angleRad;
    const angleDeg = angleRad * (180 / Math.PI);
    if (Math.abs(angleDeg) > 0.01) {
      // CSS rotates clockwise, Unity positive Z is counter-clockwise
      transformStr += ` rotate(${-angleDeg}deg)`;
    }
  }

  if (transformStr.trim()) {
    el.style.transform = transformStr.trim();
  }
}
