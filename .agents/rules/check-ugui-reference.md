# Agent Rule: Consult uGUI Reference for core-renderer

## 🎯 Objective
To accurately replicate Unity UI component behaviors in TypeScript and CSS within the `core-renderer` package, AI agents must first consult the original Unity source code reference.

---

## 🚫 Critical Constraints

1. **Mandatory Reference Check**: Before starting development on any `core-renderer` components, you must consult the Unity uGUI reference documentation located locally at `docs/uGUI/com.unity.ugui`.
2. **Behavioral Accuracy**: The purpose of consulting this reference is to ensure the TypeScript and CSS replication matches the behavior and layout characteristics of the original Unity engine UI components.
3. **No Guessing**: Do not guess or hallucinate the behavior of Unity UI components. Always verify against the source code in `docs/uGUI/com.unity.ugui`.

---

## 💡 Usage

When creating or modifying components in `packages/core-renderer`:
1. Identify the corresponding component in Unity UI (e.g., `Image`, `Text`, `Button`, `RectTransform`).
2. Explore the local submodule `docs/uGUI/com.unity.ugui` for the exact C# implementation.
3. Translate the core logic, properties, layout algorithms, and defaults to your TypeScript and CSS implementations.
