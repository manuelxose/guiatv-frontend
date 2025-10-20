const fs = require('fs');
const path = require('path');
const { copyFileSync, mkdirSync, rmSync } = fs;

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  mkdirSync(to, { recursive: true });
  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyFolderSync(src, dest);
    } else {
      copyFileSync(src, dest);
    }
  }
}

const root = path.resolve(__dirname, '..');
const distGuiatv = path.join(root, 'dist', 'guiatv');
const functionsDist = path.join(root, 'functions', 'dist', 'guiatv');

try {
  // clean target
  if (fs.existsSync(functionsDist)) {
    rmSync(functionsDist, { recursive: true, force: true });
  }
  // copy entire dist/guiatv into functions/dist/guiatv (includes browser & server bundles)
  copyFolderSync(distGuiatv, functionsDist);

  // Ensure the server bundle can find index.html at the expected root path
  // Angular builds sometimes emit index.html, index.csr.html or index.server.html.
  // Try a few common locations and copy the first one we find to functions/dist/guiatv/index.html
  const possibleIndexFiles = [
    path.join(distGuiatv, 'browser', 'index.html'),
    path.join(distGuiatv, 'browser', 'index.csr.html'),
    path.join(distGuiatv, 'server', 'index.server.html'),
    path.join(distGuiatv, 'server', 'index.html'),
  ];
  const rootIndex = path.join(functionsDist, 'index.html');
  for (const candidate of possibleIndexFiles) {
    if (fs.existsSync(candidate)) {
      copyFileSync(candidate, rootIndex);
      break;
    }
  }

  console.log('Copied dist/guiatv/browser and dist/guiatv/server to functions/dist/guiatv');
} catch (err) {
  console.error('Error copying dist to functions:', err);
  process.exit(1);
}
