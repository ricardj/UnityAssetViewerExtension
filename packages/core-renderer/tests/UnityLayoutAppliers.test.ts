import { describe, it, expect } from 'vitest';
import { UnityHierarchyRenderer } from '../src/index';
import { IHierarchyNode, IUnityObject } from '@unity-asset-viewer/core-parser';

// Helper to make a RectTransform component
function makeRectTransform(id: string, goId: string, extraProps: any = {}): IUnityObject {
  return {
    id,
    typeId: '224',
    typeStr: 'RectTransform',
    properties: {
      m_GameObject: { fileID: Number(goId) },
      m_AnchorMin: { x: 0.5, y: 0.5 },
      m_AnchorMax: { x: 0.5, y: 0.5 },
      m_AnchoredPosition: { x: 0, y: 0 },
      m_SizeDelta: { x: 100, y: 100 },
      m_Pivot: { x: 0.5, y: 0.5 },
      ...extraProps,
    },
  };
}

// Helper to construct a clean hierarchy node
function makeNode(
  name: string,
  components: IUnityObject[] = [],
  children: IHierarchyNode[] = []
): IHierarchyNode {
  const goId = String(Math.random()).slice(2, 8);
  const rtId = String(Math.random()).slice(2, 8);
  const rectRt = makeRectTransform(rtId, goId);

  return {
    gameObject: {
      id: goId,
      typeId: '1',
      typeStr: 'GameObject',
      properties: {
        m_Name: name,
        m_Component: [{ component: { fileID: Number(rtId) } }, ...components.map(c => ({ component: { fileID: Number(c.id) } }))],
      },
    },
    components: [rectRt, ...components],
    children,
  };
}

// Helper to make a MonoBehaviour layout/fitter component
function makeMonoBehaviour(guid: string, properties: any): IUnityObject {
  const compId = String(Math.random()).slice(2, 8);
  return {
    id: compId,
    typeId: '114',
    typeStr: 'MonoBehaviour',
    properties: {
      m_Script: { guid },
      ...properties,
    },
  };
}

describe('core-renderer – layouts', () => {
  it('correctly applies HorizontalLayoutGroup styles to parent and children', () => {
    const horizontalGuid = '3245ec927659c4140ac6dcff0d3908b4';
    const horizontalComp = makeMonoBehaviour(horizontalGuid, {
      m_Padding: { m_Left: 10, m_Right: 20, m_Top: 5, m_Bottom: 15 },
      m_Spacing: 12,
      m_ChildAlignment: 4, // MiddleCenter
      m_ChildControlWidth: 1,
      m_ChildControlHeight: 0,
      m_ChildForceExpandWidth: 1,
      m_ChildForceExpandHeight: 0,
    });

    const childNode1 = makeNode('Child1');
    const childNode2 = makeNode('Child2');

    const root = makeNode('Parent', [horizontalComp], [childNode1, childNode2]);
    const container = UnityHierarchyRenderer.render([root]);

    // Inspect the rendered parent element in the viewport
    const parentEl = container.querySelector('.unity-go-Parent') as HTMLElement;
    expect(parentEl).not.toBeNull();
    expect(parentEl.style.display).toBe('flex');
    expect(parentEl.style.flexDirection).toBe('row');
    expect(parentEl.style.paddingLeft).toBe('10px');
    expect(parentEl.style.paddingRight).toBe('20px');
    expect(parentEl.style.paddingTop).toBe('5px');
    expect(parentEl.style.paddingBottom).toBe('15px');
    expect(parentEl.style.gap).toBe('12px');
    expect(parentEl.style.justifyContent).toBe('center');
    expect(parentEl.style.alignItems).toBe('center');

    // Verify children positions are overridden relative and flexbox constraints applied
    const childEl1 = parentEl.querySelector('.unity-go-Child1') as HTMLElement;
    const childEl2 = parentEl.querySelector('.unity-go-Child2') as HTMLElement;
    expect(childEl1).not.toBeNull();
    expect(childEl2).not.toBeNull();

    expect(childEl1.style.position).toBe('relative');
    expect(childEl1.style.left).toBe('auto');
    expect(childEl1.style.right).toBe('auto');
    expect(childEl1.style.flexGrow).toBe('1'); // force expand width
    expect(childEl1.style.alignSelf).not.toBe('stretch'); // force expand height is false
  });

  it('correctly applies VerticalLayoutGroup styles to parent and children', () => {
    const verticalGuid = '30649d3a9faa99c44a7b1166b86bf2a0';
    const verticalComp = makeMonoBehaviour(verticalGuid, {
      m_Padding: { m_Left: 8, m_Right: 8, m_Top: 8, m_Bottom: 8 },
      m_Spacing: 6,
      m_ChildAlignment: 0, // UpperLeft
      m_ChildControlWidth: 0,
      m_ChildControlHeight: 1,
      m_ChildForceExpandWidth: 0,
      m_ChildForceExpandHeight: 1,
    });

    const childNode = makeNode('Child');
    const root = makeNode('ParentVertical', [verticalComp], [childNode]);
    const container = UnityHierarchyRenderer.render([root]);

    const parentEl = container.querySelector('.unity-go-ParentVertical') as HTMLElement;
    expect(parentEl.style.display).toBe('flex');
    expect(parentEl.style.flexDirection).toBe('column');
    expect(parentEl.style.gap).toBe('6px');
    expect(parentEl.style.justifyContent).toBe('flex-start');
    expect(parentEl.style.alignItems).toBe('flex-start');

    const childEl = parentEl.querySelector('.unity-go-Child') as HTMLElement;
    expect(childEl.style.position).toBe('relative');
    expect(childEl.style.flexGrow).toBe('1'); // force expand height
    expect(childEl.style.alignSelf).not.toBe('stretch'); // force expand width is false
  });

  it('correctly applies GridLayoutGroup styles to parent and children', () => {
    const gridGuid = '59f8146938fff824cb2e9ae9eaae4e69';
    const gridComp = makeMonoBehaviour(gridGuid, {
      m_Padding: { m_Left: 10, m_Right: 10, m_Top: 10, m_Bottom: 10 },
      m_CellSize: { x: 80, y: 80 },
      m_Spacing: { x: 5, y: 5 },
      m_Constraint: 1, // FixedColumnCount
      m_ConstraintCount: 3,
      m_ChildAlignment: 4, // MiddleCenter
    });

    const childNode = makeNode('GridChild');
    const root = makeNode('ParentGrid', [gridComp], [childNode]);
    const container = UnityHierarchyRenderer.render([root]);

    const parentEl = container.querySelector('.unity-go-ParentGrid') as HTMLElement;
    expect(parentEl.style.display).toBe('grid');
    expect(parentEl.style.columnGap).toBe('5px');
    expect(parentEl.style.rowGap).toBe('5px');
    expect(parentEl.style.gridTemplateColumns).toBe('repeat(3, 80px)');

    const childEl = parentEl.querySelector('.unity-go-GridChild') as HTMLElement;
    expect(childEl.style.position).toBe('relative');
    expect(childEl.style.width).toBe('80px');
    expect(childEl.style.height).toBe('80px');
  });

  it('correctly applies ContentSizeFitter sizing properties', () => {
    const fitterGuid = 'ef17fee4e8e2aa44ab1a2cd626e38a6a';
    const fitterComp = makeMonoBehaviour(fitterGuid, {
      m_HorizontalFit: 2, // PreferredSize
      m_VerticalFit: 1, // MinSize
    });

    const node = makeNode('FitterNode', [fitterComp]);
    const container = UnityHierarchyRenderer.render([node]);

    const el = container.querySelector('.unity-go-FitterNode') as HTMLElement;
    expect(el.style.width).toBe('fit-content');
    expect(el.style.minWidth).toBe('max-content');
    expect(el.style.height).toBe('fit-content');
    expect(el.style.minHeight).toBe('max-content');
  });
});
