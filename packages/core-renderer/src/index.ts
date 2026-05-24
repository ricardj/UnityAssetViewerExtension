import { HierarchyNode, UnityObject } from '@unity-asset-viewer/core-parser';

export function renderHierarchy(nodes: HierarchyNode[]): HTMLElement {
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
    hierarchyPanel.appendChild(buildHierarchyTree(node));
  }

  wrapper.appendChild(viewport);
  wrapper.appendChild(hierarchyPanel);

  return wrapper;
}

function buildHierarchyTree(node: HierarchyNode): HTMLElement {
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
        if (comp.properties.m_text !== undefined) compName = 'TextMeshProUGUI';
        else if (comp.properties.m_Sprite !== undefined) compName = 'Image (Script)';
        else compName = 'Script Component';
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
    childrenContainer.appendChild(buildHierarchyTree(child));
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
