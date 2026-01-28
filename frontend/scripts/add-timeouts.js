const fs = require('fs');
const path = require('path');

// Files to process
const testFiles = [
  'src/pages/ForgotPasswordPage.test.tsx',
  'src/pages/ResetPasswordPage.test.tsx',
  'src/components/MarketplaceDialog.test.tsx',
  'src/pages/SettingsPage.test.tsx',
];

testFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Pattern: waitForWithTimeout(() => { ... }) without timeout
  // We'll add default timeout of 2000ms, but this needs manual review
  // For now, just ensure all have some timeout
  
  // Count how many need timeouts
  const withoutTimeout = (content.match(/waitForWithTimeout\(\(\) => \{[\s\S]*?\}\)\s*\)/g) || []).length;
  
  console.log(`${filePath}: Found ${withoutTimeout} waitForWithTimeout calls that may need timeouts`);
  
  // Note: Manual review and adjustment needed for specific timeout values
});

console.log('Review complete. Manual timeout adjustment needed.');
