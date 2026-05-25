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
  timestamp: new Date().toISOString()
};
fs.writeFileSync(destMeta, JSON.stringify(metadata, null, 2));

console.log(`\n\x1b[32m🚀 Preview target prepared: ${metadata.filename}\x1b[0m`);
console.log(`📂 Temp files created in: packages/core-renderer/temp/`);

// Start Vite dev server in the background
console.log('⚡ Starting Vite dev server...');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const <Down>iteProcess = spawn(npmCmd, ['run', 'dev', '--workspace=@unity-asset-viewer/core-renderer'], {
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

function op<Dowh>hBrowser(url) {
  const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${startCmd} ${url}`, (err) => {
    if (err) {
      console.error('Failed to automatically open browser:', err);
    }
  });
}
