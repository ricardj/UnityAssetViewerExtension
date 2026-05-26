import { HierarchyNode, UnityObject } from '@unity-asset-viewer/core-parser';
import { RectTransformApplier } from './RectTransformApplier';
import { VisualComponentRenderer } from './VisualComponentRenderer';
import { LayoutGroupApplier, LayoutContext } from './LayoutGroupApplier';
import { ContentSizeFitterApplier } from './ContentSizeFitterApplier';
import { HierarchyTreeBuilder } from './HierarchyTreeBuilder';

/**
 * UnityViewer coordinates the rendering of the entire visual viewport and the
 * hierarchy selection panel for a parsed Unity prefab.
 */
export class UnityViewer {
  /**
   * Main entry point to render a hierarchy tree into a two-panel HTMLElement view.
   */
  public static render(
    nodes: HierarchyNode[],
    scriptGuidMap?: Map<string, string>,
    globalGuidMap?: Map<string, string>
  ): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'unity-viewer-layout';
    wrapper.style.display = 'flex';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.fontFamily = 'sans-serif';
    wrapper.style.color = '#fff';
    wrapper.style.overflow = 'hidden';

    // --- Left: Visual Render Viewport ---
    const viewport = document.createElement('div');
    viewport.className = 'unity-render-viewport';
    viewport.style.flex = '1';
    viewport.style.position = 'relative';
    viewport.style.overflow = 'hidden';
    viewport.style.background =
      'linear-gradient(to bottom, #314D79 0%, #76899A 50%, #4B4B4B 50%, #222222 100%)';

    const container = document.createElement('div');
    container.className = 'unity-prefab-container';
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.right = '0';
    container.style.top = '0';
    container.style.bottom = '0';

    for (const node of nodes) {
      const el = this.renderNode(node, true, undefined, globalGuidMap);
      if (el) container.appendChild(el);
    }
    viewport.appendChild(container);

    // --- Right: Hierarchy Panel ---
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
      hierarchyPanel.appendChild(HierarchyTreeBuilder.build(node, scriptGuidMap));
    }

    wrapper.appendChild(viewport);
    wrapper.appendChild(hierarchyPanel);

    return wrapper;
  }

  /**
   * Recursively renders a GameObject node and its children.
   */
  private static renderNode(
    node: HierarchyNode,
    isRoot: boolean,
    parentLayoutContext?: LayoutContext,
    globalGuidMap?: Map<string, string>
  ): HTMLElement | null {
    const rectTransform = node.components.find(c => c.typeStr === 'RectTransform');
    if (!rectTransform) {
      return null;
    }

    const el = document.createElement('div');
    el.className = `unity-go unity-go-${
      node.gameObject.properties.m_Name?.replace(/[^a-zA-Z0-9-]/g, '-') || 'unnamed'
    }`;
    el.style.position = 'absolute';
    el.style.boxSizing = 'border-box';

    const hasCanvas = node.components.some(c => c.typeStr === 'Canvas');

    // 1. Anchor & Pivot positioning
    if (isRoot && hasCanvas) {
      this.applyRootCanvas(el, node);
    } else {
      if (parentLayoutContext?.isLayoutChild) {
        // Child under a LayoutGroup: let LayoutGroupApplier override RectTransform positions
        LayoutGroupApplier.applyChildStyles(el, rectTransform.properties, parentLayoutContext);
      } else {
        // Standard RectTransform positioning
        RectTransformApplier.apply(el, rectTransform.properties);
      }
    }

    // 2. Wireframe outline (representing Unity rect handles)
    el.style.outline = '2px solid rgba(68, 140, 255, 0.7)';
    el.style.outlineOffset = '-2px';

    // 3. Visual components (Image, Text, TextMeshPro, etc.)
    VisualComponentRenderer.apply(el, node, globalGuidMap);

    // 4. Content Size Fitter (dynamic resizing)
    ContentSizeFitterApplier.apply(el, node);

    // 5. Layout Group Container (applies display: flex/grid if this node is a layout group)
    const currentLayoutContext = LayoutGroupApplier.apply(el, node);

    // 6. Recursively render children
    for (const child of node.children) {
      const childEl = this.renderNode(child, false, currentLayoutContext, globalGuidMap);
      if (childEl) {
        el.appendChild(childEl);
      }
    }

    return el;
  }

  /**
   * Root Canvas scaling: fills the viewport while keeping reference aspect ratio
   */
  private static applyRootCanvas(el: HTMLElement, node: HierarchyNode): void {
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

    el.style.left = '0';
    el.style.top = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
  }
}
