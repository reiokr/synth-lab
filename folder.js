/* SYNTH LAB — saving projects as real .song.json files
 *
 * Two ways for the page to reach the disk, behind one facade:
 *
 * 1. Local server ("node serve.js"). The page probes /api/songs at startup;
 *    when it answers, saving PUTs the song straight into the project's json/
 *    folder. No folder picking, no permissions, works in every browser.
 * 2. File System Access API. The Folder button can link any folder once; the
 *    handle lives in IndexedDB so the link survives a reload (a browser
 *    restart may need one click to hand it back).
 *
 * An explicitly linked folder wins over the server; otherwise the server is
 * used when it is reachable; otherwise saving stays in localStorage.
 */
(function (global) {
  'use strict';

  const DB = 'synthlab';
  const STORE = 'handles';
  const KEY = 'songs';
  const OPTS = { id: 'synthlab-songs', mode: 'readwrite' };

  /* where the server bridge looks, in order: same origin (node serve.js),
     then the well-known local port (page opened as a file or via another
     static server) */
  const HTTP_BASES = ['api', 'http://127.0.0.1:8000/api', 'http://localhost:8000/api'];

  let dir = null;      /* File System Access handle, when linked */
  let http = null;     /* { base } when the server answered the probe */

  const supported = function () { return typeof global.showDirectoryPicker === 'function'; };

  /* Which backend is active right now: 'fs', 'http' or null. */
  const mode = function () { return dir ? 'fs' : (http ? 'http' : null); };
  const connected = function () { return !!(dir || http); };
  const folderName = function () {
    return dir ? dir.name : (http ? 'json (server)' : '');
  };

  /* ------------------------------------------------------------ indexeddb */
  function openDb() {
    return new Promise(function (res, rej) {
      const req = global.indexedDB.open(DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onerror = function () { rej(req.error); };
      req.onsuccess = function () { res(req.result); };
    });
  }

  function idb(modeArg, run) {
    return openDb().then(function (db) {
      return new Promise(function (res, rej) {
        const tx = db.transaction(STORE, modeArg);
        const req = run(tx.objectStore(STORE));
        tx.onerror = function () { rej(tx.error); };
        tx.oncomplete = function () { res(req ? req.result : undefined); };
      });
    });
  }

  /* ------------------------------------------------------------- the link */
  function connect() {
    if (!supported()) return Promise.reject(new Error('unsupported'));
    return global.showDirectoryPicker(OPTS).then(function (handle) {
      return handle.queryPermission(OPTS).then(function (q) {
        if (q === 'granted') return handle;
        return handle.requestPermission(OPTS).then(function (r) {
          if (r !== 'granted') throw new Error('denied');
          return handle;
        });
      });
    }).then(function (handle) {
      dir = handle;
      return idb('readwrite', function (s) { return s.put(handle, KEY); })
        .catch(function () { /* not storable — this session only */ })
        .then(function () { return handle.name; });
    });
  }

  /* On startup: take back an existing folder grant and probe the server.
     Resolves with the active backend name ('fs', 'http' or null). */
  function restore() {
    const fsPart = (function () {
      if (!supported() || dir) return Promise.resolve(false);
      return idb('readonly', function (s) { return s.get(KEY); }).then(function (handle) {
        if (!handle) return false;
        return handle.queryPermission(OPTS).then(function (q) {
          if (q !== 'granted') return false;
          dir = handle;
          return true;
        });
      }).catch(function () { return false; });
    })();

    const httpPart = probeHttp();
    return Promise.all([fsPart, httpPart]).then(function (r) {
      return dir ? 'fs' : (http ? 'http' : null);
    });
  }

  function probeHttp() {
    if (http) return Promise.resolve(true);
    let i = 0;
    function next() {
      if (i >= HTTP_BASES.length) return Promise.resolve(false);
      const base = HTTP_BASES[i++];
      return fetch(base + '/songs', { headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          return r.json();
        })
        .then(function (j) {
          if (!j || !Array.isArray(j.songs)) throw new Error('not the synth-lab server');
          http = { base: base };
          return true;
        })
        .catch(function () { return next(); });
    }
    return next();
  }

  function disconnect() {
    dir = null;
    return idb('readwrite', function (s) { return s.delete(KEY); })
      .catch(function () { /* nothing stored */ });
  }

  /* --------------------------------------------------------------- files */
  const fileName = function (song) {
    return (song && song.name ? song.name : 'song').replace(/[^\w\-]+/g, '_') + '.song.json';
  };

  const nameFromFile = function (file) {
    return String(file).replace(/\.song\.json$/i, '').replace(/_+/g, ' ').trim() || file;
  };

  async function list() {
    if (dir) {
      const out = [];
      for await (const entry of dir.entries()) {
        const file = entry[0];
        const handle = entry[1];
        if (!handle || handle.kind !== 'file') continue;
        if (!/\.song\.json$/i.test(file)) continue;
        try {
          const f = await handle.getFile();
          out.push({ file: file, name: nameFromFile(file), size: f.size, updated: f.lastModified });
        } catch (e) { /* the file went away */ }
      }
      return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }
    if (http) {
      const r = await fetch(http.base + '/songs');
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      return (j.songs || []).slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    }
    return [];
  }

  async function read(file) {
    if (dir) {
      const fh = await dir.getFileHandle(file);
      const f = await fh.getFile();
      return JSON.parse(await f.text());
    }
    if (http) {
      const r = await fetch(http.base + '/songs/' + encodeURIComponent(file));
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }
    throw new Error('no folder');
  }

  async function write(song) {
    if (dir) {
      const file = fileName(song);
      const fh = await dir.getFileHandle(file, { create: true });
      const w = await fh.createWritable();
      try {
        await w.write(JSON.stringify(song, null, 2));
      } finally {
        await w.close();
      }
      return file;
    }
    if (http) {
      const r = await fetch(http.base + '/songs/' + encodeURIComponent(song && song.name ? song.name : 'song'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(song, null, 2)
      });
      if (!r.ok) throw new Error('http ' + r.status);
      const j = await r.json();
      return j.saved || fileName(song);
    }
    throw new Error('no folder');
  }

  async function remove(file) {
    if (dir) {
      await dir.removeEntry(file);
      return;
    }
    if (http) {
      const r = await fetch(http.base + '/songs/' + encodeURIComponent(file), { method: 'DELETE' });
      if (!r.ok) throw new Error('http ' + r.status);
      return;
    }
    throw new Error('no folder');
  }

  global.SynthLab.Folder = {
    supported: supported,
    connected: connected,
    folderName: folderName,
    mode: mode,
    connect: connect,
    restore: restore,
    disconnect: disconnect,
    list: list,
    read: read,
    write: write,
    remove: remove,
    fileName: fileName,
    nameFromFile: nameFromFile
  };
})(window);
