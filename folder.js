/* SYNTH LAB — optional link to a folder on disk
 *
 * With the File System Access API the page can be given a folder once and
 * then read and write files in it on its own, so saving a project can write
 * a real .song.json next to the app instead of only keeping it in
 * localStorage. The handle is kept in IndexedDB so the link survives a
 * reload; a browser restart needs one click to hand it back.
 *
 * Chromium, Edge and Opera support this. Firefox does not — there the app
 * falls back to localStorage and the JSON download button.
 */
(function (global) {
  'use strict';

  const DB = 'synthlab';
  const STORE = 'handles';
  const KEY = 'songs';
  const OPTS = { id: 'synthlab-songs', mode: 'readwrite' };

  let dir = null;

  const supported = function () { return typeof global.showDirectoryPicker === 'function'; };
  const connected = function () { return !!dir; };
  const folderName = function () { return dir ? dir.name : ''; };

  /* ------------------------------------------------------------ indexeddb */
  function openDb() {
    return new Promise(function (res, rej) {
      const req = global.indexedDB.open(DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE); };
      req.onerror = function () { rej(req.error); };
      req.onsuccess = function () { res(req.result); };
    });
  }

  function idb(mode, run) {
    return openDb().then(function (db) {
      return new Promise(function (res, rej) {
        const tx = db.transaction(STORE, mode);
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

  /* On startup: only takes effect if the browser still holds the grant. */
  function restore() {
    if (!supported() || dir) return Promise.resolve(false);
    return idb('readonly', function (s) { return s.get(KEY); }).then(function (handle) {
      if (!handle) return false;
      return handle.queryPermission(OPTS).then(function (q) {
        if (q !== 'granted') return false;
        dir = handle;
        return true;
      });
    }).catch(function () { return false; });
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
    if (!dir) return [];
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

  async function read(file) {
    if (!dir) throw new Error('no folder');
    const fh = await dir.getFileHandle(file);
    const f = await fh.getFile();
    return JSON.parse(await f.text());
  }

  async function write(song) {
    if (!dir) throw new Error('no folder');
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

  async function remove(file) {
    if (!dir) throw new Error('no folder');
    await dir.removeEntry(file);
  }

  global.SynthLab.Folder = {
    supported: supported,
    connected: connected,
    folderName: folderName,
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
