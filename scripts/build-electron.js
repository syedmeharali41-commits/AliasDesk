const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');
const appServerDest = path.join(rootDir, 'app-server');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Ensure icon exists
try {
  require('./generate-icon.js');
} catch (e) {
  console.warn('Icon generation notice:', e.message);
}

console.log('⚡ [1/4] Building Next.js application in standalone mode...');
execSync('npx next build', { stdio: 'inherit', cwd: rootDir });

console.log('📦 [2/4] Copying static assets to standalone directory...');
copyDirSync(staticSrc, staticDest);
copyDirSync(publicSrc, publicDest);

console.log('🚚 [3/4] Preparing app-server folder for packaging...');
if (fs.existsSync(appServerDest)) {
  fs.rmSync(appServerDest, { recursive: true, force: true });
}
copyDirSync(standaloneDir, appServerDest);

// Copy .env if exists
const rootEnv = path.join(rootDir, '.env');
const appServerEnv = path.join(appServerDest, '.env');
if (fs.existsSync(rootEnv) && !fs.existsSync(appServerEnv)) {
  fs.copyFileSync(rootEnv, appServerEnv);
}

// Copy prisma if exists
const prismaSrc = path.join(rootDir, 'prisma');
const prismaDest = path.join(appServerDest, 'prisma');
if (fs.existsSync(prismaSrc)) {
  copyDirSync(prismaSrc, prismaDest);
}

console.log('✨ [4/4] App-server prepared successfully for Electron packaging!');
