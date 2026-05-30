import { IHierarchyNode } from '@unity-asset-viewer/core-parser';
import { RectTransformApplier } from '../appliers/RectTransformApplier';
import { VisualComponentRenderer } from './VisualComponentRenderer';
import { LayoutGroupApplier } from '../appliers/LayoutGroupApplier';
import { ILayoutContext } from '../context/ILayoutContext';
import { ContentSizeFitterApplier } from '../appliers/ContentSizeFitterApplier';
import { HierarchyTreeBuilder } from './HierarchyTreeBuilder';
import { ThemeConfig } from '../config/ThemeConfig';

/**
 * UnityViewer coordinates the rendering of the entire visual viewport and the
 * hierarchy selection panel for a parsed Unity prefab.
 */
export class UnityViewer {
  /**
   * Main entry point to render a hierarchy tree into a two-panel HTMLElement view.
   */
  public static render(
    nodes: IHierarchyNode[],
    scriptGuidMap?: Map<string, string>,
    globalGuidMap?: Map<string, string>
  ): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'unity-viewer-layout';
    wrapper.style.display = 'flex';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.fontFamily = 'sans-serif';
    wrapper.style.color = 'var(--uv-text)';
    wrapper.style.overflow = 'hidden';

    // Setup initial theme
    ThemeConfig.applyThemeVariables(wrapper);

    // --- Left: Visual Render Viewport ---
    const viewport = document.createElement('div');
    viewport.className = 'unity-render-viewport';
    viewport.style.flex = '1';
    viewport.style.position = 'relative';
    viewport.style.overflow = 'hidden';
    viewport.style.background = 'var(--uv-bg)';

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
    hierarchyPanel.style.backgroundColor = 'var(--uv-panel-bg)';
    hierarchyPanel.style.borderLeft = '1px solid var(--uv-border)';
    hierarchyPanel.style.overflowY = 'auto';
    hierarchyPanel.style.padding = '8px';
    hierarchyPanel.style.fontSize = '13px';
    hierarchyPanel.style.lineHeight = '1.4';

    const hierarchyTitle = document.createElement('div');
    hierarchyTitle.style.display = 'flex';
    hierarchyTitle.style.justifyContent = 'space-between';
    hierarchyTitle.style.alignItems = 'center';
    hierarchyTitle.style.fontWeight = 'bold';
    hierarchyTitle.style.marginBottom = '10px';
    hierarchyTitle.style.paddingBottom = '4px';
    hierarchyTitle.style.borderBottom = '1px solid var(--uv-border)';

    const hierarchyTitleText = document.createElement('span');
    hierarchyTitleText.textContent = 'Hierarchy';
    hierarchyTitle.appendChild(hierarchyTitleText);

    const themeToggle = document.createElement('button');
    themeToggle.textContent = ThemeConfig.getMode() === 'light' ? '🌙' : '☀️';
    themeToggle.style.background = 'transparent';
    themeToggle.style.border = 'none';
    themeToggle.style.cursor = 'pointer';
    themeToggle.style.fontSize = '14px';
    themeToggle.style.padding = '0';
    themeToggle.title = 'Toggle Theme';

    themeToggle.addEventListener('click', () => {
      const newMode = ThemeConfig.getMode() === 'light' ? 'dark' : 'light';
      ThemeConfig.setMode(newMode);
      ThemeConfig.applyThemeVariables(wrapper, newMode);
      themeToggle.textContent = newMode === 'light' ? '🌙' : '☀️';
    });

    hierarchyTitle.appendChild(themeToggle);
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
    node: IHierarchyNode,
    isRoot: boolean,
    parentLayoutContext?: ILayoutContext,
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
  private static applyRootCanvas(el: HTMLElement, node: IHierarchyNode): void {
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
