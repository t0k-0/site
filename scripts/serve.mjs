import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const decodedPath = decodeURIComponent(url.pathname).replace(/^[/\\]+/, '');
    const requested = decodedPath ? normalize(decodedPath) : '';
    const reservedPolicy = requested.replaceAll('\\', '/') === '.well-known/tdmrep.json';
    if (!['GET', 'HEAD'].includes(request.method) || (!reservedPolicy && requested.split(/[\\/]/).some((segment) => segment.startsWith('.')))) {
      throw new Error('Unsupported request');
    }
    let target = join(root, requested || 'index.html');
    const pathFromRoot = relative(root, target);
    if (pathFromRoot.startsWith('..') || isAbsolute(pathFromRoot)) throw new Error('Path outside site root');
    if ((await stat(target)).isDirectory()) target = join(target, 'index.html');
    const body = await readFile(target);
    response.writeHead(200, {
      'Content-Type': types[extname(target).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`TK site running at http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop.');
});
