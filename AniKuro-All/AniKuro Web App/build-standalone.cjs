const fs = require('fs');
const path = require('path');

const webAppDir = __dirname;
const distDir = path.join(webAppDir, 'dist');
const mobileAssetsDir = path.join('D:\\AniKuro', 'AniKuro Mobile App', 'app', 'src', 'main', 'assets', 'public');

// Find built CSS and JS in dist/assets
const assetsDir = path.join(distDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  console.error('dist/assets directory does not exist. Run vite build first.');
  process.exit(1);
}

const assetFiles = fs.readdirSync(assetsDir);
const cssFile = assetFiles.find(f => f.endsWith('.css'));
const jsFile = assetFiles.find(f => f.endsWith('.js'));

if (!cssFile || !jsFile) {
  console.error('Could not find built CSS or JS in dist/assets');
  process.exit(1);
}

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>Anikuro (アニクロ) - Anime Tracker & AI Oracle</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'" />
    <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" /></noscript>
    <style>
${cssContent}
    </style>
  </head>
  <body class="overflow-x-hidden select-none">
    <div id="root"></div>
    <script>
      window.addEventListener('error', function(e) {
        var errBox = document.getElementById('debug-error-box');
        if (!errBox) {
          errBox = document.createElement('div');
          errBox.id = 'debug-error-box';
          errBox.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#090d16;color:#f87171;padding:24px;font-family:monospace;font-size:13px;z-index:999999;overflow:auto;word-break:break-all;';
          document.body.appendChild(errBox);
        }
        errBox.innerHTML += '<h3 style="color:#ef4444;font-size:16px;margin-bottom:8px;">⚠️ JavaScript Runtime Error</h3>' +
          '<p><strong>Message:</strong> ' + (e.message || 'Unknown') + '</p>' +
          '<p><strong>Source:</strong> ' + (e.filename || '') + ':' + (e.lineno || '') + '</p>' +
          '<pre style="background:#020617;padding:12px;border-radius:8px;border:1px solid #334155;color:#cbd5e1;overflow-x:auto;">' + (e.error ? e.error.stack : '') + '</pre>';
      });
      window.addEventListener('unhandledrejection', function(e) {
        var errBox = document.getElementById('debug-error-box');
        if (!errBox) {
          errBox = document.createElement('div');
          errBox.id = 'debug-error-box';
          errBox.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#090d16;color:#f87171;padding:24px;font-family:monospace;font-size:13px;z-index:999999;overflow:auto;word-break:break-all;';
          document.body.appendChild(errBox);
        }
        errBox.innerHTML += '<h3 style="color:#ef4444;font-size:16px;margin-bottom:8px;">⚠️ Unhandled Promise Rejection</h3>' +
          '<p><strong>Reason:</strong> ' + (e.reason ? (e.reason.message || e.reason) : 'Unknown') + '</p>';
      });
    </script>
    <script type="module">
${jsContent.replace(/<\/script>/g, '<\\/script>')}
    </script>
  </body>
</html>`;

// 1. Write standalone single-file index.html directly into AniKuro Web App/
fs.writeFileSync(path.join(webAppDir, 'index.html'), standaloneHtml, 'utf8');
console.log('✓ Created standalone AniKuro Web App/index.html (' + (standaloneHtml.length / 1024 / 1024).toFixed(2) + ' MB)');

// 2. Also write standalone single-file into dist/index.html and dist/standalone.html
fs.writeFileSync(path.join(distDir, 'index.html'), standaloneHtml, 'utf8');
fs.writeFileSync(path.join(distDir, 'standalone.html'), standaloneHtml, 'utf8');

// 3. Write standalone production index.html and assets into Mobile App public assets
if (fs.existsSync(mobileAssetsDir)) {
  fs.writeFileSync(path.join(mobileAssetsDir, 'index.html'), standaloneHtml, 'utf8');
  console.log('✓ Updated Mobile App public/index.html (Self-Contained WebView Bundle)');

  const mobileDistAssetsDir = path.join(mobileAssetsDir, 'assets');
  if (fs.existsSync(mobileDistAssetsDir)) {
    const existingMobileAssets = fs.readdirSync(mobileDistAssetsDir);
    for (const f of existingMobileAssets) {
      if (f.endsWith('.js') || f.endsWith('.css')) {
        fs.unlinkSync(path.join(mobileDistAssetsDir, f));
      }
    }
  } else {
    fs.mkdirSync(mobileDistAssetsDir, { recursive: true });
  }

  for (const f of assetFiles) {
    fs.copyFileSync(path.join(assetsDir, f), path.join(mobileDistAssetsDir, f));
  }
  console.log('✓ Synced dist/assets into Mobile App public/assets');
}

console.log('Standalone packaging complete.');
