const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

console.log('🤖 Starting Push & Release Automation...');
if (dryRun) {
  console.log('🧪 RUNNING IN DRY-RUN MODE - No changes will be committed, pushed, or tagged.\n');
}

function exec(cmd) {
  if (dryRun) {
    console.log(`[DRY-RUN] Would run: ${cmd}`);
    return '';
  }
  try {
    return execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    console.error(`\n❌ Command failed: ${cmd}`);
    process.exit(1);
  }
}

function execWithOutput(cmd) {
  if (dryRun) {
    console.log(`[DRY-RUN] Would run and capture output: ${cmd}`);
    // Simulate main branch if in dry-run and git fails
    try {
      return execSync(cmd, { encoding: 'utf8' }).trim();
    } catch {
      return 'main';
    }
  }
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`\n❌ Command failed: ${cmd}`);
    process.exit(1);
  }
}

try {
  // 1. Verify Git setup
  console.log('🔍 Checking Git status...');
  const currentBranch = execWithOutput('git branch --show-current') || 'main';
  console.log(`🌿 Current Git branch: ${currentBranch}`);

  // Check remote
  const hasRemote = execWithOutput('git remote');
  if (!hasRemote) {
    if (dryRun) {
      console.log('⚠️ Warning: No Git remote configured. (Continuing simulation under dry-run)');
    } else {
      console.error('❌ Error: No Git remote configured. A remote is required to push and release.');
      process.exit(1);
    }
  }

  // 2. Read current version
  const chromePkgPath = path.resolve(__dirname, '../../../../packages/chrome-extension/package.json');
  const pkgBefore = JSON.parse(fs.readFileSync(chromePkgPath, 'utf8'));
  const currentVersion = pkgBefore.version;

  // 3. Increment Version
  console.log('\n📈 Incrementing project version...');
  const prebuildScriptPath = path.resolve(__dirname, '../../../../packages/chrome-extension/scripts/prebuild.js');
  
  let newVersion;
  if (dryRun) {
    const versionParts = currentVersion.split('.');
    versionParts[2] = parseInt(versionParts[2], 10) + 1;
    newVersion = versionParts.join('.');
    console.log(`[DRY-RUN] Would execute prebuild script to bump version at: ${prebuildScriptPath}`);
    console.log(`[DRY-RUN] Simulated version bump: ${currentVersion} -> ${newVersion}`);
  } else {
    // Run prebuild to bump on disk
    require(prebuildScriptPath);
    // Reload package.json to get the bumped version
    const pkgAfter = JSON.parse(fs.readFileSync(chromePkgPath, 'utf8'));
    newVersion = pkgAfter.version;
  }

  const tagName = `v${newVersion}`;
  console.log(`🆕 Version to release: ${newVersion} (Tag: ${tagName})`);

  // 4. Git Add & Commit
  console.log('\n💾 Staging and committing changes...');
  exec('git add .');

  const commitMsg = `chore(release): bump version to ${tagName}`;
  exec(`git commit -m "${commitMsg}"`);

  // 5. Git Push
  console.log(`\n📤 Pushing changes to remote branch: ${currentBranch}...`);
  exec(`git push origin ${currentBranch}`);

  // 6. Execute the Release script to create and push the Git tag
  console.log('\n🏷️ Executing release script to tag and trigger GitHub workflow...');
  const releaseScriptPath = path.resolve(__dirname, '../../../../scripts/release.js');
  
  if (dryRun) {
    console.log(`[DRY-RUN] Would execute release script to tag and push: ${releaseScriptPath}`);
  } else {
    // Run release script
    require(releaseScriptPath);
  }

  console.log(`\n🎉 Push and Release automated steps finished successfully!`);
} catch (err) {
  console.error('\n❌ Automation failed:', err.message);
  process.exit(1);
}
