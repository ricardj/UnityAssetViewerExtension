# Agent Instructions (AGENTS.md)

Welcome! This repository contains a set of custom rules, workflows, and skills designed to guide AI agents and ensure codebase consistency and high quality.

The full details of these guidelines are located in the `.agents` folder at the root of this project.

## Rules
The project follows strict architectural and naming rules located in `.agents/rules/`:

- **Self-Explanatory Names:** All files, classes, interfaces, variables, and methods must use long, descriptive, self-explanatory names, and strictly adhere to C# naming conventions. Classes and structs use PascalCase, interfaces use PascalCase with an `I` prefix. Never use short, cryptic, or highly abbreviated names.
- **Separated Files:** Maintain high modularity. A single source file must not contain more than one primary class or interface declaration.
- **Grouped Folders:** Scripts and source files must be grouped into logical subfolders based on feature, domain, or concern (e.g., `components/`, `appliers/`, `parsers/`) to maintain a clear visual hierarchy, rather than being flattened at the root of a package.
- **Consult uGUI Reference:** Always consult the local submodule at `docs/uGUI/com.unity.ugui` when developing or modifying `core-renderer` components to accurately replicate Unity UI engine behavior.

## Workflows
We have defined specific multi-agent workflows located in `.agents/workflows/`:

- **Feature-Building Workflow:** A structured three-agent pipeline (Pre-flight Agent, Coding Agent, Validator Agent) designed for implementing, verifying, and validating new features or bug fixes while ensuring extreme layout accuracy and strict environment isolation.
- **Push & Release Project:** A workflow to safely bump the project version, stage all modified files, commit and push changes, and trigger the GitHub Actions release workflow.

## Skills
The repository provides skills to automate and execute the workflows, located in `.agents/skills/`:

- **Feature Builder Skill:** Automates the multi-agent pipeline (Pre-flight, Coding, and Validator) to design, build, and verify new features. Includes a validation helper script (`.agents/skills/feature-builder/scripts/validate.js`).
- **Push and Release Skill:** Safely increments the project version, commits/pushes all outstanding files, and runs the release script to trigger the GitHub workflow for release. Includes an automation script (`.agents/skills/push-and-release/scripts/push-and-release.js`).

If you are instructed to perform tasks like building a feature or pushing a release, you should rely on the above skills and workflows to accomplish your task efficiently.
