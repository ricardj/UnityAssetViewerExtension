import { UnityObject, HierarchyNode } from '@unity-asset-viewer/core-parser';

/**
 * VisualComponentRenderer is responsible for rendering visual elements on
 * the GameObject, such as Images, RawImages, Texts, and TextMeshPro components.
 */
export class VisualComponentRenderer {
  /**
   * Helper to normalize Windows absolute paths for the Vite filesystem dev server.
   */
  public static getViteFsUrl(absolutePath: string): string {
    const normalized = absolutePath.replace(/\\/g, '/');
    return normalized.startsWith('/') ? `/@fs${normalized}` : `/@fs/${normalized}`;
  }

  /**
   * Applies the visual components (Image, Text, etc.) found in the hierarchy node
   * to the target DOM element.
   */
  public static apply(
    el: HTMLElement,
    node: HierarchyNode,
    globalGuidMap?: Map<string, string>
  ): void {
    this.applyImage(el, node, globalGuidMap);
    this.applyText(el, node);
  }

  /**
   * Renders Image or RawImage background styles and tints.
   */
  private static applyImage(
    el: HTMLElement,
    node: HierarchyNode,
    globalGuidMap?: Map<string, string>
  ): void {
    const image = node.components.find(
      c =>
        c.typeStr === 'Image' ||
        c.typeStr === 'RawImage' ||
        (c.typeStr === 'MonoBehaviour' && c.properties.m_Sprite !== undefined)
    );

    if (image) {
      const color = image.properties.m_Color;
      const spriteGuid = image.properties.m_Sprite?.guid;
      let spritePath = '';

      if (spriteGuid && globalGuidMap) {
        spritePath = globalGuidMap.get(spriteGuid) || '';
      }

      if (spritePath) {
        const isDirectUrl = spritePath.startsWith('data:') || spritePath.startsWith('blob:') || spritePath.startsWith('http:') || spritePath.startsWith('https:');
        const bgUrl = isDirectUrl ? spritePath : this.getViteFsUrl(spritePath);
        el.style.backgroundImage = `url('${bgUrl}')`;
        el.style.backgroundSize = '100% 100%';
        el.style.backgroundRepeat = 'no-repeat';
        // Clear RectTransform outline on actual images
        el.style.outline = 'none';

        if (color) {
          el.style.backgroundColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(
            color.g * 255
          )}, ${Math.round(color.b * 255)}, ${color.a})`;
        }
      } else {
        if (color) {
          el.style.backgroundColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(
            color.g * 255
          )}, ${Math.round(color.b * 255)}, ${color.a})`;
        } else {
          el.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        }
      }
    }
  }

  /**
   * Renders Text, TextMeshPro, or TextMeshProUGUI elements.
   */
  private static applyText(el: HTMLElement, node: HierarchyNode): void {
    const textComp = node.components.find(
      c =>
        c.typeStr === 'Text' ||
        (c.typeStr === 'MonoBehaviour' && c.properties.m_text !== undefined) ||
        c.properties.m_Text !== undefined
    );

    if (textComp) {
      const textEl = document.createElement('div');
      textEl.style.width = '100%';
      textEl.style.height = '100%';
      textEl.style.display = 'flex';
      textEl.style.alignItems = 'center';
      textEl.style.justifyContent = 'center';
      textEl.style.overflow = 'hidden';
      textEl.style.fontSize =
        (textComp.properties.m_fontSize || textComp.properties.m_FontSize || 14) + 'px';

      const textStr = textComp.properties.m_text || textComp.properties.m_Text || '';
      textEl.textContent = textStr;

      const color = textComp.properties.m_fontColor || textComp.properties.m_Color;
      if (color) {
        textEl.style.color = `rgba(${Math.round(color.r * 255)}, ${Math.round(
          color.g * 255
        )}, ${Math.round(color.b * 255)}, ${color.a ?? 1})`;
      } else {
        textEl.style.color = '#fff';
      }

      el.appendChild(textEl);
    }
  }
}
