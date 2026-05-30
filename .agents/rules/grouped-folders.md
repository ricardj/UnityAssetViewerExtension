# Agent Rule: Grouped Folder Structure

## 🎯 Objective
To maintain a clean, visual, and highly structured directory hierarchy (mirroring organized C# project/namespace structures), scripts and source files must be grouped into logical subfolders based on feature, domain, or concern, rather than being flattened at the root of a package or main source directory.

---

## 🚫 Critical Constraints

1. **No Flattened Roots**: Do not place new scripts or source files directly in the root of the source directory (e.g., `src/`) of any package if they can be logically grouped.
2. **Logical Subfolder Grouping**: Create dedicated folders grouping related elements. For instance, group UI components under `components/`, layout calculation logic under `appliers/`, and parser logic under `parsers/`.
3. **Cohesive Folders**: A group folder should gather all closely related files—including their primary classes, interfaces, sub-types, and unit tests—so that they are physically colocated.
4. **Consistency with Namespaces**: Folder structures should mirror the conceptual namespace layout of the application, making it intuitive to navigate and locate code.

---

## 💡 Code Examples

### ❌ Bad Practice (Do NOT do this)

Flattening all source files inside the `src/` directory, leading to a cluttered, hard-to-navigate codebase:

```
packages/core-renderer/src/
├── UnityViewer.ts
├── RectTransformApplier.ts
├── LayoutGroupApplier.ts
├── ContentSizeFitterApplier.ts
├── VisualComponentRenderer.ts
├── ElementHelper.ts
├── StyleHelper.ts
└── ViewerTypes.ts
```

###  Good Practice (Do this instead)

Group related scripts into logical subfolders to create a structured visual hierarchy:

```
packages/core-renderer/src/
├── appliers/
│   ├── ContentSizeFitterApplier.ts
│   ├── LayoutGroupApplier.ts
│   └── RectTransformApplier.ts
├── components/
│   └── VisualComponentRenderer.ts
├── helpers/
│   ├── ElementHelper.ts
│   └── StyleHelper.ts
├── types/
│   └── ViewerTypes.ts
└── viewer/
    └── UnityViewer.ts
```

---

## 🛡️ Exception Checklist
* The primary entry point or main bootstrap file of a package (e.g., `index.ts` or `main.ts`) can be placed at the root of the source directory.
* Extremely small packages with fewer than 3 total files do not require subfolders, but must be restructured once they grow beyond 3 files.
