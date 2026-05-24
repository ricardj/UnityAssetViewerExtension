param (
    [string]$Url = "https://github.com/microsoft/MixedRealityToolkit-Unity/pulls?q=is%3Apr+prefab+UI"
)

Write-Host "=== Unity Asset Viewer - Build & Release ==="

# Step 1: Build the Chrome extension
Write-Host "Building Chrome Extension with Vite..."
cmd.exe /c "npm run build --workspace=@unity-asset-viewer/chrome-extension"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}
Write-Host "Build completed successfully."

# Step 2: Resolve paths
$ExtensionPath = Join-Path -Path $PWD -ChildPath "packages\chrome-extension\dist"
$TempProfile = Join-Path $env:TEMP "chrome-test-profile"

if (-Not (Test-Path $TempProfile)) {
    New-Item -ItemType Directory -Path $TempProfile | Out-Null
}

# Step 3: Find Chrome
$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-Not (Test-Path $ChromePath)) {
    $ChromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}
if (-Not (Test-Path $ChromePath)) {
    Write-Error "Chrome not found! Please install Google Chrome."
    exit 1
}

# Step 4: Launch Chrome with the unpacked extension
$Args = @(
    "--user-data-dir=`"$TempProfile`"",
    "--load-extension=`"$ExtensionPath`""
)
if ($Url) {
    $Args += "`"$Url`""
}

Write-Host "Launching Chrome with unpacked extension..."
Write-Host "  Extension: $ExtensionPath"
Write-Host "  Profile:   $TempProfile"

Start-Process -FilePath $ChromePath -ArgumentList $Args

Write-Host "Chrome launched successfully!"
