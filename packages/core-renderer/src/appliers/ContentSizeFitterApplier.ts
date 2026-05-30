import { IUnityObject, IHierarchyNode } from '@unity-asset-viewer/core-parser';

const CONTENT_SIZE_FITTER_GUID = 'ef17fee4e8e2aa44ab1a2cd626e38a6a';

/**
 * ContentSizeFitterApplier applies dynamic sizing to the GameObject's element
 * based on its ContentSizeFitter component and its content's sizes.
 */
export class ContentSizeFitterApplier {
  /**
   * Applies the ContentSizeFitter sizing properties to the given HTML element.
   */
  public static apply(el: HTMLElement, node: IHierarchyNode): void {
    const fitter = node.components.find(
      c =>
        c.typeStr === 'ContentSizeFitter' ||
        (c.typeStr === 'MonoBehaviour' && c.properties.m_Script?.guid === CONTENT_SIZE_FITTER_GUID)
    );

    if (!fitter) return;

    const props = fitter.properties;
    const horizontalFit = props.m_HorizontalFit ?? 0;
    const verticalFit = props.m_VerticalFit ?? 0;

    // 0 = Unconstrained, 1 = MinSize, 2 = PreferredSize
    if (horizontalFit === 1 || horizontalFit === 2) {
      el.style.width = 'fit-content';
      el.style.minWidth = 'max-content';
    }

    if (verticalFit === 1 || verticalFit === 2) {
      el.style.height = 'fit-content';
      el.style.minHeight = 'max-content';
    }
  }
}
