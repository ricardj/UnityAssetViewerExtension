export interface ILayoutContext {
  isLayoutChild: boolean;
  type: 'Horizontal' | 'Vertical' | 'Grid';
  controlWidth: boolean;
  controlHeight: boolean;
  forceExpandWidth: boolean;
  forceExpandHeight: boolean;
  cellSize?: { x: number; y: number };
}
