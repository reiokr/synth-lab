/* Headless Chromium wrapper — the only part that needs a browser.
 * Used for offline WAV rendering, because the Web Audio engine only
 * exists inside the page. Everything else runs in plain Node by
 * requiring the app's own modules. */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

let server = null;
let browser = null;
let page = null;
let booting = null;

function startStatic(rootDir) {
  const rootResolved = path.resolve(rootDir);
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.resolve(rootResolved, rel || 'index.html');
      /* a prefix check alone would also admit a sibling dir like
         <root>-extra; require the file to sit inside rootDir proper */
      if (file !== rootResolved && !file.startsWith(rootResolved + path.sep)) {
        res.writeHead(403).end('forbidden');
        return;
      }
      fs.readFile(file, (err, buf) => {
        if (err) {
          res.writeHead(404).end('not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(buf);
      });
    });
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function ensure(projectDir) {
  if (page) return page;
  if (booting) return booting;

  booting = (async () => {
    server = await startStatic(projectDir);
    const port = server.address().port;

    let chromium;
    try {
      ({ chromium } = require('playwright-core'));
    } catch (e) {
      throw new Error('playwright-core not installed — run "npm install" in the mcp directory');
    }

    const executablePath = process.env.SYNTHLAB_CHROMIUM || '/usr/bin/chromium';
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--mute-audio',
        '--autoplay-policy=no-user-gesture-required'
      ]
    });
    page = await browser.newPage();
    page.setDefaultTimeout(180000);
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => !!window.SYNTHLAB && !!window.SynthLab.songToMidi, null, { timeout: 30000 });
    return page;
  })();

  try {
    return await booting;
  } finally {
    booting = null;
  }
}

/* Render a song to a WAV byte buffer using the app's own engine.
 * The WAV container is built inside the page so only one payload
 * crosses the CDP bridge. */
async function renderWav(projectDir, song) {
  const p = await ensure(projectDir);
  const b64 = await p.evaluate(async (s) => {
    const buf = await window.SYNTHLAB.composer.renderOffline(s);
    /* reuse the app's own WAV writer so there is a single encoder */
    const blob = window.SynthLab.encodeWav(buf);
    const ab = await blob.arrayBuffer();
    const u8 = new Uint8Array(ab);
    let bin = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < u8.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }, song);

  return Buffer.from(b64, 'base64');
}

async function close() {
  try { if (browser) await browser.close(); } catch (e) { /* ignore */ }
  try { if (server) server.close(); } catch (e) { /* ignore */ }
  browser = null;
  page = null;
  server = null;
}

module.exports = { ensure, renderWav, close };
