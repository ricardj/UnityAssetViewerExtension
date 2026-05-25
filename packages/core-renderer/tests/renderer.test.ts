import { describe, it, expect } from 'vitest';
import { renderHierarchy } from '../src/index';

// ------------------------------------------------------------------
// Test data helpers — we manually construct HierarchyNode[] that
// mimic what core-parser produces, keeping renderer tests independent
// from the parser.
// ------------------------------------------------------------------

interface UnityObject {
  id: string;
  typeId: string;
  typeStr: string;
  properties: any;
}

interface HierarchyNode {
  gameObject: UnityObject;
  components: UnityObject[];
  children: HierarchyNode[];
}

/** Minimal node with a RectTransform component (makes it renderable). */
function makeRectNode(
  name: string,
  children: HierarchyNode[] = [],
  extraComponents: UnityObject[] = []
): HierarchyNode {
  const goId = String(Math.random()).slice(2, 8);
  const rtId = String(Math.random()).slice(2, 8);
  return {
    gameObject: {
      id: goId,
      typeId: '1',
      typeStr: 'GameObject',
      properties: {
        m_Name: name,
        m_Component: [{ component: { fileID: Number(rtId) } }],
      },
    },
    components: [
      {
        id: rtId,
        typeId: '224',
        typeStr: 'RectTransform',
        properties: {
          m_GameObject: { fileID: Number(goId) },
          m_AnchorMin: { x: 0, y: 0 },
          m_AnchorMax: { x: 1, y: 1 },
          m_AnchoredPosition: { x: 0, y: 0 },
          m_SizeDelta: { x: 0, y: 0 },
          m_Pivot: { x: 0.5, y: 0.5 },
        },
      },
      ...extraComponents,
    ],
    children,
  };
}

/** Node WITHOUT a RectTransform — e.g. a plain 3-D GameObject. */
function makeNonUINode(name: string): HierarchyNode {
  return {
    gameObject: {
      id: '50000',
      typeId: '1',
      typeStr: 'GameObject',
      properties: { m_Name: name, m_Component: [] },
    },
    components: [],
    children: [],
  };
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

describe('renderHierarchy – layout', () => {
  it('returns an HTMLElement with the wrapper class', () => {
    const el = renderHierarchy([]);
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.className).toBe('unity-viewer-layout');
  });

  it('creates a two-panel layout (viewport + hierarchy panel)', () => {
    const el = renderHierarchy([]);
    const viewport = el.querySelector('.unity-render-viewport');
    const hierarchyPanel = el.querySelector('.unity-hierarchy-panel');
    expect(viewport).not.toBeNull();
    expect(hierarchyPanel).not.toBeNull();
  });

  it('uses flex display on the wrapper', () => {
    const el = renderHierarchy([]);
    expect(el.style.display).toBe('flex');
  });

  it('hierarchy panel shows a "Hierarchy" title', () => {
    const el = renderHierarchy([]);
    const panel = el.querySelector('.unity-hierarchy-panel')!;
    expect(panel.firstElementChild!.textContent).toBe('Hierarchy');
  });
});

describe('renderHierarchy – hierarchy tree', () => {
  it('creates tree entries with correct GameObject names', () => {
    const child = makeRectNode('Background');
    const root = makeRectNode('Canvas', [child]);
    const el = renderHierarchy([root]);
    const panel = el.querySelector('.unity-hierarchy-panel')!;

    // The panel should contain text mentioning both names (with the cube emoji prefix)
    expect(panel.textContent).toContain('Canvas');
    expect(panel.textContent).toContain('Background');
  });

  it('nests child entries inside parent entries', () => {
    const child = makeRectNode('ChildNode');
    const root = makeRectNode('ParentNode', [child]);
    const el = renderHierarchy([root]);
    const panel = el.querySelector('.unity-hierarchy-panel')!;

    // The hierarchy title is the first child; the tree item is the second
    const rootItem = panel.children[1] as HTMLElement;
    expect(rootItem).toBeDefined();
    // The root item's text should contain the parent name
    expect(rootItem.textContent).toContain('ParentNode');
    // And the child name should also be nested within
    expect(rootItem.textContent).toContain('ChildNode');
  });
});

describe('renderHierarchy – visual rendering', () => {
  it('renders RectTransform nodes with a red border', () => {
    const node = makeRectNode('Panel');
    const el = renderHierarchy([node]);
    const viewport = el.querySelector('.unity-render-viewport')!;
    const container = viewport.querySelector('.unity-prefab-container')!;

    // The rendered node lives inside the container
    const rendered = container.firstElementChild as HTMLElement;
    expect(rendered).not.toBeNull();
    expect(rendered.style.border).toBe('1px solid red');
  });

  it('applies backgroundColor for Image components with m_Color', () => {
    const imageComp: UnityObject = {
      id: '9001',
      typeId: '114',
      typeStr: 'MonoBehaviour',
      properties: {
        m_Sprite: { fileID: 0 },
        m_Color: { r: 1, g: 0, b: 0, a: 0.8 },
      },
    };
    const node = makeRectNode('RedImage', [], [imageComp]);
    const el = renderHierarchy([node]);
    const viewport = el.querySelector('.unity-render-viewport')!;
    const container = viewport.querySelector('.unity-prefab-container')!;
    const rendered = container.firstElementChild as HTMLElement;

    expect(rendered.style.backgroundColor).toBe('rgba(255, 0, 0, 0.8)');
  });

  it('applies default translucent background for Image without m_Color', () => {
    const imageComp: UnityObject = {
      id: '9002',
      typeId: '114',
      typeStr: 'MonoBehaviour',
      properties: { m_Sprite: { fileID: 0 } },
    };
    const node = makeRectNode('DefaultImage', [], [imageComp]);
    const el = renderHierarchy([node]);
    const container = el.querySelector('.unity-prefab-container')!;
    const rendered = container.firstElementChild as HTMLElement;

    expect(rendered.style.backgroundColor).toBe('rgba(255, 255, 255, 0.5)');
  });

  it('renders text content for TextMeshPro (MonoBehaviour with m_text)', () => {
    const textComp: UnityObject = {
      id: '9003',
      typeId: '114',
      typeStr: 'MonoBehaviour',
      properties: {
        m_text: 'Hello World',
        m_fontSize: 24,
      },
    };
    const node = makeRectNode('Label', [], [textComp]);
    const el = renderHierarchy([node]);
    const container = el.querySelector('.unity-prefab-container')!;
    const rendered = container.firstElementChild as HTMLElement;

    // The text should appear inside a child div
    const textEl = rendered.querySelector('div') as HTMLElement;
    expect(textEl).not.toBeNull();
    expect(textEl.textContent).toBe('Hello World');
    expect(textEl.style.fontSize).toBe('24px');
  });

  it('renders text content for Text component (m_Text property)', () => {
    const textComp: UnityObject = {
      id: '9004',
      typeId: '114',
      typeStr: 'Text',
      properties: {
        m_Text: 'Legacy Text',
        m_FontSize: 16,
      },
    };
    const node = makeRectNode('LegacyLabel', [], [textComp]);
    const el = renderHierarchy([node]);
    const container = el.querySelector('.unity-prefab-container')!;
    const rendered = container.firstElementChild as HTMLElement;

    const textEl = rendered.querySelector('div') as HTMLElement;
    expect(textEl).not.toBeNull();
    expect(textEl.textContent).toBe('Legacy Text');
    expect(textEl.style.fontSize).toBe('16px');
  });

  it('applies text color from m_fontColor', () => {
    const textComp: UnityObject = {
      id: '9005',
      typeId: '114',
      typeStr: 'MonoBehaviour',
      properties: {
        m_text: 'Colored',
        m_fontSize: 14,
        m_fontColor: { r: 0, g: 1, b: 0, a: 1 },
      },
    };
    const node = makeRectNode('ColoredText', [], [textComp]);
    const el = renderHierarchy([node]);
    const container = el.querySelector('.unity-prefab-container')!;
    const rendered = container.firstElementChild as HTMLElement;
    const textEl = rendered.querySelector('div') as HTMLElement;

    expect(textEl.style.color).toBe('rgb(0, 255, 0)');
  });

  it('does not render a visual element for nodes without RectTransform', () => {
    const node = makeNonUINode('EmptyObject');
    const el = renderHierarchy([node]);
    const container = el.querySelector('.unity-prefab-container')!;

    // renderNode returns null for non-UI nodes, so nothing gets appended
    expect(container.children).toHaveLength(0);
  });

  it('renders nested children inside parent visual elements', () => {
    const child = makeRectNode('InnerPanel');
    const root = makeRectNode('OuterPanel', [child]);
    const el = renderHierarchy([root]);
    const container = el.querySelector('.unity-prefab-container')!;
    const outerEl = container.firstElementChild as HTMLElement;

    expect(outerEl).not.toBeNull();
    // The outer element should contain the inner element
    const innerEl = outerEl.querySelector('.unity-go') as HTMLElement;
    expect(innerEl).not.toBeNull();
    expect(innerEl.style.border).toBe('1px solid red');
  });
});

describe('renderHierarchy – scriptGuidMap resolution', () => {
  const CUSTOM_GUID = 'aabbccdd11223344aabbccdd11223344';

  function makeMonoBehaviourNode(
    name: string,
    scriptGuid: string,
    extraProps: any = {}
  ): HierarchyNode {
    const goId = String(Math.random()).slice(2, 8);
    const rtId = String(Math.random()).slice(2, 8);
    const mbId = String(Math.random()).slice(2, 8);
    return {
      gameObject: {
        id: goId,
        typeId: '1',
        typeStr: 'GameObject',
        properties: {
          m_Name: name,
          m_Component: [
            { component: { fileID: Number(rtId) } },
            { component: { fileID: Number(mbId) } },
          ],
        },
      },
      components: [
        {
          id: rtId,
          typeId: '224',
          typeStr: 'RectTransform',
          properties: {
            m_GameObject: { fileID: Number(goId) },
            m_AnchorMin: { x: 0, y: 0 },
            m_AnchorMax: { x: 1, y: 1 },
            m_AnchoredPosition: { x: 0, y: 0 },
            m_SizeDelta: { x: 0, y: 0 },
            m_Pivot: { x: 0.5, y: 0.5 },
          },
        },
        {
          id: mbId,
          typeId: '114',
          typeStr: 'MonoBehaviour',
          properties: {
            m_Script: { fileID: 11500000, guid: scriptGuid, type: 3 },
            ...extraProps,
          },
        },
      ],
      children: [],
    };
  }

  it('resolves custom script GUIDs to class names from the map', () => {
    const scriptMap = new Map<string, string>();
    scriptMap.set(CUSTOM_GUID, 'MyCustomButton');

    const node = makeMonoBehaviourNode('ButtonObj', CUSTOM_GUID);
    const el = renderHierarchy([node], scriptMap);
    const panel = el.querySelector('.unity-hierarchy-panel')!;

    expect(panel.textContent).toContain('MyCustomButton');
    expect(panel.textContent).not.toContain('Script (');
    expect(panel.textContent).not.toContain('MonoBehaviour');
  });

  it('falls back to truncated GUID when map does not contain the GUID', () => {
    const scriptMap = new Map<string, string>();
    // Map is empty — GUID won't be found

    const unknownGuid = 'ff00ff00ff00ff00ff00ff00ff00ff00';
    const node = makeMonoBehaviourNode('UnknownScript', unknownGuid);
    const el = renderHierarchy([node], scriptMap);
    const panel = el.querySelector('.unity-hierarchy-panel')!;

    expect(panel.textContent).toContain('Script (ff00ff00…)');
  });

  it('falls back to truncated GUID when no map is provided', () => {
    const unknownGuid = 'ee11ee11ee11ee11ee11ee11ee11ee11';
    const node = makeMonoBehaviourNode('NoMapScript', unknownGuid);
    const el = renderHierarchy([node]);
    const panel = el.querySelector('.unity-hierarchy-panel')!;

    expect(panel.textContent).toContain('Script (ee11ee11…)');
  });

  it('prioritises scriptGuidMap over KNOWN_SCRIPT_GUIDS', () => {
    // Override the built-in Image GUID with a custom name
    const imageGuid = 'fe87c0e1cc204ed48ad3b37840f39efc';
    const scriptMap = new Map<string, string>();
    scriptMap.set(imageGuid, 'CustomImageOverride');

    const node = makeMonoBehaviourNode('OverriddenImage', imageGuid);
    const el = renderHierarchy([node], scriptMap);
    const panel = el.querySelector('.unity-hierarchy-panel')!;

    expect(panel.textContent).toContain('CustomImageOverride');
  });

  it('resolves multiple different custom scripts in a hierarchy', () => {
    const guidA = '1111111111111111aaaaaaaaaaaaaaaa';
    const guidB = '2222222222222222bbbbbbbbbbbbbbbb';
    const scriptMap = new Map<string, string>();
    scriptMap.set(guidA, 'HealthBar');
    scriptMap.set(guidB, 'MiniMap');

    const childA = makeMonoBehaviourNode('HealthUI', guidA);
    const childB = makeMonoBehaviourNode('MapUI', guidB);
    const root = makeRectNode('HUD', [childA, childB]);
    const el = renderHierarchy([root], scriptMap);
    const panel = el.querySelector('.unity-hierarchy-panel')!;

    expect(panel.textContent).toContain('HealthBar');
    expect(panel.textContent).toContain('MiniMap');
  });
});
