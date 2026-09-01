#!/usr/bin/env node
/* SYNTH LAB — MCP server
 *
 * Songs live on disk as .song.json files (the app's own format). Editing,
 * arpeggio generation, scale snapping and MIDI export run in plain Node by
 * requiring the app's modules, so there is no duplicated logic. Only WAV
 * rendering boots headless Chromium, because the Web Audio engine lives
 * inside the page.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

const engine = require('./engine');

/* ------------------------------------------------------------ app modules */
const PROJECT_DIR = process.env.SYNTHLAB_DIR || path.resolve(__dirname, '..');
global.window = global;
require(path.join(PROJECT_DIR, 'synth.js'));
require(path.join(PROJECT_DIR, 'presets.js'));
require(path.join(PROJECT_DIR, 'transport.js'));
require(path.join(PROJECT_DIR, 'examples.js'));
require(path.join(PROJECT_DIR, 'midi.js'));
const SL = global.SynthLab;

/* Where things land. Override with SYNTHLAB_SONGS / SYNTHLAB_MIDI_DIR /
   SYNTHLAB_WAV_DIR; by default the project's json/, midi/, wav/ folders. */
const SONGS_DIR = process.env.SYNTHLAB_SONGS
  ? path.resolve(process.env.SYNTHLAB_SONGS)
  : path.join(PROJECT_DIR, 'json');
const MIDI_DIR = process.env.SYNTHLAB_MIDI_DIR
  ? path.resolve(process.env.SYNTHLAB_MIDI_DIR)
  : path.join(PROJECT_DIR, 'midi');
const WAV_DIR = process.env.SYNTHLAB_WAV_DIR
  ? path.resolve(process.env.SYNTHLAB_WAV_DIR)
  : path.join(PROJECT_DIR, 'wav');
for (const d of [SONGS_DIR, MIDI_DIR, WAV_DIR]) fs.mkdirSync(d, { recursive: true });

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const log = (...a) => console.error('[synthlab]', ...a);

/* ------------------------------------------------------------- song files */
function songPath(name) {
  const safe = String(name).replace(/[^A-Za-z0-9._-]+/g, '_');
  return path.join(SONGS_DIR, safe.endsWith('.song.json') ? safe : safe + '.song.json');
}

function normalizeSong(raw) {
  const base = SL.newSong();
  const s = Object.assign(base, raw || {});
  s.name = (raw && raw.name) || base.name;
  s.bpm = clamp(Number(s.bpm) || 120, 40, 240);
  s.bars = [1, 2, 4, 8, 16, 32, 64].indexOf(Number(s.bars)) >= 0 ? Number(s.bars) : 2;
  s.swing = clamp(Number(s.swing) || 0, 0, 0.7);
  s.scaleRoot = clamp(Math.round(Number(s.scaleRoot) || 0), 0, 11);
  s.scaleType = SL.SCALES[s.scaleType] ? s.scaleType : 'chromatic';
  s.scaleSnap = !!s.scaleSnap;
  s.tracks = (Array.isArray(s.tracks) ? s.tracks : []).map((t, i) => {
    const out = Object.assign(SL.newTrack(t && t.name, t && t.patch), t || {});
    out.name = (t && t.name) || 'Track ' + (i + 1);
    out.patch = SL.mergePatch(SL.defaultPatch(), (t && t.patch) || {});
    out.notes = (Array.isArray(t && t.notes) ? t.notes : []).map((n) => ({
      step: Math.max(0, Math.round(Number(n.step) || 0)),
      len: Math.max(1, Math.round(Number(n.len) || 1)),
      pitch: clamp(Math.round(Number(n.pitch) || 60), 0, 127),
      vel: clamp(n.vel === undefined ? 0.9 : Number(n.vel), 0.05, 1)
    }));
    out.arp = Object.assign({}, SL.defaultPatch().arp, (t && t.arp) || {});
    return out;
  });
  return s;
}

function readSong(name) {
  const p = songPath(name);
  if (!fs.existsSync(p)) throw new Error('song not found: ' + name + ' (looked in ' + SONGS_DIR + ')');
  return normalizeSong(JSON.parse(fs.readFileSync(p, 'utf8')));
}

function writeSong(song) {
  const p = songPath(song.name);
  fs.writeFileSync(p, JSON.stringify(song, null, 2));
  return p;
}

function listNames() {
  return fs.readdirSync(SONGS_DIR)
    .filter((f) => f.endsWith('.song.json'))
    .map((f) => f.replace(/\.song\.json$/, ''))
    .sort();
}

function resolveTrack(song, which) {
  if (which === undefined || which === null) return null;
  if (typeof which === 'number') return song.tracks[which];
  const s = String(which);
  return song.tracks.find((t) => t.name === s) || song.tracks[Number(s)];
}

function eachTrack(song, which) {
  if (which === undefined || which === null || which === 'all') return song.tracks;
  const t = resolveTrack(song, which);
  if (!t) throw new Error('no such track: ' + which + ' — tracks are ' +
    song.tracks.map((x, i) => i + '=' + x.name).join(', '));
  return [t];
}

function summary(s) {
  const notes = s.tracks.reduce((n, t) => n + t.notes.length, 0);
  return {
    name: s.name,
    bpm: s.bpm,
    bars: s.bars,
    swing: s.swing,
    scale: s.scaleType === 'chromatic' ? 'off' : ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][s.scaleRoot] + ' ' + s.scaleType + (s.scaleSnap ? ' (snap)' : ''),
    tracks: s.tracks.map((t, i) => ({
      index: i, name: t.name, patch: t.patch.name, notes: t.notes.length,
      arp: t.arp && t.arp.on ? t.arp.pattern + ' @' + t.arp.rate + ' x' + t.arp.octaves : 'off'
    })),
    totalNotes: notes
  };
}

/* --------------------------------------------------------------- analysis */
function analyse(s) {
  const steps = SL.totalSteps(s);
  const all = s.tracks.flatMap ? s.tracks.flatMap((t) => t.notes) : [].concat.apply([], s.tracks.map((t) => t.notes));
  const pitches = all.map((n) => n.pitch);
  const range = pitches.length ? [Math.min.apply(null, pitches), Math.max.apply(null, pitches)] : null;

  /* simplest possible key hint: which rotation of the chromatic
     explains the most notes, major vs natural minor */
  let best = null;
  for (let root = 0; root < 12; root++) {
    for (const type of ['major', 'minor', 'majPent', 'minPent']) {
      let hit = 0;
      pitches.forEach((p) => { if (SL.inScale(p, root, type)) hit++; });
      const score = pitches.length ? hit / pitches.length : 0;
      if (!best || score > best.score) best = { root, type, score };
    }
  }

  const onsets = {};
  all.forEach((n) => { onsets[n.step] = (onsets[n.step] || 0) + 1; });

  return {
    name: s.name,
    bpm: s.bpm,
    bars: s.bars,
    loopSeconds: +(steps * (60 / s.bpm / 4)).toFixed(2),
    totalNotes: all.length,
    notesPerBar: +(all.length / s.bars).toFixed(1),
    pitchRange: range,
    rangeMidiToNote: range ? range.map((p) => ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][p % 12] + (Math.floor(p / 12) - 1)) : null,
    density: +(all.length / steps).toFixed(2),
    busiestStep: Object.keys(onsets).sort((a, b) => onsets[b] - onsets[a])[0],
    keyGuess: best ? ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][best.root] + ' ' + best.type +
      ' (' + Math.round(best.score * 100) + '% of notes fit)' : null,
    tracks: s.tracks.map((t, i) => ({
      index: i,
      name: t.name,
      patch: t.patch.name,
      notes: t.notes.length,
      lowest: t.notes.length ? Math.min.apply(null, t.notes.map((n) => n.pitch)) : null,
      highest: t.notes.length ? Math.max.apply(null, t.notes.map((n) => n.pitch)) : null
    }))
  };
}

/* ------------------------------------------------------------------ tools */
const TOOLS = [
  ['list_songs', 'List the songs in the workspace with a short summary of each.', { type: 'object', properties: {}, additionalProperties: false }],
  ['read_song', 'Read a song as full JSON (the app\'s .song.json format).', {
    type: 'object', properties: { song: { type: 'string', description: 'Song name (file base name)' } }, required: ['song'], additionalProperties: false
  }],
  ['write_song', 'Write a song JSON into the workspace, replacing any existing song of that name.', {
    type: 'object', properties: {
      song: { type: 'string', description: 'Name to store it under' },
      data: { type: 'object', description: 'Full song object' }
    }, required: ['song', 'data'], additionalProperties: false
  }],
  ['new_song', 'Create a new empty song and store it in the project json/ folder.', {
    type: 'object', properties: {
      song: { type: 'string', description: 'Name for the new song' },
      bpm: { type: 'number' },
      bars: { type: 'number', enum: [1, 2, 4, 8, 16, 32, 64], description: 'Loop length. One bar is 16 steps; 64 bars is roughly two minutes at 120 bpm.' },
      swing: { type: 'number' },
      scaleRoot: { type: 'number', description: '0=C .. 11=B' },
      scaleType: { type: 'string' },
      scaleSnap: { type: 'boolean' }
    }, required: ['song'], additionalProperties: false
  }],
  ['delete_song', 'Delete a song from the workspace.', {
    type: 'object', properties: { song: { type: 'string' } }, required: ['song'], additionalProperties: false
  }],
  ['song_info', 'Statistics about a song: note counts, pitch range, density and a key guess.', {
    type: 'object', properties: { song: { type: 'string' } }, required: ['song'], additionalProperties: false
  }],
  ['list_patches', 'List the factory instrument patches (name + category).', {
    type: 'object', properties: { category: { type: 'string' } }, additionalProperties: false
  }],
  ['get_patch', 'Show every parameter of a factory patch.', {
    type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false
  }],
  ['list_demos', 'List the built-in demo songs you can start from.', { type: 'object', properties: {}, additionalProperties: false }],
  ['use_demo', 'Copy a built-in demo into the workspace so you can edit it.', {
    type: 'object', properties: { demo: { type: 'string' }, song: { type: 'string', description: 'Optional new name' } }, required: ['demo'], additionalProperties: false
  }],
  ['add_track', 'Add a track to a song.', {
    type: 'object', properties: {
      song: { type: 'string' }, name: { type: 'string' }, patch: { type: 'string', description: 'Factory patch name' }
    }, required: ['song', 'name'], additionalProperties: false
  }],
  ['remove_track', 'Remove a track (index or name) and its notes.', {
    type: 'object', properties: { song: { type: 'string' }, track: { type: ['string', 'number'] } }, required: ['song', 'track'], additionalProperties: false
  }],
  ['set_track_patch', 'Swap the instrument on a track without touching its notes.', {
    type: 'object', properties: {
      song: { type: 'string' }, track: { type: ['string', 'number'] }, patch: { type: 'string' }
    }, required: ['song', 'track', 'patch'], additionalProperties: false
  }],
  ['get_notes', 'Read the notes of one track.', {
    type: 'object', properties: { song: { type: 'string' }, track: { type: ['string', 'number'] } }, required: ['song', 'track'], additionalProperties: false
  }],
  ['set_notes', 'Replace all notes on a track. Each note is {step, len, pitch, vel} in 16th steps.', {
    type: 'object', properties: {
      song: { type: 'string' },
      track: { type: ['string', 'number'] },
      notes: { type: 'array', items: { type: 'object' } }
    }, required: ['song', 'track', 'notes'], additionalProperties: false
  }],
  ['add_notes', 'Append notes to a track.', {
    type: 'object', properties: {
      song: { type: 'string' },
      track: { type: ['string', 'number'] },
      notes: { type: 'array', items: { type: 'object' } }
    }, required: ['song', 'track', 'notes'], additionalProperties: false
  }],
  ['clear_track', 'Remove every note on a track.', {
    type: 'object', properties: { song: { type: 'string' }, track: { type: ['string', 'number'] } }, required: ['song', 'track'], additionalProperties: false
  }],
  ['transpose', 'Transpose notes by semitones. Omit track to transpose everything.', {
    type: 'object', properties: {
      song: { type: 'string' }, track: { type: ['string', 'number'] }, semitones: { type: 'number' }
    }, required: ['song', 'semitones'], additionalProperties: false
  }],
  ['quantize', 'Snap note starts to a grid (default 1 step = 16th).', {
    type: 'object', properties: {
      song: { type: 'string' }, track: { type: ['string', 'number'] }, grid: { type: 'number' }
    }, required: ['song'], additionalProperties: false
  }],
  ['humanize', 'Randomly nudge note starts for a less rigid feel.', {
    type: 'object', properties: {
      song: { type: 'string' }, track: { type: ['string', 'number'] },
      amount: { type: 'number', description: 'Steps of jitter, e.g. 0.3' },
      seed: { type: 'number' }
    }, required: ['song'], additionalProperties: false
  }],
  ['scale_snap', 'Pull notes into the chosen scale using the app\'s own snapping.', {
    type: 'object', properties: {
      song: { type: 'string' }, track: { type: ['string', 'number'] },
      root: { type: 'number' }, scale: { type: 'string' }
    }, required: ['song'], additionalProperties: false
  }],
  ['generate_arp', 'Fill a track with an arpeggio using the app\'s own arpeggiator, written out as real notes.', {
    type: 'object', properties: {
      song: { type: 'string' },
      track: { type: ['string', 'number'] },
      chord: { type: 'array', items: { type: 'number' }, description: 'MIDI pitches of the chord, e.g. [60,64,67]' },
      startStep: { type: 'number' },
      steps: { type: 'number' },
      rate: { type: 'number', description: '1 = every 16th, 2 = every 8th, 4 = every beat' },
      pattern: { type: 'string', enum: ['up', 'down', 'updown', 'random', 'as'] },
      octaves: { type: 'number' },
      gate: { type: 'number' },
      vel: { type: 'number' }
    }, required: ['song', 'track', 'chord'], additionalProperties: false
  }],
  ['generate_chords', 'Write one chord per bar on a track.', {
    type: 'object', properties: {
      song: { type: 'string' },
      track: { type: ['string', 'number'] },
      chords: { type: 'array', items: { type: 'array', items: { type: 'number' } }, description: 'One pitch array per bar' },
      startBar: { type: 'number' },
      lenInBeats: { type: 'number' },
      vel: { type: 'number' }
    }, required: ['song', 'track', 'chords'], additionalProperties: false
  }],
  ['generate_drums', 'Write a drum pattern. Pattern is 16 characters per bar: x or X = hit, - = rest (X is accented).', {
    type: 'object', properties: {
      song: { type: 'string' },
      track: { type: ['string', 'number'] },
      pattern: { type: 'string', description: 'e.g. "X---X---X---X---"' },
      pitch: { type: 'number', description: '36 kick, 48 tom, 60 everything else' },
      bars: { type: 'number' },
      vel: { type: 'number' }
    }, required: ['song', 'track', 'pattern'], additionalProperties: false
  }],
  ['set_arpeggiator', 'Configure a track\'s arpeggiator instead of writing the notes out.', {
    type: 'object', properties: {
      song: { type: 'string' },
      track: { type: ['string', 'number'] },
      on: { type: 'boolean' },
      rate: { type: 'number' },
      pattern: { type: 'string', enum: ['up', 'down', 'updown', 'random', 'as'] },
      octaves: { type: 'number' },
      gate: { type: 'number' }
    }, required: ['song', 'track'], additionalProperties: false
  }],
  ['set_scale', 'Set the song key and scale.', {
    type: 'object', properties: {
      song: { type: 'string' }, root: { type: 'number' }, scale: { type: 'string' }, snap: { type: 'boolean' }
    }, required: ['song'], additionalProperties: false
  }],
  ['set_tempo', 'Set bpm and swing.', {
    type: 'object', properties: { song: { type: 'string' }, bpm: { type: 'number' }, swing: { type: 'number' } },
    required: ['song'], additionalProperties: false
  }],
  ['export_midi', 'Write a standard .mid file using the app\'s own MIDI writer.', {
    type: 'object', properties: { song: { type: 'string' }, out: { type: 'string', description: 'Optional output path' } },
    required: ['song'], additionalProperties: false
  }],
  ['render_wav', 'Render a song to .wav through the real Web Audio engine in headless Chromium (one loop, effect tails included).', {
    type: 'object', properties: { song: { type: 'string' }, out: { type: 'string', description: 'Optional output path' } },
    required: ['song'], additionalProperties: false
  }],
  ['import_song', 'Copy a .song.json file from disk into the workspace.', {
    type: 'object', properties: { path: { type: 'string' }, song: { type: 'string', description: 'Optional name to store it under' } }, required: ['path'], additionalProperties: false
  }],
  ['export_song', 'Copy a song out of the workspace to a path you choose.', {
    type: 'object', properties: { song: { type: 'string' }, out: { type: 'string' } }, required: ['song', 'out'], additionalProperties: false
  }]
];

/* --------------------------------------------------------------- handlers */
function ok(text) {
  return { content: [{ type: 'text', text: typeof text === 'string' ? text : JSON.stringify(text, null, 2) }] };
}
function fail(e) {
  return { isError: true, content: [{ type: 'text', text: 'Error: ' + (e && e.message ? e.message : String(e)) }] };
}

/* Apply a change to a song on disk and report the result. */
function edit(name, fn) {
  const s = readSong(name);
  const result = fn(s);
  writeSong(s);
  return ok(result === undefined ? { saved: songPath(s.name), song: summary(s) } : result);
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function noteList(arr) {
  return (arr || []).map((n) => ({
    step: Math.max(0, Math.round(Number(n.step) || 0)),
    len: Math.max(1, Math.round(Number(n.len) || 1)),
    pitch: clamp(Math.round(Number(n.pitch) || 60), 0, 127),
    vel: clamp(n.vel === undefined ? 0.9 : Number(n.vel), 0.05, 1)
  }));
}

const HANDLERS = {
  list_songs: async () => ok(listNames().map((n) => summary(readSong(n)))),

  read_song: async (a) => ok(readSong(a.song)),

  write_song: async (a) => {
    const s = normalizeSong(Object.assign({}, a.data, { name: a.song }));
    return ok({ saved: writeSong(s) });
  },

  new_song: async (a) => {
    const s = normalizeSong({
      name: a.song,
      bpm: a.bpm || 120,
      bars: a.bars || 2,
      swing: a.swing || 0,
      scaleRoot: a.scaleRoot || 0,
      scaleType: a.scaleType || 'chromatic',
      scaleSnap: a.scaleSnap || false,
      tracks: []
    });
    return ok({ created: writeSong(s), song: summary(s) });
  },

  delete_song: async (a) => {
    const p = songPath(a.song);
    if (!fs.existsSync(p)) throw new Error('song not found: ' + a.song);
    fs.unlinkSync(p);
    return ok('deleted ' + a.song);
  },

  song_info: async (a) => ok(analyse(readSong(a.song))),

  list_patches: async (a) => ok(SL.FACTORY_PRESETS
    .filter((p) => !a.category || p.category === a.category)
    .map((p) => ({ name: p.name, category: p.category }))),

  get_patch: async (a) => {
    const p = SL.FACTORY_PRESETS.find((x) => x.name === a.name);
    if (!p) throw new Error('unknown patch: ' + a.name + ' — try list_patches');
    return ok(p);
  },

  list_demos: async () => ok(SL.EXAMPLE_SONGS.map((s) => summary(s))),

  use_demo: async (a) => {
    const d = SL.EXAMPLE_SONGS.find((s) => s.name === a.demo);
    if (!d) throw new Error('unknown demo: ' + a.demo + ' — try list_demos');
    const s = normalizeSong(Object.assign(SL.clone(d), { name: a.song || d.name }));
    return ok({ saved: writeSong(s), song: summary(s) });
  },

  add_track: async (a) => edit(a.song, (s) => {
    const patch = a.patch ? SL.patchByName(a.patch) : SL.defaultPatch();
    if (a.patch && patch.name !== a.patch) throw new Error('unknown patch: ' + a.patch);
    s.tracks.push(SL.newTrack(a.name, patch));
    return { addedTrack: s.tracks.length - 1 };
  }),

  remove_track: async (a) => edit(a.song, (s) => {
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    s.tracks.splice(s.tracks.indexOf(t), 1);
    return { removed: t.name };
  }),

  set_track_patch: async (a) => edit(a.song, (s) => {
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    t.patch = SL.patchByName(a.patch);
    if (t.patch.name !== a.patch) throw new Error('unknown patch: ' + a.patch);
    return { track: t.name, patch: t.patch.name };
  }),

  get_notes: async (a) => {
    const s = readSong(a.song);
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    return ok({ track: t.name, patch: t.patch.name, notes: t.notes });
  },

  set_notes: async (a) => edit(a.song, (s) => {
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    t.notes = noteList(a.notes);
    return { track: t.name, notes: t.notes.length };
  }),

  add_notes: async (a) => edit(a.song, (s) => {
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    t.notes = t.notes.concat(noteList(a.notes));
    return { track: t.name, notes: t.notes.length };
  }),

  clear_track: async (a) => edit(a.song, (s) => {
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    t.notes = [];
    return { cleared: t.name };
  }),

  transpose: async (a) => edit(a.song, (s) => {
    let n = 0;
    eachTrack(s, a.track).forEach((t) => t.notes.forEach((x) => {
      x.pitch = clamp(x.pitch + a.semitones, 0, 127);
      n++;
    }));
    return { transposed: a.semitones, notes: n };
  }),

  quantize: async (a) => edit(a.song, (s) => {
    const grid = Math.max(1, Math.round(a.grid || 1));
    let n = 0;
    eachTrack(s, a.track).forEach((t) => t.notes.forEach((x) => {
      x.step = Math.round(x.step / grid) * grid;
      n++;
    }));
    return { grid, notes: n };
  }),

  humanize: async (a) => edit(a.song, (s) => {
    const amt = a.amount === undefined ? 0.3 : a.amount;
    const rnd = mulberry(a.seed === undefined ? 12345 : a.seed);
    let n = 0;
    eachTrack(s, a.track).forEach((t) => t.notes.forEach((x) => {
      const jitter = Math.round((rnd() * 2 - 1) * amt);
      x.step = Math.max(0, x.step + jitter);
      n++;
    }));
    return { amount: amt, notes: n };
  }),

  scale_snap: async (a) => edit(a.song, (s) => {
    const root = a.root === undefined ? s.scaleRoot : a.root;
    const type = a.scale || s.scaleType;
    if (!SL.SCALES[type]) throw new Error('unknown scale: ' + type + ' — try ' + Object.keys(SL.SCALES).join(', '));
    let n = 0;
    eachTrack(s, a.track).forEach((t) => t.notes.forEach((x) => {
      x.pitch = SL.snapPitch(x.pitch, root, type);
      n++;
    }));
    return { snapped: ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][root] + ' ' + type, notes: n };
  }),

  generate_arp: async (a) => edit(a.song, (s) => {
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    const total = SL.totalSteps(s);
    const start = Math.max(0, Math.round(a.startStep || 0));
    const steps = Math.max(1, Math.round(a.steps || total - start));
    const rate = clamp(Math.round(a.rate || 2), 1, 16);
    const pattern = a.pattern || 'up';
    const octaves = clamp(Math.round(a.octaves || 1), 1, 4);
    const gate = clamp(Math.round(a.gate || 60), 10, 100);
    const vel = a.vel === undefined ? 0.85 : a.vel;

    /* temporary chord, then expand it with the app's own arpeggiator.
       arp.on has to be true while expanding, otherwise arpNoteFor returns
       nothing; the track's own arp setting is restored afterwards. */
    const prevArp = t.arp;
    t.arp = { on: true, rate, pattern, octaves, gate };
    t.notes = a.chord.map((p) => ({
      step: start, len: steps, pitch: clamp(Math.round(p), 0, 127), vel
    }));
    SL.indexTrack(s, t);

    const out = [];
    for (let step = start; step < start + steps; step++) {
      const n = SL.arpNoteFor(t, step);
      if (n) out.push({ step, len: n.len, pitch: n.pitch, vel: n.vel });
    }
    t.notes = out;
    t.arp = prevArp;
    return {
      track: t.name,
      notes: out.length,
      firstPitches: out.slice(0, 8).map((n) => n.pitch),
      settings: { rate, pattern, octaves, gate }
    };
  }),

  generate_chords: async (a) => edit(a.song, (s) => {
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    const spb = s.stepsPerBar || 16;
    const startBar = Math.max(0, Math.round(a.startBar || 0));
    const len = Math.max(1, Math.round((a.lenInBeats === undefined ? 4 : a.lenInBeats) * (spb / 4)));
    const vel = a.vel === undefined ? 0.7 : a.vel;
    t.notes = [];
    a.chords.forEach((chord, i) => {
      const barStep = (startBar + i) * spb;
      chord.forEach((p) => t.notes.push({
        step: barStep, len, pitch: clamp(Math.round(p), 0, 127), vel
      }));
    });
    return { track: t.name, bars: a.chords.length, notes: t.notes.length };
  }),

  generate_drums: async (a) => edit(a.song, (s) => {
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    const spb = s.stepsPerBar || 16;
    const bars = Math.max(1, Math.round(a.bars || s.bars));
    const pitch = clamp(Math.round(a.pitch === undefined ? 60 : a.pitch), 0, 127);
    const vel = a.vel === undefined ? 0.9 : a.vel;

    /* accept one string, or one string per bar */
    const pats = Array.isArray(a.pattern) ? a.pattern : [a.pattern];
    if (pats.some((p) => typeof p !== 'string')) throw new Error('pattern must be strings of 16 chars');

    t.notes = [];
    for (let b = 0; b < bars; b++) {
      const pat = pats[b % pats.length];
      for (let i = 0; i < Math.min(spb, pat.length); i++) {
        const c = pat[i];
        if (c === '-' || c === ' ' || c === '.') continue;
        const accented = c === 'X';
        t.notes.push({
          step: b * spb + i,
          len: 1,
          pitch,
          vel: clamp(accented ? Math.min(1, vel + 0.1) : vel, 0.05, 1)
        });
      }
    }
    return { track: t.name, hits: t.notes.length, bars, pitch };
  }),

  set_arpeggiator: async (a) => edit(a.song, (s) => {
    const t = resolveTrack(s, a.track);
    if (!t) throw new Error('no such track: ' + a.track);
    t.arp = {
      on: a.on === undefined ? true : !!a.on,
      rate: clamp(Math.round(a.rate === undefined ? t.arp.rate : a.rate), 1, 16),
      pattern: a.pattern || t.arp.pattern,
      octaves: clamp(Math.round(a.octaves === undefined ? t.arp.octaves : a.octaves), 1, 4),
      gate: clamp(Math.round(a.gate === undefined ? t.arp.gate : a.gate), 10, 100)
    };
    return { track: t.name, arp: t.arp };
  }),

  set_scale: async (a) => edit(a.song, (s) => {
    if (a.root !== undefined) s.scaleRoot = clamp(Math.round(a.root), 0, 11);
    if (a.scale !== undefined) {
      if (!SL.SCALES[a.scale]) throw new Error('unknown scale: ' + a.scale + ' — try ' + Object.keys(SL.SCALES).join(', '));
      s.scaleType = a.scale;
    }
    if (a.snap !== undefined) s.scaleSnap = !!a.snap;
    return {
      scale: s.scaleType === 'chromatic' ? 'off'
        : ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][s.scaleRoot] + ' ' + s.scaleType,
      snap: s.scaleSnap
    };
  }),

  set_tempo: async (a) => edit(a.song, (s) => {
    if (a.bpm !== undefined) s.bpm = clamp(Number(a.bpm), 40, 240);
    if (a.swing !== undefined) s.swing = clamp(Number(a.swing), 0, 0.7);
    return { bpm: s.bpm, swing: s.swing };
  }),

  export_midi: async (a) => {
    const s = readSong(a.song);
    const bytes = SL.songToMidi(s);
    const out = path.resolve(a.out || path.join(MIDI_DIR, s.name.replace(/[^A-Za-z0-9._-]+/g, '_') + '.mid'));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(bytes));
    return ok({ midi: out, bytes: bytes.length, tracks: s.tracks.length + 1 });
  },

  render_wav: async (a) => {
    const s = readSong(a.song);
    const out = path.resolve(a.out || path.join(WAV_DIR, s.name.replace(/[^A-Za-z0-9._-]+/g, '_') + '.wav'));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const buf = await engine.renderWav(PROJECT_DIR, s);
    fs.writeFileSync(out, buf);
    const seconds = +(buf.length / (44100 * 2 * 2)).toFixed(2);
    return ok({ wav: out, bytes: buf.length, approxSeconds: seconds, note: 'sample rate is the render rate (44.1 kHz); length is one loop plus the effect tail' });
  },

  import_song: async (a) => {
    const src = path.resolve(a.path);
    if (!fs.existsSync(src)) throw new Error('file not found: ' + src);
    const s = normalizeSong(Object.assign(JSON.parse(fs.readFileSync(src, 'utf8')), a.song ? { name: a.song } : {}));
    return ok({ imported: writeSong(s), song: summary(s) });
  },

  export_song: async (a) => {
    const s = readSong(a.song);
    const out = path.resolve(a.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(s, null, 2));
    return ok({ exported: out });
  }
};

/* ----------------------------------------------------------------- server */
async function main() {
  const server = new Server(
    { name: 'synthlab', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(
    (await import('@modelcontextprotocol/sdk/types.js')).ListToolsRequestSchema,
    async () => ({
      tools: TOOLS.map(([name, description, inputSchema]) => ({ name, description, inputSchema }))
    })
  );

  server.setRequestHandler(
    (await import('@modelcontextprotocol/sdk/types.js')).CallToolRequestSchema,
    async (req) => {
      const { name, arguments: args } = req.params;
      try {
        const h = HANDLERS[name];
        if (!h) throw new Error('unknown tool: ' + name);
        return await h(args || {});
      } catch (e) {
        log('tool failed:', name, e && e.message);
        return fail(e);
      }
    }
  );

  const shutdown = async () => {
    await engine.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('ready — project', PROJECT_DIR);
  log('  songs:', SONGS_DIR, '| midi:', MIDI_DIR, '| wav:', WAV_DIR);
}

main().catch((e) => {
  console.error('[synthlab] fatal:', e);
  process.exit(1);
});
