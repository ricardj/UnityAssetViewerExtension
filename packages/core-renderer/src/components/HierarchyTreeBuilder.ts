import { IUnityObject, IHierarchyNode } from '@unity-asset-viewer/core-parser';

/**
 * HierarchyTreeBuilder manages the rendering of the right-hand hierarchy tree view
 * panel in the viewer, including icons, component tags, and collapse/expand events.
 */
export class HierarchyTreeBuilder {
  private static readonly KNOWN_SCRIPT_GUIDS: Record<string, string> = {
    'fe87c0e1cc204ed48ad3b37840f39efc': 'Image',
    'f4688fdb7df04437aeb418b961361dc5': 'TextMeshProUGUI',
    '1344c3c82d62a2a41a3576d8abb8e3ea': 'TextMeshPro',
    '4e29b573a2db71c488bc2e7ea672d6e7': 'Button',
    '2a4db7a114972834c8e4117be1d82ba3': 'Canvas',
    '1367256f5765c6749a3d74b6e50bff65': 'CanvasScaler',
    '0cd44c1031e13a943bb63640046fad76': 'GraphicRaycaster',
    '4e097bff4e851b74d904e5e5c4a9bd68': 'Toggle',
    '1aa08ab6e0e44e3404f5110e5f886c56': 'ScrollRect',
    '30649d3a9faa99c48a7b1166b86bf2a0': 'Slider',
    'cc11f24cf0dad7643b745e89a5c0bd28': 'InputField',
    'b5f852f95e462c54fb684b8e40ffe685': 'InputFieldTMP',
    'd199490a83bb4e845b4e73b4beb2a29c': 'LayoutElement',
    '3245ec927659c4140ac6dcff0d3908b4': 'HorizontalLayoutGroup',
    '30649d3a9faa99c44a7b1166b86bf2a0': 'VerticalLayoutGroup',
    '59f8146938fff824cb2e9ae9eaae4e69': 'GridLayoutGroup',
    'ef17fee4e8e2aa44ab1a2cd626e38a6a': 'ContentSizeFitter',
    '306cc22290013e746bf78c85d4d20ba0': 'AspectRatioFitter',
    'aedde3d9a5c19f040b90abd32018041f': 'Mask',
    '31a19414c41e5ae4aae2af33c9f705f5': 'RectMask2D',
    '5f7201a12d95ffc409449d95f23cf332': 'Text',
    'dc42784cf5484c88ecbe7f57db9c39e4': 'RawImage',
    '80d32ecd40eae61499e95a4cc7a2764e': 'Outline',
    '098311e4738267b44a0a4c00524b924e': 'Shadow',
    'cfabb0440166ab443bba8876756fdfa9': 'Dropdown',
    '2fafe2cfe61f6f942b0385e444a0a30a': 'DropdownTMP',
  };

  private static readonly COMPONENT_ICONS: Record<string, string> = {
    'Transform': '🔄',
    'RectTransform': '🔲',
    'Canvas': '🖼️',
    'CanvasRenderer': '🎨',
    'CanvasScaler': '📐',
    'GraphicRaycaster': '🎯',
    'Image': '🖼️',
    'RawImage': '🖼️',
    'Text': '📝',
    'TextMeshProUGUI': '📝',
    'TextMeshPro': '📝',
    'Button': '🔘',
    'Toggle': '☑️',
    'Slider': '🎚️',
    'ScrollRect': '📜',
    'InputField': '📝',
    'InputFieldTMP': '📝',
    'Dropdown': '📋',
    'DropdownTMP': '📋',
    'LayoutElement': '📐',
    'HorizontalLayoutGroup': '↔️',
    'VerticalLayoutGroup': '↕️',
    'GridLayoutGroup': '⊞',
    'ContentSizeFitter': '📏',
    'AspectRatioFitter': '📏',
    'Mask': '🎭',
    'RectMask2D': '🎭',
    'Outline': '✏️',
    'Shadow': '🌑',
    'MonoBehaviour': '📜',
  };

  /**
   * Translates a MonoBehaviour script component to its resolved display name.
   */
  public static getScriptDisplayName(
    comp: IUnityObject,
    scriptGuidMap?: Map<string, string>
  ): string {
    if (comp.properties.m_text !== undefined) return 'TextMeshProUGUI';
    if (comp.properties.m_Text !== undefined) return 'Text';
    if (comp.properties.m_Sprite !== undefined) return 'Image';

    const scriptRef = comp.properties.m_Script;
    const guid: string = scriptRef?.guid ?? '';

    if (guid && scriptGuidMap?.has(guid)) {
      return scriptGuidMap.get(guid)!;
    }

    if (guid && this.KNOWN_SCRIPT_GUIDS[guid]) {
      return this.KNOWN_SCRIPT_GUIDS[guid];
    }

    const classId = comp.properties.m_EditorClassIdentifier;
    if (classId && typeof classId === 'string' && classId.trim().length > 0) {
      const parts = classId.split('/');
      return parts[parts.length - 1] || `Script (${guid.substring(0, 8)}…)`;
    }

    if (guid) {
      return `Script (${guid.substring(0, 8)}…)`;
    }

    return 'MonoBehaviour';
  }

  public static getComponentIcon(name: string): string {
    return this.COMPONENT_ICONS[name] || '🧩';
  }

  /**
   * Generates the collapsible tree DOM element for a GameObject and its children.
   */
  public static build(
    node: IHierarchyNode,
    scriptGuidMap?: Map<string, string>
  ): HTMLElement {
    const item = document.createElement('div');
    item.style.paddingLeft = '14px';
    item.style.marginTop = '2px';

    const label = document.createElement('div');
    label.className = 'unity-hierarchy-item';
    label.setAttribute('data-id', node.gameObject.id);
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.cursor = 'pointer';
    label.style.userSelect = 'none';

    const hasExpandableContent =
      (node.children && node.children.length > 0) ||
      (node.components && node.components.length > 0);

    const toggleIcon = document.createElement('span');
    toggleIcon.textContent = hasExpandableContent ? '▼ ' : '  ';
    toggleIcon.style.marginRight = '4px';
    toggleIcon.style.fontSize = '10px';
    toggleIcon.style.width = '12px';
    toggleIcon.style.display = 'inline-block';

    const text = document.createElement('span');
    text.textContent = `🧊 ${node.gameObject.properties.m_Name || 'GameObject'}`;
    text.style.padding = '2px 4px';
    text.style.borderRadius = '3px';
    text.style.flex = '1';

    label.appendChild(toggleIcon);
    label.appendChild(text);

    label.addEventListener('mouseover', () => {
      if (label.style.backgroundColor !== 'rgb(44, 93, 135)') {
        label.style.backgroundColor = '#444';
      }
    });
    label.addEventListener('mouseout', () => {
      if (label.style.backgroundColor !== 'rgb(44, 93, 135)') {
        label.style.backgroundColor = 'transparent';
      }
    });

    item.appendChild(label);

    const childrenContainer = document.createElement('div');

    const hasComponents = node.components && node.components.length > 0;
    if (hasComponents) {
      const compSection = document.createElement('div');
      compSection.style.paddingLeft = '14px';
      compSection.style.marginTop = '1px';

      const compHeader = document.createElement('div');
      compHeader.style.display = 'flex';
      compHeader.style.alignItems = 'center';
      compHeader.style.cursor = 'pointer';
      compHeader.style.userSelect = 'none';
      compHeader.style.fontSize = '11px';
      compHeader.style.color = '#aaa';
      compHeader.style.fontWeight = 'bold';

      const compToggle = document.createElement('span');
      compToggle.textContent = '▼ ';
      compToggle.style.marginRight = '4px';
      compToggle.style.fontSize = '8px';
      compToggle.style.width = '10px';

      const compTitle = document.createElement('span');
      compTitle.textContent = 'Components';

      compHeader.appendChild(compToggle);
      compHeader.appendChild(compTitle);
      compSection.appendChild(compHeader);

      const compList = document.createElement('div');
      compList.style.paddingLeft = '10px';

      node.components.forEach(comp => {
        const compEl = document.createElement('div');
        compEl.style.display = 'flex';
        compEl.style.alignItems = 'center';
        compEl.style.padding = '1px 4px';
        compEl.style.fontSize = '12px';
        compEl.style.color = '#ccc';

        const rawName = comp.typeStr;
        const resolvedName =
          rawName === 'MonoBehaviour'
            ? this.getScriptDisplayName(comp, scriptGuidMap)
            : rawName;
        const icon = this.getComponentIcon(resolvedName);

        compEl.textContent = `${icon} ${resolvedName}`;
        compList.appendChild(compEl);
      });

      compSection.appendChild(compList);
      childrenContainer.appendChild(compSection);

      compHeader.addEventListener('click', e => {
        e.stopPropagation();
        if (compList.style.display === 'none') {
          compList.style.display = 'block';
          compToggle.textContent = '▼ ';
        } else {
          compList.style.display = 'none';
          compToggle.textContent = '▶ ';
        }
      });
    }

    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        childrenContainer.appendChild(this.build(child, scriptGuidMap));
      });
    }

    item.appendChild(childrenContainer);

    label.addEventListener('click', e => {
      e.stopPropagation();

      document.querySelectorAll('.unity-hierarchy-item').forEach(el => {
        (el as HTMLElement).style.backgroundColor = 'transparent';
      });
      label.style.backgroundColor = 'rgb(44, 93, 135)';

      const id = node.gameObject.id;
      const targetEl = document.querySelector(`.unity-prefab-container [class*="unity-go"]`)
        ?.parentElement?.querySelector(`[class*="unity-go"]`);

      if (childrenContainer.style.display === 'none') {
        childrenContainer.style.display = 'block';
        toggleIcon.textContent = '▼ ';
      } else {
        childrenContainer.style.display = 'none';
        toggleIcon.textContent = '▶ ';
      }
    });

    return item;
  }
}
