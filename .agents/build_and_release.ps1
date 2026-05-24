# .agents/build_and_release.ps1
# This script builds the Chrome extension and loads it into Chrome.

Write-Host "Building Chrome Extension with Vite..."
# Run npm build for the chrome-extension workspace
cmd.exe /c "npm run build --workspace=@unity-asset-viewer/chrome-extension"

$ExtensionPath = Join-Path -Path $PWD -ChildPath "packages\chrome-extension\dist"

if (-Not (Test-Path $ExtensionPath)) {
    Write-Error "Extension build directory not found at $ExtensionPath. Build may have failed."
    exit 1
}

Write-Host "Closing existing Chrome instances to reload the extension..."
# Close Chrome silently if it's running so we can reload the extension cleanly
Stop-Process -Name chrome -ErrorAction SilentlyContinue

# Wait a moment for Chrome to fully close
Start-Sleep -Seconds 2

Write-Host "Launching Chrome with unpacked extension..."
# Load the extension in Chrome. The --load-extension flag forces it to install/reload the unpacked extension.
Start-Process "chrome.exe" -ArgumentList "--load-extension=`"$ExtensionPath`""

Write-Host "Extension loaded successfully!"
