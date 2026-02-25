// editor-server.js — tiny dev server with file-save endpoint
// Usage: node editor-server.js
// Serves on http://localhost:8080  +  POST /save writes terralex-landing.html

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const ROOT = __dirname;
const PORT = 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.obj':  'text/plain',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  // CORS for editor fetch calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── POST /save  ─────────────────────────────────────────────────────────
  if (req.method === 'POST' && url.parse(req.url).pathname === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { filename, content } = JSON.parse(body);
        // Safety: only allow writing files inside ROOT, no path traversal
        const target = path.resolve(ROOT, filename);
        if (!target.startsWith(ROOT + path.sep) && target !== ROOT) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'path not allowed' }));
          return;
        }
        fs.writeFileSync(target, content, 'utf8');
        console.log(`[save] wrote ${filename} (${content.length} bytes)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        console.error('[save] error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // ── GET static files ─────────────────────────────────────────────────────
  let pathname = url.parse(req.url).pathname;
  if (pathname === '/') pathname = '/terralex-landing.html';

  const filepath = path.join(ROOT, decodeURIComponent(pathname));

  // Prevent path traversal
  if (!filepath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500);
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Server error');
      return;
    }
    const ext  = path.extname(filepath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const headers = { 'Content-Type': mime };
    if (ext === '.html') headers['Cache-Control'] = 'no-store';
    res.writeHead(200, headers);
    res.end(data);
  });

}).listen(PORT, () => {
  console.log(`\n  Editor server running at http://localhost:${PORT}/terralex-landing.html\n`);
});
