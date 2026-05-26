const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const prefabPath = process.argv[2];
if (!prefabPath) {
  console.error('\x1b[31mError: Please provide a path to a .prefab file.\x1b[0m');
  console.error('Usage: npm run preview <path/to/file.prefab>');
  process.exit(1);
}

const absolutePrefabPath = path.resolve(prefabPath);
if (!fs.existsSync(absolutePrefabPath)) {
  console.error(`\x1b[31mError: File not found at "${absolutePrefabPath}"\x1b[0m`);
  process.exit(1);
}

if (path.extname(absolutePrefabPath).toLowerCase() !== '.prefab') {
  console.error('\x1b[31mError: The file must have a .prefab extension.\x1b[0m');
  process.exit(1);
}

// Find Unity Project Root
let unityProjectRoot = null;
let currentDir = path.dirname(absolutePrefabPath);

while (currentDir !== path.parse(currentDir).root) {
  if (fs.existsSync(path.join(currentDir, 'Assets'))) {
    unityProjectRoot = currentDir;
    break;
  }
  currentDir = path.dirname(currentDir);
}

if (!unityProjectRoot) {
  console.warn('\x1b[33mWarning: Could not find Unity project root (no "Assets" folder found). Local resources may not load correctly.\x1b[0m');
} else {
  console.log(`\x1b[32m✔ Found Unity project root: ${unityProjectRoot}\x1b[0m`);
}

// Setup directories
const rendererDir = path.resolve(__dirname, '../packages/core-renderer');
const tempDir = path.join(rendererDir, 'tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Copy target file
const destPrefab = path.join(tempDir, 'preview-target.prefab');
fs.copyFileSync(absolutePrefabPath, destPrefab);

// Write metadata
const destMeta = path.join(tempDir, 'preview-meta.json');
const metadata = {
  filename: path.basename(absolutePrefabPath),
  originalPath: absolutePrefabPath,
  unityProjectRoot: unityProjectRoot,
  timestamp: new Date().toISOString()
};
fs.writeFileSync(destMeta, JSON.stringify(metadata, null, 2));

// Scan Unity project for GUIDs to map to file paths
if (unityProjectRoot) {
  console.log(`\n🔍 Scanning Unity project for assets...`);
  const guidMap = {};
  const skipDirs = ['Library', 'Temp', 'Logs', 'Obj', 'UserSettings', 'Packages', 'ProjectSettings', '.git'];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!skipDirs.includes(entry.name)) {
          scanDir(path.join(dir, entry.name));
        }
      } else if (entry.isFile() && entry.name.endsWith('.meta')) {
        const fullPath = path.join(dir, entry.name);
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const match = content.match(/guid:\s*([a-fA-F0-9]{32})/);
          if (match) {
            const guid = match[1];
            // The actual asset file is the meta file path minus '.meta'
            const assetPath = fullPath.slice(0, -5);
            // Verify the asset file exists before adding to map
            if (fs.existsSync(assetPath)) {
               guidMap[guid] = assetPath;
            }
          }
        } catch (err) {
          // ignore read errors
        }
      }
    }
  }

  scanDir(unityProjectRoot);

  const destMap = path.join(tempDir, 'guid-map.json');
  fs.writeFileSync(destMap, JSON.stringify(guidMap, null, 2));
  console.log(`\x1b[32m✔ Created GUID map with ${Object.keys(guidMap).length} entries\x1b[0m`);
}

console.log(`\n\x1b[32m🚀 Preview target prepared: ${metadata.filename}\x1b[0m`);
console.log(`📂 Temp files created in: packages/core-renderer/tmp/`);

// Start Vite dev server in the background
console.log('⚡ Starting Vite dev server...');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const viteProcess = spawn(npmCmd, ['run', 'dev', '--workspace=@unity-asset-viewer/core-renderer'], {
  stdio: 'pipe',
  shell: true
});

let browserOpened = false;

viteProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);

  // Look for the local server URL (e.g. http://localhost:5173/)
  if (!browserOpened) {
    const match = output.match(/(http:\/\/localhost:\d+\/)/) || output.match(/(http:\/\/127\.0\.0\.1:\d+\/)/);
    if (match) {
      const url = match[1];
      console.log(`\n\x1b[36m🌐 Opening preview in browser: ${url}\x1b[0m`);
      openBrowser(url);
      browserOpened = true;
    }
  }
});

viteProcess.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

viteProcess.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});

viteProcess.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});

function openBrowser(url) {
  const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${startCmd} ${url}`, (err) => {
    if (err) {
      console.error('Failed to automatically open browser:', err);
    }
  });
}
