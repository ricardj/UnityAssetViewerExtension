# 🏛️ Architecture & Agent Guidelines (ARCHITECTS.md)

Welcome, AI Agent or Core Contributor! This document serves as the high-level architecture blueprint, technical deep-dive, and operational handbook for the **Unity Asset Viewer Extension** codebase. 

Please read this entire document to align on patterns, terminology, domain logic (such as Unity's YAML serialization and RectTransform-to-CSS mathematics), and strict development constraints before making any modifications.

---

## 🎯 Codebase Philosophy & Goals

This project is a multi-platform extension (Chrome/Firefox/GitLab and VS Code) designed to render Unity `.prefab` files visually inside developer review environments. 

### Core Priorities:
1. **Accuracy of Layout**: The visual representation must match Unity UI's canvas rendering rules as closely as possible (specifically RectTransform anchors, pivots, sizeDelta, and layout groups).
2. **Speed & Efficiency**: Prefabs are fetched dynamically on PR/MR pages. Parsing and rendering must happen in milliseconds without blocking the browser thread.
3. **No Visual Noise**: Never output generic colors or clutter. Keep layouts elegant, premium, and clean, mirroring the Unity Inspector dark theme where possible.
4. **Environment Isolation**: Shared libraries (`core-parser` and `core-renderer`) must remain completely environment-agnostic. They must not reference Chrome APIs, VS Code APIs, or node-only modules.

---

## 🧱 Monorepo Layout & System Blueprints

This repository is structured as an `npm workspaces` monorepo with a modularized, grouped folder structure to maintain clean boundaries:

```
unity-asset-viewer-extension/
├── packages/
│   ├── core-parser/       # [Vanilla TS] Parses raw Unity YAML into standard HierarchyNode[]
│   │   ├── src/
│   │   │   ├── core/      # Core parsing engine (YAML parser, hierarchy tree builder, variant modifications applier)
│   │   │   ├── providers/ # Abstractions for repository access (e.g. LocalRepoProvider)
│   │   │   ├── types/     # Type/Interface/Class definitions (HierarchyNode, UnityObject, ParsedPrefab, etc.)
│   │   │   └── index.ts   # Package entrypoint (re-exports)
│   ├── core-renderer/     # [Vanilla TS/HTML] Maps HierarchyNode[] to absolute HTML/CSS elements
│   │   ├── src/
│   │   │   ├── appliers/  # Layout and positioning logic (RectTransform, LayoutGroup, ContentSizeFitter)
│   │   │   ├── components/# Visual elements & trees (UnityViewer, HierarchyTreeBuilder, VisualComponentRenderer)
│   │   │   ├── context/   # Context helpers (LayoutContext)
│   │   │   ├── dev/       # Under-development helpers, preview targets and mock repository providers
│   │   │   └── index.ts   # Package entrypoint (re-exports)
│   ├── chrome-extension/  # [Chrome API] Injects into GitHub/GitLab PRs & blob pages
│   │   ├── src/
│   │   │   ├── repo/      # Local repository providers & file retrieval utilities
│   │   │   ├── storage/   # Extension storage accessors (handles, script map, etc.)
│   │   │   ├── content.ts # GitHub/GitLab page scraping & rendering script
│   │   │   └── popup.ts   # Extension popup script
│   └── vscode-extension/  # [VS Code API] Renders custom preview editors inside VS Code
│       ├── src/
│       │   ├── core/      # Activation and deactivation hooks
│       │   ├── services/  # File & GUID map lookup services in workspace
│       │   ├── webview-host/# Webview host & repo providers (getWebviewContent, etc.)
│       │   ├── extension.ts # Extension entry point
│       │   └── webview.ts # Inside-webview renderer hook
├── scripts/               # CLI scripts for local preview testing and GitHub Releases
├── .agents/               # Automation scripts for agent-guided builds/deployments
└── package.json           # Root package.json defining workspaces
```

### System Data Flow Architecture

```mermaid
graph TD
    subgraph Review Environment
        GH[GitHub / GitLab Page]
        VS[VS Code Editor Pane]
    end

    subgraph Chrome/VS Code Host
        CE[chrome-extension: content.ts]
        VE[vscode-extension: extension.ts]
    end

    subgraph Core Libraries (Environment Agnostic)
        CP[core-parser: parseUnityYaml & buildHierarchy]
        CR[core-renderer: renderHierarchy & UnityViewer]
    end

    subgraph Local Workspace Access (Optional)
        FS[File System Access API]
    end

    GH -->|Fetches Raw YAML| CE
    VS -->|Reads Active Document| VE
    
    CE -->|Raw YAML| CP
    VE -->|Raw YAML| CP
    
    CP -->|Parsed HierarchyNode[]| CR
    
    CE -.->|Requires Variant Base GUID| FS
    FS -.->|Retrieves Base Prefab| CP

    CR -->|Visual HTML/CSS Elements| GH
    CR -->|Visual HTML/CSS Elements| VS
```

---

## 🛠️ Package Deep-Dives

### 1. `packages/core-parser`
*   **Purpose**: Handles raw string manipulation of Unity `.prefab` files.
*   **Key Concept**: Parses multi-document Unity YAML, matching documents by ClassID and FileID, then maps them into a logical tree.
*   **Structure**:
    *   `src/core/`: Contains the main parser implementation (`parseUnityYaml.ts`, `buildHierarchy.ts`, `applyModifications.ts`, `parsePrefabComplete.ts`).
    *   `src/providers/`: Houses environment-agnostic repo providers like `LocalRepoProvider.ts`.
    *   `src/types/`: Houses individual type definitions (`HierarchyNode.ts`, `ParsedPrefab.ts`, `PrefabVariantInfo.ts`, `UnityObject.ts`) in strict compliance with the single-class-per-file rule.
*   **Key Functions**:
    *   `parseUnityYaml(yamlString)` (in `src/core/parseUnityYaml.ts`): Splices multi-document YAML via custom regex `/--- !u!(\d+)...+/` and parses with the `yaml` npm package. Special handling replaces huge BigInts to safe Javascript numbers.
    *   `buildHierarchy(objects)` (in `src/core/buildHierarchy.ts`): Iterates over the flattened list of documents, locating `GameObject` elements, mapping their respective `Transform`/`RectTransform` nodes, and constructing parent-child hierarchies.
    *   `applyModifications(baseParsed, variantParsed)` (in `src/core/applyModifications.ts`): If a prefab is a *Variant*, this function takes the base prefab objects and overrides properties defined in the variant's `m_Modification` arrays.

### 2. `packages/core-renderer`
*   **Purpose**: Constructs the double-pane container (Visual Viewport + Interactive Tree Hierarchy).
*   **Structure**:
    *   `src/appliers/`: Absolute/flex/grid math appliers (`RectTransformApplier.ts`, `LayoutGroupApplier.ts`, `ContentSizeFitterApplier.ts`).
    *   `src/components/`: DOM builders and render engines (`UnityViewer.ts`, `VisualComponentRenderer.ts`, `HierarchyTreeBuilder.ts`, `renderHierarchy.ts`).
    *   `src/context/`: Domain-specific context handlers (`LayoutContext.ts`).
    *   `src/dev/`: Isolated developer playground components (`DevLocalRepoProvider.ts`, `PreviewMeta.ts`, `dev.ts`, `env.d.ts`).
*   **Key Components**:
    *   `UnityViewer.ts` (in `src/components/UnityViewer.ts`): Standard entry point coordinating the two panes.
    *   `RectTransformApplier.ts` (in `src/appliers/RectTransformApplier.ts`): Calculates pivot points, anchors, and positions, mapping them to CSS absolute layouts.
    *   `LayoutGroupApplier.ts` (in `src/appliers/LayoutGroupApplier.ts`): Detects `VerticalLayoutGroup`, `HorizontalLayoutGroup`, and `GridLayoutGroup` and converts them to CSS Flexbox/Grid equivalents.
    *   `ContentSizeFitterApplier.ts` (in `src/appliers/ContentSizeFitterApplier.ts`): Simulates Unity's content size fitting by letting children dynamically grow the parents horizontally or vertically.
    *   `VisualComponentRenderer.ts` (in `src/components/VisualComponentRenderer.ts`): Draws the visuals (Text, Images, Raw wireframes) inside the absolute boxes.

### 3. `packages/chrome-extension`
*   **Purpose**: Content script injected into GitHub (`github.com`) and GitLab (`gitlab.com`).
*   **Structure**:
    *   `src/repo/`: Storage and FS API interfaces (`ChromeLocalRepoProvider.ts`, `buildScriptGuidMap.ts`, `findAssetFileByGuid.ts`, `findPrefabByGuid.ts`).
    *   `src/storage/`: IndexedDB / Chrome extension state handlers (`loadHandle.ts`, `loadScriptMap.ts`, `saveHandle.ts`, `saveScriptMap.ts`).
*   **Key Behavior**:
    *   Injects an `👁️ Render UI Prefab` button adjacent to `.prefab` file headers.
    *   Supports the **File System Access API (`showDirectoryPicker`)** allowing users to grant access to their local project directory to automatically resolve Prefab Variants and script name maps on the fly!
    *   Caches local directory handles inside Chrome's IndexedDB and script GUID mappings inside local extension storage for quick reloading.

### 4. `packages/vscode-extension`
*   **Purpose**: Visual Studio Code Custom Editor provider.
*   **Structure**:
    *   `src/core/`: Bootstrapping hooks (`activate.ts`, `deactivate.ts`).
    *   `src/services/`: Local file lookups (`findFileByGuidInWorkspace.ts`, `getScriptGuidMapInWorkspace.ts`).
    *   `src/webview-host/`: Inside-VS-Code sidecar controllers (`WebviewLocalRepoProvider.ts`, `getWebviewContent.ts`).
*   **Key Behavior**:
    *   Registers command `unityAssetViewer.showPreview`.
    *   Launches a Webview panel beside the active prefab text editor and posts the document text to it.
    *   The Webview loads `packages/vscode-extension/dist/webview.js` which references the core parser and renderer to draw the canvas.

---

## 📝 Unity YAML Serialization Reference (For AI Reference)

Unity serializes assets into a specific multi-document YAML format. Each component has a designated ClassID.

### Important ClassID Mapping table
| ClassID | Class Name | Description |
|---|---|---|
| **1** | `GameObject` | The base node holding a list of components and active status. |
| **4** | `Transform` | Stores 3D position, rotation, scale, and hierarchy parent/children links. |
| **114** | `MonoBehaviour` | Represents C# script instances (contains custom fields and UI scripts). |
| **222** | `CanvasRenderer` | Used by Unity's rendering pipeline to prepare elements for rendering. |
| **223** | `Canvas` | The root rendering surface. Represents the top-level container of any UI hierarchy. |
| **224** | `RectTransform` | The 2D counterpart of Transform, adding Anchors, Pivot, sizeDelta, and Offset bounds. |
| **115** | `PrefabInstance` | Marks that this prefab is a variant referring to an external base prefab. |

### Unity File References
A reference within a prefab takes two forms:
1.  **Local reference**: `{fileID: 25950882}` — Points to a document within the same `.prefab` file.
2.  **External reference**: `{fileID: 11500000, guid: e197c36a43bb63640046fad76, type: 3}` — Points to a file outside the prefab (like a C# script meta file, or another base prefab variant).

> [!NOTE]
> When resolving C# script names, `packages/chrome-extension` scans the local folder's `.meta` files, mapping the `guid` found in MonoBehaviour scripts back to the original script filename!

---

## 📐 RectTransform to CSS Absolute Layout Mathematics

Unity's 2D layout uses anchors, offsets, pivot, and sizeDelta. To convert these to absolute CSS styles, use the following logic:

### Definitions:
*   `m_AnchorMin`: Min corner of the anchor bounding box (normalized `[0..1]`, e.g., `x: 0, y: 0` is bottom-left, `x: 1, y: 1` is top-right).
*   `m_AnchorMax`: Max corner of the anchor bounding box.
*   `m_AnchoredPosition`: Pivot offset from the anchor reference point.
*   `m_SizeDelta`: The difference in size compared to the anchor boundaries.
    *   If `AnchorMin.x === AnchorMax.x` (no stretch), `sizeDelta.x` is the absolute width.
    *   If `AnchorMin.x !== AnchorMax.x` (stretched), `sizeDelta.x` is the padding offset from the left/right anchors.
*   `m_Pivot`: The local pivot point around which rotation and positioning take place (normalized `[0..1]`, defaults to `x: 0.5, y: 0.5` center).

### The Math Mapping:
```typescript
const anchorMinX = properties.m_AnchorMin.x;
const anchorMaxX = properties.m_AnchorMax.x;
const anchorMinY = properties.m_AnchorMin.y;
const anchorMaxY = properties.m_AnchorMax.y;

const pivotX = properties.m_Pivot.x;
const pivotY = properties.m_Pivot.y;

const sizeDeltaX = properties.m_SizeDelta.x;
const sizeDeltaY = properties.m_SizeDelta.y;

const posX = properties.m_AnchoredPosition.x;
const posY = properties.m_AnchoredPosition.y;

// --- HORIZONTAL POSITIONING (X Axis) ---
if (anchorMinX === anchorMaxX) {
  // Constant width layout (non-stretch)
  const leftPct = anchorMinX * 100;
  el.style.left = `calc(${leftPct}% + ${posX}px)`;
  el.style.width = `${sizeDeltaX}px`;
  // Adjust transform shift to match pivot
  el.style.transform = `translateX(${-pivotX * 100}%)`;
} else {
  // Stretched layout
  const leftPct = anchorMinX * 100;
  const rightPct = (1 - anchorMaxX) * 100;
  // posX acts as center offset, sizeDelta acts as negative padding
  const paddingLeft = posX - (sizeDeltaX * pivotX);
  const paddingRight = -posX - (sizeDeltaX * (1 - pivotX));
  
  el.style.left = `calc(${leftPct}% + ${paddingLeft}px)`;
  el.style.right = `calc(${rightPct}% + ${paddingRight}px)`;
}

// --- VERTICAL POSITIONING (Y Axis - Note Unity has Y-Up, CSS has Y-Down!) ---
if (anchorMinY === anchorMaxY) {
  // Constant height layout (non-stretch)
  const topPct = (1 - anchorMinY) * 100; // Invert axis
  el.style.top = `calc(${topPct}% - ${posY}px)`;
  el.style.height = `${sizeDeltaY}px`;
  el.style.transform += ` translateY(${- (1 - pivotY) * 100}%)`;
} else {
  // Stretched layout
  const topPct = (1 - anchorMaxY) * 100;
  const bottomPct = anchorMinY * 100;
  const paddingTop = -posY - (sizeDeltaY * (1 - pivotY));
  const paddingBottom = posY - (sizeDeltaY * pivotY);
  
  el.style.top = `calc(${topPct}% + ${paddingTop}px)`;
  el.style.bottom = `calc(${bottomPct}% + ${paddingBottom}px)`;
}
```

---

## 🚫 Critical System Rules & Guardrails

To prevent regression and code degradation, all agents must adhere to the following rules:

### 1. Zero Extension Popup Autostarts
> [!CAUTION]
> Never configure `chrome-extension` to automatically open the extension's popup when reloaded. This is highly disruptive to testing workflows. The extension should remain completely silent and run entirely in the background or as inline content scripts until manually clicked.

### 2. Absolute Separation of Concerns
*   `packages/core-parser` and `packages/core-renderer` must **never** import any browser-specific APIs (like `chrome.storage`, `chrome.runtime`) or VS Code specific packages (`vscode`). 
*   If environment details are needed, pass them as generic arguments (e.g., passing maps, paths, or callback hooks).

### 3. Preserving CSS Flexbox layouts
*   When rendering layout groups (e.g., `LayoutGroupApplier`), keep the child CSS matching Unity's layout calculation exactly. If modifying Layout calculations, verify that they do not break standard nested scroll rects or list layouts.

### 4. Code Documentation Integrity
*   Always keep existing comments, function headers, and docstrings unless they are directly invalidated by your modifications.

### 5. Single Class/Interface Per File (Separated Files)
*   **Rule**: Each class, interface, type, or enum must always be declared in its own dedicated, separate file.
*   **Constraint**: Never declare multiple classes, interfaces, or types in a single source file. Exported declarations must reside in files named exactly after them to ensure clean modularity and predictable imports.

### 6. Grouped Folder Structure (Visual Project Layout)
*   **Rule**: Scripts and source files must be grouped into logical subfolders based on feature, domain, or concern.
*   **Constraint**: Avoid flattening scripts directly in a package's root `src/` directory. Group related classes, interfaces, and helpers into semantic folders (e.g., `components/`, `appliers/`, `helpers/`) to mirror a structured C# project/namespace layout.

---

## 💻 Commands & Development Guide

### Workspace Setup & Build
*   `npm install` - Installs packages across all workspaces.
*   `npm run build` - Synchronously compiles all workspace packages in dependency order.

### Preview and Dev Server
*   `npm run dev --workspace=@unity-asset-viewer/core-renderer` - Starts the standalone renderer Vite preview server. Useful for iterating on visual CSS components quickly without extensions.
*   `npm run preview:[prefab_type]` - Uses node helper scripts to preview a specific test prefab inside the browser.
    *   Examples: `npm run preview:default`, `npm run preview:layout-4-images`, `npm run preview:square-2-images`.

### Verification & Testing
*   `npm test` - Runs all unit tests via Vitest.
*   `npm test --workspace=@unity-asset-viewer/core-parser` - Runs Vitest specifically for the parser package.

---

This completes the onboarding guide. Ensure all file modifications you perform are logged in `task.md` and summarized in `walkthrough.md` for human review. Good luck!
