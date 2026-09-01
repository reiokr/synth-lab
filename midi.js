/* SYNTH LAB — standard MIDI file (SMF) export
 *
 * Format 1, 480 ticks per quarter note (a 16th step = 120 ticks).
 * Track 0 is the conductor track (tempo, time signature, song name),
 * each project track becomes its own MIDI track on its own channel.
 */
(function (global) {
  'use strict';

  const TPQ = 480;
  const TICKS_PER_STEP = TPQ / 4;

  /* variable-length quantity for delta times */
  function vlq(value) {
    let buffer = value & 0x7f;
    const out = [];
    value >>= 7;
    while (value > 0) {
      buffer <<= 8;
      buffer |= 0x80;
      buffer += (value & 0x7f);
      value >>= 7;
    }
    for (;;) {
      out.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8; else break;
    }
    return out;
  }

  function ascii(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[^\x20-\x7e]/g, '');
  }

  function meta(type, bytes) {
    return [0xff, type].concat(vlq(bytes.length), bytes);
  }

  function chunk(id, data) {
    const len = data.length;
    return [id.charCodeAt(0), id.charCodeAt(1), id.charCodeAt(2), id.charCodeAt(3),
      (len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff].concat(data);
  }

  function encodeTrack(events) {
    events.sort(function (a, b) {
      return (a.tick - b.tick) || (a.order - b.order);
    });
    const out = [];
    let prev = 0;
    events.forEach(function (e) {
      out.push.apply(out, vlq(Math.max(0, e.tick - prev)));
      out.push.apply(out, e.data);
      prev = e.tick;
    });
    return out;
  }

  function nameMeta(text) {
    const bytes = [];
    const s = ascii(text).slice(0, 100);
    for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i) & 0x7f);
    return meta(0x03, bytes);
  }

  function songToMidi(song) {
    const steps = global.SynthLab.totalSteps(song);
    const spb = song.stepsPerBar || 16;
    const beatsPerBar = Math.max(1, Math.round(spb / 4));
    const loopTicks = steps * TICKS_PER_STEP;
    /* mirror the scheduler: every second 16th is pushed late */
    const swingTicks = Math.round((song.swing || 0) * TICKS_PER_STEP * 0.5);
    const tempo = Math.max(1, Math.round(60000000 / (song.bpm || 120)));
    let denom = 2;
    let n = beatsPerBar;
    while (n > 1) { n /= 2; denom += 1; }

    const tracks = [];

    /* ---- conductor track ------------------------------------------- */
    tracks.push(encodeTrack([
      { tick: 0, order: 0, data: meta(0x51, [(tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff]) },
      { tick: 0, order: 1, data: meta(0x58, [beatsPerBar, denom, 24, 8]) },
      { tick: 0, order: 2, data: nameMeta(song.name || 'SYNTH LAB') },
      { tick: loopTicks, order: 9, data: meta(0x2f, []) }
    ]));

    /* ---- one MIDI track per project track -------------------------- */
    song.tracks.forEach(function (t, i) {
      const ch = (i < 9 ? i : i + 1) % 16;
      const events = [{ tick: 0, order: 0, data: nameMeta((i + 1) + '. ' + (t.name || 'Track')) }];

      t.notes.forEach(function (note) {
        const step = Math.max(0, Math.min(steps - 1, Math.round(note.step)));
        const lenSteps = Math.max(1, Math.round(note.len === undefined ? 1 : note.len));
        const off = function (s) { return s * TICKS_PER_STEP + (s % 2 === 1 ? swingTicks : 0); };
        let start = off(step);
        let end = off(step + lenSteps);
        /* keep the file exactly one loop long */
        if (end > loopTicks) end = loopTicks;
        if (end <= start) end = Math.min(loopTicks, start + 1);
        const vel = Math.max(1, Math.min(127, Math.round((note.vel === undefined ? 0.9 : note.vel) * 127)));
        const pitch = Math.max(0, Math.min(127, Math.round(note.pitch)));
        events.push({ tick: start, order: 1, data: [0x90 | ch, pitch, vel] });
        events.push({ tick: end, order: 0, data: [0x80 | ch, pitch, 0x40] });
      });

      events.push({ tick: loopTicks, order: 9, data: meta(0x2f, []) });
      tracks.push(encodeTrack(events));
    });

    /* ---- assemble -------------------------------------------------- */
    const count = tracks.length;
    const out = chunk('MThd', [0x00, 0x01, (count >> 8) & 0xff, count & 0xff, (TPQ >> 8) & 0xff, TPQ & 0xff]);
    tracks.forEach(function (data) {
      out.push.apply(out, chunk('MTrk', data));
    });
    return new Uint8Array(out);
  }

  global.SynthLab.songToMidi = songToMidi;
  global.SynthLab.MIDI_TPQ = TPQ;
})(window);
