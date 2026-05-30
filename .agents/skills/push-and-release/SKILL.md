---
name: push-and-release
description: Safely increments the project version, commits/pushes all outstanding files, and runs the release script to trigger the GitHub workflow for release.
---
# Push and Release Skill

This skill provides instructions and automation to bump the project version, commit and push all code changes to the remote branch, and trigger the GitHub Release workflow by executing the release script.

## Use Cases
Use this skill when the user asks to:
- "push and release"
- "release the project"
- "bump version and push a release"
- "trigger the github release workflow"

## Execution Procedure

When a "push and release" command is requested, perform the following steps:

### 1. Verification and Sanity Check
Before running any mutating command, confirm with the user that they are ready to release. Ask if there are specific outstanding files they want to commit.

### 2. Run the Automation Script (Dry Run First)
Run a dry-run of the automation script to verify everything is set up correctly:
```powershell
node .agents/skills/push-and-release/scripts/push-and-release.js --dry-run
```
*Note: Make sure to run this command from the project root directory.*

### 3. Run the Full Automation
Once the dry-run succeeds and you have verified the steps, execute the script to perform the actual release:
```powershell
node .agents/skills/push-and-release/scripts/push-and-release.js
```
This script will:
1. Run the Chrome Extension prebuild script to increment the version number in `package.json`, `manifest.json`, and `popup.html`.
2. Stage all modifications and untracked changes (`git add .`).
3. Commit the changes: `chore(release): bump version to v<new-version>`.
4. Push the commit to the active branch on `origin`.
5. Execute the release script to create the Git tag `v<new-version>` and push it to `origin`, triggering the GitHub Actions workflow `Build and Release Extensions`.

### 4. Provide the Summary
After successful execution, provide the user with:
- The new version number.
- A confirmation of the committed files.
- A link to the GitHub repository's Actions/Releases tab.
