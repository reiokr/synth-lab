#!/usr/bin/env node
/* SYNTH LAB — local server
 *
 * Serves the app as static files AND gives the page a small REST API for the
 * json/ workspace, so saving a project writes a real .song.json on disk with
 * no folder picking or permissions. The page probes /api/songs on startup and
 * uses this server as its default save target.
 *
 *   node serve.js            (port 8000)
 *   SYNTHLAB_PORT=8010 node serve.js
 *   SYNTHLAB_SONGS=/other/json node serve.js
 *
 * Zero dependencies — plain node:http.
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.SYNTHLAB_PORT) || 8000;
const SONGS_DIR = process.env.SYNTHLAB_SONGS
  ? path.resolve(process.env.SYNTHLAB_SONGS)
  : path.join(ROOT, 'json');
fs.mkdirSync(SONGS_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.mid': 'audio/midi',
  '.wav': 'audio/wav',
  '.md': 'text/markdown; charset=utf-8'
};

/* --------------------------------------------------------------- song files */
function songPath(name) {
  const safe = String(name).replace(/[^A-Za-z0-9._-]+/g, '_');
  return path.join(SONGS_DIR, safe.endsWith('.song.json') ? safe : safe + '.song.json');
}

function listSongs() {
  return fs.readdirSync(SONGS_DIR)
    .filter((f) => f.endsWith('.song.json'))
    .map((f) => {
      let size = 0;
      let updated = 0;
      try {
        const st = fs.statSync(path.join(SONGS_DIR, f));
        size = st.size;
        updated = st.mtimeMs;
      } catch (e) { /* raced with a delete */ }
      return {
        file: f,
        name: f.replace(/\.song\.json$/i, '').replace(/_+/g, ' ').trim() || f,
        size,
        updated
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ------------------------------------------------------------------ helpers */
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, code, obj) {
  cors(res);
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((res, rej) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        rej(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => res(Buffer.concat(chunks).toString('utf8')));
    req.on('error', rej);
  });
}

/* ------------------------------------------------------------ the api part */
async function api(req, res, route) {
  if (route === '/songs' && req.method === 'GET') {
    return sendJson(res, 200, { dir: path.basename(SONGS_DIR), songs: listSongs() });
  }

  const m = route.match(/^\/songs\/(.+)$/);
  if (!m) return sendJson(res, 404, { error: 'unknown api route' });
  const p = songPath(m[1]); /* route arrives already URL-decoded */

  if (req.method === 'GET') {
    if (!fs.existsSync(p)) return sendJson(res, 404, { error: 'song not found: ' + path.basename(p) });
    cors(res);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(fs.readFileSync(p, 'utf8'));
  }

  if (req.method === 'PUT') {
    let data;
    try { data = JSON.parse(await readBody(req, 8 * 1024 * 1024)); } catch (e) {
      return sendJson(res, 400, { error: 'bad JSON body' });
    }
    if (!data || typeof data !== 'object') return sendJson(res, 400, { error: 'not a song object' });
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
    return sendJson(res, 200, { saved: path.basename(p) });
  }

  if (req.method === 'DELETE') {
    if (!fs.existsSync(p)) return sendJson(res, 404, { error: 'song not found: ' + path.basename(p) });
    fs.unlinkSync(p);
    return sendJson(res, 200, { deleted: path.basename(p) });
  }

  return sendJson(res, 405, { error: 'method not allowed' });
}

/* --------------------------------------------------------- the static part */
function staticFile(res, route) {
  let rel = route === '/' ? '/index.html' : route;
  const abs = path.normalize(path.join(ROOT, rel));
  if (!abs.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(abs, (e, buf) => {
    if (e) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream' });
    res.end(buf);
  });
}

/* ----------------------------------------------------------------- server */
const server = http.createServer((req, res) => {
  let route;
  try {
    route = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch (e) {
    res.writeHead(400);
    return res.end('bad request');
  }
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }
  if (route === '/api' || route.startsWith('/api/')) {
    api(req, res, route.slice(4) || '/').catch((e) => sendJson(res, 500, { error: e.message }));
    return;
  }
  staticFile(res, route);
});

server.listen(PORT, () => {
  console.log('SYNTH LAB — http://localhost:' + PORT);
  console.log('  songs are saved to ' + SONGS_DIR + ' as .song.json files');
});
