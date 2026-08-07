const http = require('http');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || '0.0.0.0';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = decodeURIComponent(requestUrl.pathname);
  const relativePath = requestedPath === '/' ? 'index.html' : requestedPath.replace(/^\/+/, '');
  const resolvedPath = path.resolve(root, relativePath);

  if (!resolvedPath.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  fs.stat(resolvedPath, (statError, stats) => {
    const filePath = !statError && stats.isDirectory()
      ? path.join(resolvedPath, 'index.html')
      : resolvedPath;

    fs.readFile(filePath, (readError, content) => {
      if (readError) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      });
      response.end(content);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}/`);
});
