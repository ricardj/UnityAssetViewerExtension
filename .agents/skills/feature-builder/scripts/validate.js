const { execSync } = require('child_process');

console.log('🧪 Starting Automated Multi-Package Validation...');
console.log('🌿 Environment: Setting CI=true to run tests in single-execution mode\n');

// Force single-execution mode for vitest and other tools
process.env.CI = 'true';

let buildSuccess = false;
let testSuccess = false;
let buildLog = '';
let testLog = '';

// --- Phase 1: Build Packages ---
console.log('📦 Phase 1: Compiling and Building Monorepo Workspaces...');
console.log('⚡ Running: npm run build');
try {
  buildLog = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
  buildSuccess = true;
  console.log('✅ Monorepo compiled successfully!\n');
} catch (error) {
  buildSuccess = false;
  buildLog = error.stdout + '\n' + error.stderr;
  console.log('❌ Monorepo compilation failed!\n');
}

// --- Phase 2: Run Unit Tests ---
if (buildSuccess) {
  console.log('🧪 Phase 2: Executing Workspace Unit Tests...');
  console.log('⚡ Running: npm test');
  try {
    testLog = execSync('npm test', { encoding: 'utf8', stdio: 'pipe' });
    testSuccess = true;
    console.log('✅ All unit tests passed successfully!\n');
  } catch (error) {
    testSuccess = false;
    testLog = error.stdout + '\n' + error.stderr;
    console.log('❌ Some unit tests failed!\n');
  }
} else {
  console.log('⚠️ Skipping Unit Tests because compilation failed.\n');
}

// --- Phase 3: Compile Report ---
console.log('📊 Producing Validation Summary Report...\n');

const reportBorder = '='.repeat(60);
console.log(reportBorder);
console.log('                 VALDIATOR AGENT SYSTEM REPORT');
console.log(reportBorder);
console.log(`Build Compilation:   ${buildSuccess ? '✅ PASSED' : '❌ FAILED'}`);
console.log(`Unit Test Suite:     ${testSuccess ? '✅ PASSED' : buildSuccess ? '❌ FAILED' : '⏭️ SKIPPED'}`);
console.log(reportBorder);

if (!buildSuccess) {
  console.log('\n🔍 Build Failure Diagnostics:');
  console.log('-'.repeat(40));
  // Print last 20 lines of build log to keep it readable
  const buildLines = buildLog.split('\n');
  const tail = buildLines.slice(-30).join('\n');
  console.log(tail);
  console.log('-'.repeat(40));
}

if (buildSuccess && !testSuccess) {
  console.log('\n🔍 Unit Test Failure Diagnostics:');
  console.log('-'.repeat(40));
  // Filter out noisy Vitest output to show actual failures
  const testLines = testLog.split('\n');
  const tail = testLines.slice(-30).join('\n');
  console.log(tail);
  console.log('-'.repeat(40));
}

console.log('\n📋 Markdown Table for walkthrough.md:\n');
console.log('| Verification Phase | Status | Details |');
console.log('| ------------------ | ------ | ------- |');
console.log(`| **Compilation**    | ${buildSuccess ? '🟢 SUCCESS' : '🔴 FAILED'} | Monorepo workspaces build \`npm run build\` |`);
console.log(`| **Unit Tests**     | ${testSuccess ? '🟢 SUCCESS' : buildSuccess ? '🔴 FAILED' : '⚪ SKIPPED'} | Monorepo Vitest suite \`npm test\` |`);
console.log('\n' + reportBorder);

// Exit with correct code
if (buildSuccess && testSuccess) {
  process.exit(0);
} else {
  process.exit(1);
}
