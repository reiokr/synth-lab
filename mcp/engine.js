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
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.resolve(rootDir, rel || 'index.html');
      if (!file.startsWith(path.resolve(rootDir))) {
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
    const nch = buf.numberOfChannels;
    const len = buf.length;
    const sr = buf.sampleRate;
    const dataBytes = len * nch * 2;
    const ab = new ArrayBuffer(44 + dataBytes);
    const v = new DataView(ab);
    const tag = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };

    tag(0, 'RIFF');
    v.setUint32(4, 36 + dataBytes, true);
    tag(8, 'WAVE');
    tag(12, 'fmt ');
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, nch, true);
    v.setUint32(24, sr, true);
    v.setUint32(28, sr * nch * 2, true);
    v.setUint16(32, nch * 2, true);
    v.setUint16(34, 16, true);
    tag(36, 'data');
    v.setUint32(40, dataBytes, true);

    const chans = [];
    for (let c = 0; c < nch; c++) chans.push(buf.getChannelData(c));
    let off = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < nch; c++) {
        let x = chans[c][i];
        if (x > 1) x = 1; else if (x < -1) x = -1;
        v.setInt16(off, x < 0 ? x * 0x8000 : x * 0x7fff, true);
        off += 2;
      }
    }

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
