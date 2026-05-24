param (
    [string]$Url = "https://github.com/microsoft/MixedRealityToolkit-Unity/pulls?q=is%3Apr+prefab+UI"
)

Write-Host "Building Chrome Extension with Vite..."
cmd.exe /c "npm run build --workspace=@unity-asset-viewer/chrome-extension"

$ExtensionPath = Join-Path -Path $PWD -ChildPath "packages\chrome-extension\dist"
$TempProfile = Join-Path $env:TEMP "chrome-test-profile"

if (-Not (Test-Path $TempProfile)) {
    New-Item -ItemType Directory -Path $TempProfile | Out-Null
}

$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-Not (Test-Path $ChromePath)) {
    $ChromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}

$ArgsString = "--user-data-dir=`"$TempProfile`" --load-extension=`"$ExtensionPath`" --enable-logging --v=1"
if ($Url) {
    $ArgsString += " `"$Url`""
}

Write-Host "Using Scheduled Task to launch Chrome interactively on the user desktop..."

# Register and start a scheduled task to force Chrome to open in the interactive user session
$action = New-ScheduledTaskAction -Execute $ChromePath -Argument $ArgsString
Register-ScheduledTask -Action $action -TaskName "LaunchChromeInteractive" -User $env:USERNAME -Force | Out-Null
Start-ScheduledTask -TaskName "LaunchChromeInteractive"

# Wait a second and clean up the task
Start-Sleep -Seconds 2
Unregister-ScheduledTask -TaskName "LaunchChromeInteractive" -Confirm:$false | Out-Null

Write-Host "Chrome launched successfully on the interactive desktop!"
