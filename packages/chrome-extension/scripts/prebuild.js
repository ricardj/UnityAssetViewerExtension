const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');
const manifestJsonPath = path.resolve(__dirname, '../public/manifest.json');
const popupHtmlPath = path.resolve(__dirname, '../public/popup.html');

// 1. Read package.json
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 2. Increment patch version
const versionParts = pkg.version.split('.');
versionParts[2] = parseInt(versionParts[2], 10) + 1;
pkg.version = versionParts.join('.');
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Bumped version to ${pkg.version}`);

// 3. Update manifest.json
const manifest = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
manifest.version = pkg.version;
fs.writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2) + '\n');

// 4. Update popup.html
let popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
// Regex to replace the H3 title with the new version
popupHtml = popupHtml.replace(/<h3>Unity Asset Viewer.*?<\/h3>/, `<h3>Unity Asset Viewer v${pkg.version}</h3>`);
fs.writeFileSync(popupHtmlPath, popupHtml);
