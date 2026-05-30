import { IUnityObject } from '@unity-asset-viewer/core-parser';

/**
 * RectTransformApplier handles translating Unity's RectTransform properties
 * (Anchors, Pivot, Position, SizeDelta, Scale, Rotation) into modern CSS positioning.
 */
export class RectTransformApplier {
  /**
   * Applies the RectTransform properties to the given HTML element.
   *
   * Unity uses a bottom-left origin system for RectTransform, which we map
   * to CSS by using bottom and left styles instead of top.
   */
  public static apply(el: HTMLElement, props: any): void {
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
      const offsetMinX = pos.x - size.x * pivot.x;
      const offsetMaxX = pos.x + size.x * (1 - pivot.x);
      el.style.left = `calc(${aMin.x * 100}% + ${offsetMinX}px)`;
      el.style.right = `calc(${(1 - aMax.x) * 100}% - ${offsetMaxX}px)`;
      el.style.width = 'auto';
    } else {
      // Fixed width
      el.style.width = `${size.x}px`;
      el.style.left = `calc(${aMin.x * 100}% + ${pos.x}px - ${size.x * pivot.x}px)`;
      el.style.right = 'auto';
    }

    if (isStretchY) {
      // Stretched vertically: SizeDelta.y becomes negative inset (top/bottom padding)
      const offsetMinY = pos.y - size.y * pivot.y;
      const offsetMaxY = pos.y + size.y * (1 - pivot.y);
      el.style.bottom = `calc(${aMin.y * 100}% + ${offsetMinY}px)`;
      el.style.top = `calc(${(1 - aMax.y) * 100}% - ${offsetMaxY}px)`;
      el.style.height = 'auto';
    } else {
      // Fixed height
      el.style.height = `${size.y}px`;
      el.style.bottom = `calc(${aMin.y * 100}% + ${pos.y}px - ${size.y * pivot.y}px)`;
      el.style.top = 'auto';
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
    } else {
      el.style.transform = 'none';
    }
  }

  /**
   * Resets absolute RectTransform styles when the element is a child of a layout group,
   * allowing flex/grid layout properties of the parent to control its positioning.
   */
  public static applyLayoutChildOverride(el: HTMLElement, props: any, controlWidth: boolean, controlHeight: boolean): void {
    el.style.position = 'relative';
    el.style.left = 'auto';
    el.style.right = 'auto';
    el.style.top = 'auto';
    el.style.bottom = 'auto';
    el.style.transform = 'none';

    // If the layout group doesn't control width/height, keep the RectTransform's fixed sizes
    const size = props?.m_SizeDelta || { x: 100, y: 100 };
    if (!controlWidth) {
      el.style.width = `${size.x}px`;
      el.style.minWidth = `${size.x}px`;
    }
    if (!controlHeight) {
      el.style.height = `${size.y}px`;
      el.style.minHeight = `${size.y}px`;
    }
  }
}
