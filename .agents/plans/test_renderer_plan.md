# Unity Prefab CLI Preview Tool

This implementation plan outlines the steps to build a Command Line Interface (CLI) preview utility for the `core-renderer` package. 

When a user runs `npm run preview path/to/some.prefab` from the root of the project:
1. The script copies the target `.prefab` file to a temporary location served by Vite.
2. It boots up the Vite dev server in the background (or keeps it running).
3. It automatically opens the browser to render the specified prefab.

We will also elevate the visual design of the testbench page to feel premium and professional.

## User Review Required

> [!NOTE]
> - We will create a new node script at `scripts/preview.js`.
> - **Temporary files will be isolated in a `temp/` folder inside `packages/core-renderer/temp/`** instead of the `src/` directory to prevent code clutter and accidental commits. We will add `packages/core-renderer/temp/` to `.gitignore`.
> - We will update `packages/core-renderer/src/dev.ts` to dynamically fetch the previewed prefab, falling back to the standard sample prefab if none is active.
> - We will add an interactive toolbar to the preview page to reset/reload the preview and show which file is currently being viewed.

---

## Proposed Changes

### Root Configuration

#### [MODIFY] [.gitignore](file:///C:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/.gitignore)
- Add `packages/core-renderer/temp/` to ignore all generated preview target assets.

#### [MODIFY] [package.json](file:///C:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/package.json)
- Add a new `"preview"` script: `"preview": "node scripts/preview.js"`

#### [NEW] [preview.js](file:///C:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/scripts/preview.js)
- A Node.js CLI script that:
  - Takes the prefab file path as a command-line argument.
  - Verifies the file exists and has a `.prefab` extension.
  - Copies the file's content into a designated preview file inside the renderer workspace (`packages/core-renderer/temp/preview-target.prefab`). Also writes a tiny metadata file `packages/core-renderer/temp/preview-meta.json` with the original filename.
  - Spawns the Vite dev server using `npm run dev --workspace=@unity-asset-viewer/core-renderer` in the background (or checks if it is already running).
  - Automatically opens the browser using cross-platform `child_process` (supporting Windows `start`, macOS `open`, and Linux `xdg-open`).

---

### Core Renderer Package

#### [MODIFY] [dev.ts](file:///C:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/packages/core-renderer/src/dev.ts)
- Transition `init()` to an async function.
- Dynamically `fetch('/temp/preview-target.prefab')` at runtime.
- If the fetch fails (file not found or server error), fall back to `samplePrefab` (the default sample).
- Dynamically `fetch('/temp/preview-meta.json')` to display the name of the file being previewed in our UI.

#### [MODIFY] [index.html](file:///C:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/packages/core-renderer/index.html)
- Style the page using premium, modern dark-mode aesthetics.
- Replace basic styles with a rich layout:
  - Add a professional top banner showing "Unity Asset Viewer - Live Testbench".
  - Include a status pill displaying either "🟢 Previewing: [Filename]" or "🔵 Viewing Default Sample".
  - Use modern typography (Outfit / Inter from Google Fonts).

---

## Verification Plan

### Manual Verification
1. Run `npm run preview packages/core-parser/tests/sample.prefab` to test the script with the built-in sample prefab.
   - Verify it spins up Vite and opens the browser.
   - Verify the page displays "Previewing: sample.prefab" and shows the preview.
2. Run `npm run preview unity-test-project/Assets/Prefab/SimpleSquare.prefab`.
   - Verify the browser loads and renders the new prefab correctly.
   - Verify the status banner updates to "Previewing: SimpleSquare.prefab".
3. Verify that running the dev server directly (`npm run dev` in `packages/core-renderer`) still loads the default sample safely without breaking.
