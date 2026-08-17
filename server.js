const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 3000);
const root = path.join(__dirname, 'public');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((request, response) => {
  let requested;
  try {
    requested = decodeURIComponent((request.url || '/').split('?')[0]);
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  const relative = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
  const file = path.resolve(root, relative);
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
    return;
  }

  fs.stat(file, (error, stats) => {
    const target = !error && stats.isFile() ? file : path.join(root, 'index.html');
    fs.readFile(target, (readError, content) => {
      if (readError) {
        response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Unable to load the application');
        return;
      }
      response.writeHead(200, {
        'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      response.end(content);
    });
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`My Sindbad is running on port ${port}`);
});
