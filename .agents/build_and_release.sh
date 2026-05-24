#!/bin/bash

URL="https://github.com/microsoft/MixedRealityToolkit-Unity/pulls?q=is%3Apr+prefab+UI"

echo "Building Chrome Extension with Vite..."
npm run build --workspace=@unity-asset-viewer/chrome-extension

EXTENSION_PATH="$(pwd -W)/packages/chrome-extension/dist"
EXTENSION_PATH="${EXTENSION_PATH//\//\\}" # Convert slashes to backslashes for Chrome on Windows

TEMP_PROFILE="$TEMP/chrome-test-profile"
mkdir -p "$TEMP_PROFILE"

# Convert TEMP_PROFILE to Windows format for Chrome
TEMP_PROFILE_WIN="$(cygpath -w "$TEMP_PROFILE")"

CHROME_PATH="/c/Program Files/Google/Chrome/Application/chrome.exe"

if [ ! -f "$CHROME_PATH" ]; then
    CHROME_PATH="/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
fi

echo "Launching isolated Chrome instance with unpacked extension..."
echo "Extension path: $EXTENSION_PATH"
echo "Profile path: $TEMP_PROFILE_WIN"

"$CHROME_PATH" --user-data-dir="$TEMP_PROFILE_WIN" --load-extension="$EXTENSION_PATH" "$URL" &

echo "Chrome launched successfully!"
