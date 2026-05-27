# Unity Asset Viewer Extension

A browser and editor extension that renders Unity UI Prefab files visually — directly inside GitHub/GitLab Merge Requests and Visual Studio Code.

Instead of reading raw YAML diffs, see your Canvas, Image, Text, and RectTransform layouts rendered as a live preview with a collapsible hierarchy tree.

![Preview](https://img.shields.io/badge/status-beta-yellow) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Visual Prefab Preview** — Renders Unity UI prefabs using CSS-mapped RectTransform layout
- **Hierarchy Tree** — Collapsible GameObject tree with component icons, mirroring Unity's Inspector
- **Script Identification** — Recognizes 25+ built-in Unity UI scripts by GUID (Image, Button, TextMeshPro, ScrollRect, etc.)
- **RectTransform Outlines** — Red border wireframes showing element bounds in the visual preview
- **Prefab Variant Support** — Resolves base prefab references from your local Unity project via the File System Access API
- **Multi-Platform** — Works as a Chrome extension on GitHub/GitLab and as a VS Code custom editor

## Architecture

```
unity-asset-viewer-extension/          (npm workspaces monorepo)
├── packages/
│   ├── core-parser/                   Parses Unity YAML → structured hierarchy
│   ├── core-renderer/                 Renders hierarchy → visual HTML/CSS
│   ├── chrome-extension/              Content script for GitHub/GitLab MRs
│   └── vscode-extension/              Custom editor for .prefab files
├── .agents/                           Build/release automation scripts
├── PLAN.md                            Architecture & roadmap
└── package.json                       Root workspace config
```

The **core-parser** and **core-renderer** packages are shared libraries consumed by both the Chrome and VS Code extensions.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ and npm v9+
- [Google Chrome](https://www.google.com/chrome/) (for the Chrome extension)
- [Visual Studio Code](https://code.visualstudio.com/) v1.80+ (for the VS Code extension)

## Building

### Install Dependencies

```bash
npm install
```

This installs all dependencies across every workspace package.

### Build All Packages

```bash
npm run build
```

This runs `tsc` or `vite build` in each package (core-parser → core-renderer → chrome-extension → vscode-extension).

### Build Individual Packages

```bash
# Parser only
npm run build --workspace=@unity-asset-viewer/core-parser

# Renderer only
npm run build --workspace=@unity-asset-viewer/core-renderer

# Chrome extension only
npm run build --workspace=@unity-asset-viewer/chrome-extension

# VS Code extension only
npm run build --workspace=unity-asset-viewer
```

## Using as a Chrome Extension

### 1. Build the Chrome Extension

```bash
npm run build --workspace=@unity-asset-viewer/chrome-extension
```

The compiled extension will be in `packages/chrome-extension/dist/`.

### 2. Load into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked**
4. Select the `packages/chrome-extension/dist/` folder

### 3. Usage

- Navigate to any GitHub or GitLab Pull/Merge Request that contains `.prefab` files
- Click the **👁️ Render UI Prefab** button that appears in the file header
- The extension fetches the raw prefab YAML, parses it, and renders the visual preview inline
- You can also view `.prefab` files directly on GitHub blob pages — the button appears next to the Raw button

### Quick Launch (Windows)

Use the included build-and-release script to build and launch Chrome with the extension loaded:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\.agents\build_and_release.ps1
```

Or with a custom URL:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\.agents\build_and_release.ps1 -Url "https://github.com/your/repo/pull/1"
```

### Prefab Variants

If a prefab is a Variant, the extension will prompt you to select your local Unity project folder. It uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) to search for the base prefab by GUID in `.meta` files. The directory handle is cached in IndexedDB for subsequent uses.

## Using as a VS Code Extension

### Development Mode

1. Build the extension:
   ```bash
   npm run build --workspace=unity-asset-viewer
   ```

2. Open this repository in VS Code

3. Press `F5` to launch the Extension Development Host

4. In the new VS Code window, open any `.prefab` file

5. Right-click the file in the explorer or editor → **Unity Asset Viewer: Show Preview**

### Installing the VSIX (Production)

> **Note:** VSIX packaging requires `vsce`. This is not yet configured — coming soon.

```bash
# Future workflow:
cd packages/vscode-extension
npx vsce package
code --install-extension unity-prefab-viewer-*.vsix
```

## Development

### Running the Renderer Dev Server

The core-renderer package includes a standalone dev server for testing rendering without any extension:

```bash
npm run dev --workspace=@unity-asset-viewer/core-renderer
```

This starts a Vite dev server that renders the test prefab fixture at `http://localhost:5173`.

### Running Tests

```bash
# Run all tests
npm test

# Run parser tests only
npm test --workspace=@unity-asset-viewer/core-parser

# Run renderer tests only
npm test --workspace=@unity-asset-viewer/core-renderer
```

### Project Structure Details

| Package | Description | Entry Point |
|---------|-------------|-------------|
| `core-parser` | Parses Unity multi-document YAML into `HierarchyNode[]` | `src/index.ts` → `parseUnityYaml()`, `buildHierarchy()` |
| `core-renderer` | Renders hierarchy to HTML/CSS with visual preview + tree | `src/index.ts` → `renderHierarchy()` |
| `chrome-extension` | Content script injected on GitHub/GitLab | `src/content.ts` |
| `vscode-extension` | Custom editor provider + webview | `src/extension.ts` + `src/webview.ts` |

## Testing with Real Prefabs

Use these repositories to find real Unity UI prefabs in Pull Requests:

- **[Mixed Reality Toolkit (MRTK)](https://github.com/microsoft/MixedRealityToolkit-Unity/pulls?q=is%3Apr+prefab+UI)** — Complex spatial computing UI prefabs
- **[Unity UI (UGUI)](https://github.com/Unity-Technologies/UI/pulls?q=is%3Apr+prefab)** — Official Unity UI sample prefabs
- **[GitHub Search](https://github.com/search?q=%22prefab%22+%22Canvas%22+%22RectTransform%22+is%3Apr&type=pullrequests)** — Find PRs with Canvas/RectTransform prefabs across GitHub

## License

MIT
