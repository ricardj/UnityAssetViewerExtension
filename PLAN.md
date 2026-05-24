# Unity Asset Viewer Extension

## Objective
Create a browser extension (Chrome) to render and review Unity Prefabs (specifically UI prefabs) directly within GitHub and GitLab Merge Requests (MRs). The core logic should be reusable for a future Visual Studio Code extension.

## Architecture

To ensure reusability between the Chrome extension and the VS Code extension, the project will be divided into three main packages (monorepo structure recommended, e.g., using npm workspaces or pnpm):

1. **`core-parser` (TypeScript)**
   - **Responsibility:** Parse Unity's custom YAML format. Unity prefabs are multi-document YAML files with custom tags (e.g., `--- !u!1 &12345`).
   - **Output:** A standardized JSON representation of the GameObject hierarchy and their components (RectTransform, Canvas, Image, TextMeshPro, etc.).

2. **`core-renderer` (TypeScript / Web Components)**
   - **Responsibility:** Take the JSON representation and render it.
   - **Approach:** For UI prefabs, mapping Unity's `RectTransform` to HTML/CSS (using absolute positioning and transforms) is often the most lightweight approach. Alternatively, a Canvas/WebGL based renderer could be used.
   - **Output:** A DOM element or Canvas that can be embedded anywhere.

3. **`chrome-extension`**
   - **Responsibility:** Inject into GitHub and GitLab web pages.
   - **Action:** Detect when a `.prefab` file is being viewed in a PR/MR diff or file explorer.
   - **Integration:** Hide the raw YAML text diff and inject the `core-renderer` output, adding UI controls to toggle between visual and text views.

4. **`vscode-extension` (Future)**
   - **Responsibility:** Provide a custom editor for `.prefab` files in VS Code.
   - **Integration:** Use VS Code's Webview API to host the `core-renderer`.

## Tech Stack
- **Language:** TypeScript
- **Build System:** Vite / Rollup for fast bundling.
- **UI Framework:** Preact, Lit, or Vanilla JS / Web Components (to keep it lightweight and avoid DOM conflicts on GitHub/GitLab).
- **YAML Parsing:** A custom or specialized YAML parser capable of handling Unity's object references and multi-document structure.

## Phases of Development

### Phase 1: Research & Core Parser
- Analyze Unity UI Prefab YAML structure.
- Build a parser that extracts the hierarchy of GameObjects and components.
- Write unit tests using sample `.prefab` files.

### Phase 2: Core Renderer (Proof of Concept)
- Create a basic HTML/CSS mapping for `RectTransform` anchors and pivots.
- Render a simple UI prefab (e.g., a Canvas with nested Images and Texts) in an isolated local HTML page.

### Phase 3: Chrome Extension Integration
- Setup basic Chrome extension manifest (V3).
- Implement content scripts for GitHub PR diff pages.
- Integrate the parser and renderer to show the visual representation on GitHub.

### Phase 4: Refinement & GitLab Support
- Improve rendering accuracy (handling fonts, colors, layouts).
- Add content scripts for GitLab MRs.

### Phase 5: VS Code Extension
- Scaffold a VS Code extension.
- Implement the custom editor webview using the core packages.

## Next Steps
1. Initialize the monorepo structure.
2. Gather a set of sample Unity UI prefabs for testing.
3. Start exploring Unity YAML parsing approaches.
