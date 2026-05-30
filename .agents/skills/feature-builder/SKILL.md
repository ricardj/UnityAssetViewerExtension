---
name: feature-builder
description: Automates the multi-agent pipeline (Pre-flight check, Code implementation, and Validator review) to design, build, and verify new features.
---
# Feature Builder Skill

This skill guides the **Antigravity Gemini** parent agent through a structured three-agent pipeline (Pre-flight, Coding, and Validator) to design, implement, and verify new features or bug fixes.

## Use Cases
Use this skill when the user asks to:
- "build a new feature"
- "add a feature"
- "implement a capability"
- "refactor a component"
- "fix a complex bug"

---

## Execution Procedure

When a feature request is received, perform the following phases in order:

### Phase 1: Pre-flight (Analysis & Design)
1.  **Read Prompts & Guidelines**:
    *   Load `ARCHITECTS.md` to review development rules.
    *   Load `.agents/skills/feature-builder/prompts/preflight_agent.txt` as the system prompt.
2.  **Spawn Pre-flight Agent**:
    *   Define a new subagent named `Pre-flight Agent` with the preflight system prompt using the `define_subagent` tool.
    *   Invoke it using the `invoke_subagent` tool, passing the user's feature request as the prompt.
3.  **Inspect Plan**:
    *   The Pre-flight Agent will perform environment safety checks and write the draft `implementation_plan.md` in the brain folder.
    *   It will ask you to present the plan to the user.
4.  **User Review**:
    *   Present the plan to the user and request their feedback (`request_feedback = true` in `implementation_plan.md`).
    *   **STOP** and wait for explicit user approval before proceeding.

### Phase 2: Coding (Implementation)
1.  **Load Coding Prompt**:
    *   Load `.agents/skills/feature-builder/prompts/coding_agent.txt` as the system prompt.
2.  **Spawn Coding Agent**:
    *   Define a new subagent named `Coding Agent` with the coding system prompt.
    *   Invoke it with a task prompt: `"Read implementation_plan.md and implement the changes described. Maintain task.md as you work."`
3.  **Implementation Review**:
    *   The Coding Agent will carry out changes across workspaces, maintain comments, and update the `task.md` checklist.
    *   Wait for it to report completion.

### Phase 3: Validation (Verifying & Summarizing)
1.  **Load Validator Prompt**:
    *   Load `.agents/skills/feature-builder/prompts/validator_agent.txt` as the system prompt.
2.  **Spawn Validator Agent**:
    *   Define a new subagent named `Validator Agent` with the validator system prompt.
    *   Invoke it with a task prompt: `"Run the workspace build and tests using the validation script at .agents/skills/feature-builder/scripts/validate.js. Create a walkthrough.md summarizing the results."`
3.  **Automated Checks**:
    *   The Validator Agent will execute the validation script, check for compile/test errors, and either report failures back to the Coding phase or construct a premium `walkthrough.md` report.
4.  **Workflow Completion**:
    *   Verify the final state of `task.md` and `walkthrough.md`.
    *   Deliver a concise summary of accomplishments and hand-off links to the user.

---

## 🛠️ Automated Tools & Verification
A validation helper script is located at:
`node .agents/skills/feature-builder/scripts/validate.js`

Always run this script from the workspace root to check TypeScript compiling, package builds, and test coverage across the entire workspaces monorepo.
