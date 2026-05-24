<skill>
name: build_and_release
description: Builds the Chrome extension and loads it into Chrome (reloading/uninstalling the old one).
</skill>

# Build and Release Skill

When the user asks to build and release the extension, execute the `build_and_release.ps1` script to compile the Vite project and load the unpacked extension directly into Google Chrome.

## Instructions
1. Ensure you are in the root directory.
2. Run `powershell.exe -ExecutionPolicy Bypass -File .\.agents\build_and_release.ps1`
3. Verify that Chrome launches successfully with the extension.
