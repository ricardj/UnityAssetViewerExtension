const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Get version from packages/chrome-extension/package.json
const chromePackageJsonPath = path.resolve(__dirname, '../packages/chrome-extension/package.json');
const pkg = JSON.parse(fs.readFileSync(chromePackageJsonPath, 'utf8'));
const version = pkg.version;
const tagName = `v${version}`;

console.log(`🚀 Preparing release for version ${version} (Tag: ${tagName})...`);

try {
  // Check if working directory is clean
  const status = execSync('git status --porcelain').toString().trim();
  if (status) {
    console.warn('⚠️ Warning: You have uncommitted changes in your working directory. Pushing a tag will release the current HEAD commit.');
  }

  // Check if tag already exists locally
  console.log('🔍 Checking if tag already exists...');
  let tagExists = false;
  try {
    execSync(`git rev-parse ${tagName}`, { stdio: 'ignore' });
    tagExists = true;
  } catch (e) {
    // Tag does not exist
  }

  if (tagExists) {
    console.error(`\n❌ Error: Tag ${tagName} already exists locally.`);
    console.log(`💡 To trigger a new release, first build the extension to increment the version, or edit packages/chrome-extension/package.json manually.`);
    process.exit(1);
  }

  // 2. Create the git tag
  console.log(`🏷️ Creating local git tag: ${tagName}...`);
  execSync(`git tag ${tagName}`, { stdio: 'inherit' });

  // 3. Push the tag to origin
  console.log(`📤 Pushing tag ${tagName} to origin...`);
  execSync(`git push origin ${tagName}`, { stdio: 'inherit' });

  console.log(`\n✅ Successfully triggered release for ${tagName}!`);
  console.log(`🔗 Go to your GitHub repository Actions or Releases tab to monitor the build.`);
} catch (error) {
  console.error('\n❌ Failed to trigger release:', error.message);
  process.exit(1);
}
