import { HierarchyNode, UnityObject } from '@unity-asset-viewer/core-parser';

export function renderHierarchy(nodes: HierarchyNode[]): HTMLElement {
  const container = document.createElement('div');
  container.className = 'unity-prefab-container';
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.overflow = 'hidden';
  container.style.backgroundColor = '#1e1e1e'; // Default unity canvas background
  container.style.fontFamily = 'sans-serif';
  
  for (const node of nodes) {
    const el = renderNode(node);
    if (el) {
      container.appendChild(el);
    }
  }
  
  return container;
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

  // Simple rendering of specific components
  const image = node.components.find(c => c.typeStr === 'Image');
  if (image) {
    const color = image.properties.m_Color;
    if (color) {
      el.style.backgroundColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
    } else {
      el.style.backgroundColor = '#ffffff';
    }
    // Set border to make transparent images visible in debug
    el.style.border = '1px solid rgba(255, 255, 255, 0.2)';
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
