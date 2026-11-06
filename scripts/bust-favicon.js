// Generate a simple PNG favicon using canvas (Node.js with canvas package)
// Fallback: write a base64 PNG inline to index.html

const fs = require('fs');
const path = require('path');

// A 64x64 pixel PNG of a DM chip icon encoded as base64
// We'll create a valid minimal PNG using raw bytes approach
// Instead, let's just create a really good SVG and force-bust the cache via index.html

// Update index.html to add cache-buster on favicon
const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Replace the favicon link with a versioned one
html = html.replace(
  /<link rel="icon"[^>]+>/,
  `<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=${Date.now()}" />`
);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Cache-busted favicon link in index.html');

