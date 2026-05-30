import { UnityObject, HierarchyNode } from '@unity-asset-viewer/core-parser';
import { RectTransformApplier } from './RectTransformApplier';
import { LayoutContext } from '../context/LayoutContext';

const LAYOUT_GUIDS = {
  HORIZONTAL: '3245ec927659c4140ac6dcff0d3908b4',
  VERTICAL: '30649d3a9faa99c44a7b1166b86bf2a0',
  GRID: '59f8146938fff824cb2e9ae9eaae4e69',
};

/**
 * LayoutGroupApplier is responsible for parsing and rendering Unity layout groups
 * (HorizontalLayoutGroup, VerticalLayoutGroup, GridLayoutGroup) onto parents and children.
 */
export class LayoutGroupApplier {
  /**
   * Identifies if a node contains a layout group component.
   */
  public static getLayoutComponent(node: HierarchyNode): UnityObject | undefined {
    return node.components.find(
      c =>
        c.typeStr === 'HorizontalLayoutGroup' ||
        c.typeStr === 'VerticalLayoutGroup' ||
        c.typeStr === 'GridLayoutGroup' ||
        (c.typeStr === 'MonoBehaviour' &&
          (c.properties.m_Script?.guid === LAYOUT_GUIDS.HORIZONTAL ||
            c.properties.m_Script?.guid === LAYOUT_GUIDS.VERTICAL ||
            c.properties.m_Script?.guid === LAYOUT_GUIDS.GRID))
    );
  }

  /**
   * Applies the layout group styles to the container element.
   * Returns a LayoutContext to pass to child elements.
   */
  public static apply(el: HTMLElement, node: HierarchyNode): LayoutContext | undefined {
    const layout = this.getLayoutComponent(node);
    if (!layout) return undefined;

    const props = layout.properties;
    const isHorizontal =
      layout.typeStr === 'HorizontalLayoutGroup' ||
      props.m_Script?.guid === LAYOUT_GUIDS.HORIZONTAL;
    const isVertical =
      layout.typeStr === 'VerticalLayoutGroup' ||
      props.m_Script?.guid === LAYOUT_GUIDS.VERTICAL;
    const isGrid =
      layout.typeStr === 'GridLayoutGroup' || props.m_Script?.guid === LAYOUT_GUIDS.GRID;

    // 1. Common Padding
    const padding = props.m_Padding || { m_Left: 0, m_Right: 0, m_Top: 0, m_Bottom: 0 };
    el.style.paddingLeft = `${padding.m_Left || 0}px`;
    el.style.paddingRight = `${padding.m_Right || 0}px`;
    el.style.paddingTop = `${padding.m_Top || 0}px`;
    el.style.paddingBottom = `${padding.m_Bottom || 0}px`;

    // 2. Alignment mapping
    const alignment = props.m_ChildAlignment ?? 0;

    if (isHorizontal || isVertical) {
      el.style.display = 'flex';
      el.style.boxSizing = 'border-box';

      // Gap spacing
      const spacing = props.m_Spacing || 0;
      el.style.gap = `${spacing}px`;

      if (isHorizontal) {
        const reverse = props.m_ReverseArrangement === true || props.m_ReverseArrangement === 1;
        el.style.flexDirection = reverse ? 'row-reverse' : 'row';
        this.applyFlexAlignment(el, alignment, true);
      } else {
        const reverse = props.m_ReverseArrangement === true || props.m_ReverseArrangement === 1;
        el.style.flexDirection = reverse ? 'column-reverse' : 'column';
        this.applyFlexAlignment(el, alignment, false);
      }

      return {
        isLayoutChild: true,
        type: isHorizontal ? 'Horizontal' : 'Vertical',
        controlWidth: props.m_ChildControlWidth === true || props.m_ChildControlWidth === 1,
        controlHeight: props.m_ChildControlHeight === true || props.m_ChildControlHeight === 1,
        forceExpandWidth: props.m_ChildForceExpandWidth === true || props.m_ChildForceExpandWidth === 1,
        forceExpandHeight: props.m_ChildForceExpandHeight === true || props.m_ChildForceExpandHeight === 1,
      };
    } else if (isGrid) {
      el.style.display = 'grid';
      el.style.boxSizing = 'border-box';

      const cellSize = props.m_CellSize || { x: 100, y: 100 };
      const spacing = props.m_Spacing || { x: 0, y: 0 };
      el.style.columnGap = `${spacing.x || 0}px`;
      el.style.rowGap = `${spacing.y || 0}px`;

      const constraint = props.m_Constraint ?? 0;
      const constraintCount = props.m_ConstraintCount ?? 2;

      // Map Grid constraints
      if (constraint === 1) {
        // Fixed Column Count
        el.style.gridTemplateColumns = `repeat(${constraintCount}, ${cellSize.x}px)`;
      } else if (constraint === 2) {
        // Fixed Row Count
        el.style.gridTemplateRows = `repeat(${constraintCount}, ${cellSize.y}px)`;
        el.style.gridAutoFlow = 'column'; // Fill columns first
      } else {
        // Flexible (Auto-fill columns of fixed width)
        el.style.gridTemplateColumns = `repeat(auto-fill, ${cellSize.x}px)`;
      }

      this.applyGridAlignment(el, alignment);

      return {
        isLayoutChild: true,
        type: 'Grid',
        controlWidth: true,
        controlHeight: true,
        forceExpandWidth: false,
        forceExpandHeight: false,
        cellSize: { x: cellSize.x || 100, y: cellSize.y || 100 },
      };
    }

    return undefined;
  }

  /**
   * Applies CSS styles to child elements belonging to a layout group container.
   */
  public static applyChildStyles(el: HTMLElement, props: any, context: LayoutContext): void {
    if (!context.isLayoutChild) return;

    RectTransformApplier.applyLayoutChildOverride(
      el,
      props,
      context.controlWidth,
      context.controlHeight
    );

    if (context.type === 'Grid' && context.cellSize) {
      el.style.width = `${context.cellSize.x}px`;
      el.style.height = `${context.cellSize.y}px`;
    } else if (context.type === 'Horizontal') {
      // Force Expand Width: grow to take up horizontal space
      if (context.forceExpandWidth) {
        el.style.flexGrow = '1';
      }
      // Force Expand Height: stretch vertically
      if (context.forceExpandHeight) {
        el.style.alignSelf = 'stretch';
        el.style.height = 'auto';
      }
    } else if (context.type === 'Vertical') {
      // Force Expand Width: stretch horizontally
      if (context.forceExpandWidth) {
        el.style.alignSelf = 'stretch';
        el.style.width = 'auto';
      }
      // Force Expand Height: grow to take up vertical space
      if (context.forceExpandHeight) {
        el.style.flexGrow = '1';
      }
    }
  }

  /**
   * Helper to map Unity alignment (0-8) to flex justify-content and align-items.
   */
  private static applyFlexAlignment(el: HTMLElement, alignment: number, isHorizontal: boolean): void {
    // 0 = UpperLeft, 1 = UpperCenter, 2 = UpperRight
    // 3 = MiddleLeft, 4 = MiddleCenter, 5 = MiddleRight
    // 6 = LowerLeft, 7 = LowerCenter, 8 = LowerRight
    const alignX = alignment % 3; // 0 = Left, 1 = Center, 2 = Right
    const alignY = Math.floor(alignment / 3); // 0 = Upper, 1 = Middle, 2 = Lower

    let justify = 'flex-start';
    let align = 'flex-start';

    if (isHorizontal) {
      // justify-content controls Horizontal positioning
      if (alignX === 1) justify = 'center';
      if (alignX === 2) justify = 'flex-end';

      // align-items controls Vertical positioning (cross axis)
      if (alignY === 1) align = 'center';
      if (alignY === 2) align = 'flex-end';
    } else {
      // justify-content controls Vertical positioning
      if (alignY === 1) justify = 'center';
      if (alignY === 2) justify = 'flex-end';

      // align-items controls Horizontal positioning (cross axis)
      if (alignX === 1) align = 'center';
      if (alignX === 2) align = 'flex-end';
    }

    el.style.justifyContent = justify;
    el.style.alignItems = align;
  }

  /**
   * Helper to map Unity alignment (0-8) to Grid alignment properties.
   */
  private static applyGridAlignment(el: HTMLElement, alignment: number): void {
    const alignX = alignment % 3; // 0 = Left, 1 = Center, 2 = Right
    const alignY = Math.floor(alignment / 3); // 0 = Upper, 1 = Middle, 2 = Lower

    let justify = 'start';
    let align = 'start';

    if (alignX === 1) justify = 'center';
    if (alignX === 2) justify = 'end';

    if (alignY === 1) align = 'center';
    if (alignY === 2) align = 'end';

    el.style.justifyContent = justify;
    el.style.alignContent = align;
  }
}
