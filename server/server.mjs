import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat, rename, readdir, copyFile, unlink } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const distDir = resolve(process.env.MULTIPROD_DIST || join(root, 'dist'));
const dataDir = resolve(process.env.MULTIPROD_DATA_DIR || join(root, 'data'));
const dataFile = join(dataDir, 'multiprodtool-data.json');
const backupDir = join(dataDir, 'backups');
const maxBodyBytes = Number(process.env.MULTIPROD_MAX_BODY_BYTES || 10 * 1024 * 1024);
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
};
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '0.0.0.0';


function backupStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function createBackupIfDataExists() {
  try {
    await stat(dataFile);
  } catch {
    return;
  }

  try {
    await mkdir(backupDir, { recursive: true });
    await copyFile(dataFile, join(backupDir, `multiprodtool-data-${backupStamp()}.json`));
  } catch (error) {
    console.warn('MultiProdTool backup creation failed:', error instanceof Error ? error.message : error);
  }
}

async function pruneBackups() {
  try {
    await mkdir(backupDir, { recursive: true });
    const files = (await readdir(backupDir))
      .filter((file) => /^multiprodtool-data-.*\.json$/.test(file))
      .sort()
      .reverse();
    const stale = files.slice(30);
    await Promise.all(stale.map((file) => unlink(join(backupDir, file)).catch((error) => {
      console.warn(`MultiProdTool backup cleanup failed for ${file}:`, error instanceof Error ? error.message : error);
    })));
  } catch (error) {
    console.warn('MultiProdTool backup cleanup failed:', error instanceof Error ? error.message : error);
  }
}

const authUsername = process.env.MULTIPROD_AUTH_USERNAME || '';
const authPassword = process.env.MULTIPROD_AUTH_PASSWORD || '';
const authEnabled = Boolean(authUsername && authPassword);

function isAuthorized(req) {
  if (!authEnabled) return true;
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return false;
  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);
  return user === authUsername && pass === authPassword;
}

function requestAuth(res) {
  res.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="MultiProdTool", charset="UTF-8"',
    'Content-Type': 'text/plain; charset=utf-8'
  });
  res.end('Authentication required');
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

async function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBodyBytes) {
      const error = new Error('Request body too large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function serveStatic(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const candidate = normalize(join(distDir, requested));
  const insideDist = !relative(distDir, candidate).startsWith('..') && !relative(distDir, candidate).startsWith('..');
  const file = insideDist ? candidate : join(distDir, 'index.html');
  let finalFile = file;
  try {
    const info = await stat(finalFile);
    if (info.isDirectory()) finalFile = join(finalFile, 'index.html');
  } catch {
    finalFile = join(distDir, 'index.html');
  }
  const type = types[extname(finalFile)] || 'application/octet-stream';
  const isHashedAsset = finalFile.includes('/assets/') || finalFile.includes('\\assets\\');
  const cacheControl = isHashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, { ...securityHeaders, 'Content-Type': type, 'Cache-Control': cacheControl });
  createReadStream(finalFile).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    if (!isAuthorized(req)) return requestAuth(res);
    if (req.url?.startsWith('/api/health')) return sendJson(res, 200, { ok: true });

    if (req.url?.startsWith('/api/data') && req.method === 'GET') {
      try {
        const raw = await readFile(dataFile, 'utf8');
        return sendJson(res, 200, { ok: true, data: JSON.parse(raw) });
      } catch {
        return sendJson(res, 200, { ok: true, data: null });
      }
    }

    if (req.url?.startsWith('/api/data') && req.method === 'PUT') {
      const raw = await readBody(req);
      const parsed = JSON.parse(raw);
      await mkdir(dataDir, { recursive: true });
      await createBackupIfDataExists();
      await writeFile(`${dataFile}.tmp`, JSON.stringify(parsed, null, 2), 'utf8');
      await rename(`${dataFile}.tmp`, dataFile);
      pruneBackups();
      return sendJson(res, 200, { ok: true });
    }

    if (req.url?.startsWith('/api/')) return sendJson(res, 404, { ok: false, error: 'Not found' });
    return serveStatic(req, res);
  } catch (error) {
    const status = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : 500;
    return sendJson(res, status, { ok: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

server.listen(port, host, () => {
  console.log(`MultiProdTool web server listening on http://${host}:${port}`);
  console.log(`Data file: ${dataFile}`);
  console.log(`Backup directory: ${backupDir}`);
  console.log(`Authentication: ${authEnabled ? 'enabled' : 'disabled'}`);
});
