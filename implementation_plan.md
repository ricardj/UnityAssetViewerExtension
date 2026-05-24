# Unity Asset Viewer Extension — Multi-Task Implementation Plan

## Background

The project is a monorepo with 4 packages (`core-parser`, `core-renderer`, `chrome-extension`, `vscode-extension`) using npm workspaces with scoped names (`@unity-asset-viewer/*`). The parser parses Unity YAML prefabs into a hierarchy, and the renderer visualizes them in a two-panel layout (visual viewport + hierarchy tree).

> [!NOTE]
> Git shows all files as deleted + untracked (likely a past `git rm --cached` or LFS issue with `.gitattributes`). We'll re-add everything properly.

---

## Task 1: Render RectTransforms as Red Square Borderlines in Visual View

**Current state**: The renderer at [index.ts](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/packages/core-renderer/src/index.ts#L136) already has `el.style.border = '1px solid red'` on every rendered node with a RectTransform — ✅ **this is already implemented**.

**However**, the `renderNode` function returns `null` for nodes without a RectTransform (line 122–124), which is correct behavior. The red borders only appear on nodes that have visual components *plus* a RectTransform, which is the correct Unity behavior.

**Proposed**: No changes needed — the feature already exists. I'll verify it still works after the build.

---

## Task 2: Show Script Names in the Hierarchy View

**Current state**: In [index.ts](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/packages/core-renderer/src/index.ts#L95-L108), the `buildHierarchyTree` function shows components under each GameObject. For MonoBehaviours, it identifies:
- `TextMeshProUGUI` (if `m_text` exists)
- `Image (Script)` (if `m_Sprite` exists)
- Generic `Script Component` (fallback)

**Problem**: Generic `MonoBehaviour` scripts all show as "Script Component" with no name. Unity MonoBehaviours have `m_Script` with a `guid` but we don't have access to the actual script name from the YAML alone. However, we can show the GUID (truncated) and any `m_Name` field, or attempt a better heuristic using known GUIDs.

### Proposed Changes

#### [MODIFY] [index.ts](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/packages/core-renderer/src/index.ts)

Improve the `buildHierarchyTree` component labeling:
- Show `m_Script.guid` (first 8 chars) for unknown MonoBehaviours: `Script (fe87c0e1…)`
- If the MonoBehaviour has an `m_EditorClassIdentifier` with a class name, use it
- Add known Unity GUID → name mappings for common scripts (Button, Toggle, ScrollRect, etc.)

---

## Task 3: Test Pipelines for Parser and Renderer

**Current state**:
- `core-parser`: Has an ad-hoc [test.js](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/packages/core-parser/tests/test.js) that reads from a hardcoded Gemini path and uses no assertions — **not a real test**
- `core-renderer`: Test script is `echo "Error: no test specified"` — **no tests at all**
- Both packages lack a test runner

### Proposed Changes

#### [MODIFY] [package.json](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/packages/core-parser/package.json)
- Add `vitest` as a dev dependency
- Update `test` script to `vitest run`

#### [NEW] `packages/core-parser/tests/parser.test.ts`
- Proper vitest test suite using the [sample.prefab](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/packages/core-parser/tests/sample.prefab) fixture
- Tests:
  - `parseUnityYaml` parses correct number of objects
  - `parseUnityYaml` extracts correct type strings (GameObject, RectTransform, Canvas, MonoBehaviour)
  - `buildHierarchy` produces correct tree structure (Canvas → Background)
  - `buildHierarchy` resolves components correctly
  - `applyModifications` works on a synthetic variant

#### [DELETE] `packages/core-parser/tests/test.js`
- Remove the ad-hoc test file

---

#### [MODIFY] [package.json](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/packages/core-renderer/package.json)
- Add `vitest`, `jsdom` as dev dependencies
- Update `test` script to `vitest run`

#### [NEW] `packages/core-renderer/tests/renderer.test.ts`
- Uses vitest with jsdom environment
- Tests:
  - `renderHierarchy` produces a DOM element with the two-panel layout
  - `renderNode` creates elements with red border for RectTransform nodes
  - `renderNode` applies correct background color for Image components
  - `renderNode` renders text content for TextMeshPro components
  - `buildHierarchyTree` creates collapsible hierarchy with correct node names

---

## Task 4: Cleanup TEST_MRS.md and PS1 File

### Proposed Changes

#### [DELETE] [TEST_MRS.md](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/TEST_MRS.md)
- This file contains links to test MRs — useful reference but doesn't belong in the repo root. The information will be moved into the README under a "Testing" section.

#### [MODIFY] [.agents/build_and_release.ps1](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/.agents/build_and_release.ps1)
- Keep this file (it's the build/release script referenced by `.agents/build_and_release.md`)
- Clean up: remove the scheduled task hack and simplify to just launch Chrome directly with `Start-Process`

> [!IMPORTANT]
> The user said "cleanup the PS1 file" — I'm interpreting this as keeping but cleaning up the script, not deleting it. If you want it deleted entirely, let me know.

---

## Task 5: Generate README

#### [NEW] [README.md](file:///c:/Users/User/Documents/1_Projects/UnityAssetViewerExtension/README.md)

Will include:
1. **Project overview** — what it does
2. **Architecture** — monorepo structure, packages diagram
3. **Prerequisites** — Node.js, npm, Chrome/VS Code
4. **Building** — `npm install`, `npm run build`, individual workspace builds
5. **Using as Chrome Extension** — load unpacked from `packages/chrome-extension/dist`, usage on GitHub/GitLab
6. **Using as VS Code Extension** — install VSIX or development mode
7. **Development** — running dev servers, project structure
8. **Testing** — running tests, test MR links (content from TEST_MRS.md)
9. **License**

---

## Task 6: Commit, Push, and Build

### Steps
1. Fix git state — re-add all files properly
2. Stage all changes
3. Commit with a descriptive message
4. Push to `origin`
5. Run `npm install` (no node_modules currently)
6. Run `npm run build` to build all workspaces
7. Run the build/release script if requested

---

## Open Questions

> [!IMPORTANT]
> **Git state**: All files show as deleted + untracked. This appears to be a git index issue. I'll do `git add .` to re-add everything, which will appear as a large diff. Is this acceptable, or should I try to fix the index first?

> [!IMPORTANT]
> **PS1 cleanup scope**: Should I *delete* the `.agents/build_and_release.ps1` and `.agents/build_and_release.sh` scripts entirely, or just clean them up (remove the scheduled task hack, simplify)?

---

## Verification Plan

### Automated Tests
1. `npm run test --workspace=@unity-asset-viewer/core-parser` — run parser tests
2. `npm run test --workspace=@unity-asset-viewer/core-renderer` — run renderer tests
3. `npm run build` — verify full build succeeds

### Manual Verification
- Check that `packages/chrome-extension/dist/` contains valid output
- Verify README renders correctly on GitHub after push
