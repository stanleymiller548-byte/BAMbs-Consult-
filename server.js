/**
 * BAMbs Consult (BAc) — Node.js Web Server
 * www.bambsconsult.org
 * 
 * Run with:  node server.js
 * Access at: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer((req, res) => {
  // Log each request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Parse URL — strip query string
  let urlPath = req.url.split('?')[0];

  // Default to index.html
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }

  // Resolve file path (serve from same directory as server.js)
  const filePath = path.join(__dirname, urlPath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  // Read and serve the file
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found — serve index.html for SPA routing
        fs.readFile(path.join(__dirname, 'index.html'), (err2, html) => {
          if (err2) {
            res.writeHead(500); return res.end('Server Error');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    });

    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║         BAMbs Consult (BAc) Web Server           ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Running on:  http://localhost:${PORT}               ║`);
  console.log('║  Domain:      www.bambsconsult.org               ║');
  console.log('║  Status:      ✓ Server Online                    ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try: PORT=3001 node server.js`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\nShutting down BAc server gracefully...');
  server.close(() => process.exit(0));
});
