# Workflow: Push & Release Project

A structured workspace agent workflow to safely bump the project version, stage all modified files, commit and push changes, and trigger the GitHub Actions release workflow.

## Description
This workflow automates the software release lifecycle for the Unity Asset Viewer Extension. It ensures Git hygiene, runs the prebuild script to increment the Chrome Extension version, commits the version changes with structured messages, pushes to the active remote branch, and triggers a new release on GitHub.

---

## Steps

### Step 1: Pre-Release Verification
*   **Goal**: Ensure Git and the local workspace are in a healthy, release-ready state.
*   **Agent Actions**:
    1.  Verify the active branch by executing:
        ```powershell
        git branch --show-current
        ```
    2.  Check for existing uncommitted changes:
        ```powershell
        git status
        ```
    3.  Confirm that a Git remote is configured and active:
        ```powershell
        git remote -v
        ```
*   **Checkpoint**: The active branch should be `main` (or a designated release branch), and a valid remote `origin` pointing to the GitHub repository must exist.

### Step 2: Simulated Dry Run
*   **Goal**: Run a dry-run check to verify the simulated version bump and list the commands to be executed.
*   **Agent Actions**:
    1.  Execute the script in dry-run mode:
        ```powershell
        npm run push-release -- --dry-run
        ```
    2.  Review the output to confirm:
        *   The current version and the proposed new version (e.g., `1.0.31` -> `1.0.32`).
        *   Staging and commit actions.
        *   Tag release triggers.
*   **Checkpoint**: Present the dry-run summary to the user and obtain explicit confirmation to proceed.

### Step 3: Run Full Push & Release
*   **Goal**: Execute the live release process.
*   **Agent Actions**:
    1.  Execute the live automation script:
        ```powershell
        npm run push-release
        ```
    2.  Wait for the command to finish and parse the output logs.
*   **Checkpoint**: Ensure the console outputs `Successfully triggered release for vX.Y.Z!` and `Push and Release automated steps finished successfully!`.

### Step 4: Final Validation
*   **Goal**: Complete the workflow and hand over tracking links to the user.
*   **Agent Actions**:
    1.  Confirm the Git tag is pushed:
        ```powershell
        git tag --list
        ```
    2.  Provide the user with:
        *   The new release version number.
        *   A link to monitor the active GitHub Actions run: `https://github.com/ricardj/UnityAssetViewerExtension/actions`
