/* SYNTH LAB — demo songs (generated at load) */
(function (global) {
  'use strict';

  const SL = global.SynthLab;
  const SPB = 16;

  function N(step, pitch, len, vel) {
    return { step: step, len: len || 1, pitch: pitch, vel: vel === undefined ? 0.9 : vel };
  }

  function drumBar(pat, pitch, offset, len, vel) {
    const out = [];
    for (let i = 0; i < pat.length; i++) {
      const c = pat[i];
      if (c === '-' || c === ' ') continue;
      out.push(N(offset + i, pitch, len || 1, c === 'X' ? 0.95 : (vel === undefined ? 0.6 : vel)));
    }
    return out;
  }

  function drumPattern(pat, pitch, bars, len, vel) {
    let out = [];
    for (let b = 0; b < bars; b++) out = out.concat(drumBar(pat, pitch, b * SPB, len, vel));
    return out;
  }

  function arp(notes, count, stepInc, startStep, len, vel) {
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push(N(startStep + i * stepInc, notes[i % notes.length], len, vel));
    }
    return out;
  }

  function chord(notes, startStep, len, vel) {
    return notes.map(function (p) { return N(startStep, p, len, vel); });
  }

  function song(name, bpm, bars, tracks, masterVolume) {
    const s = SL.newSong();
    s.name = name;
    s.bpm = bpm;
    s.bars = bars;
    s.tracks = tracks;
    s.tracks.forEach(function (t, i) { t.show = i === 0; });
    if (masterVolume !== undefined) s.masterVolume = masterVolume;
    return s;
  }

  function trk(name, patchName, notes, vol, pan) {
    const t = SL.newTrack(name, SL.patchByName(patchName), notes);
    if (vol !== undefined) t.volume = vol;
    if (pan !== undefined) t.pan = pan;
    return t;
  }

  /* ------------------------------------------------------ 1. Neon Drive */
  function neonDrive() {
    const bars = 4;
    const bassRoots = [45, 41, 48, 43];
    const chords = [[57, 60, 64], [53, 57, 60], [52, 55, 60], [50, 55, 59]];
    let bass = [];
    let pad = [];
    let lead = [];

    for (let b = 0; b < bars; b++) {
      const root = bassRoots[b];
      const ch = chords[b];
      [0, 3, 6, 8, 11, 14].forEach(function (s, i) {
        bass.push(N(b * SPB + s, i === 4 ? root + 12 : root, s === 8 ? 3 : 2, i === 0 ? 1 : 0.8));
      });
      pad = pad.concat(chord(ch, b * SPB, 16, 0.65));
      const seq = [ch[0], ch[1], ch[2], ch[1] + 12, ch[0] + 12, ch[2], ch[1] + 12, ch[2] + 12];
      lead = lead.concat(arp(seq, 16, 1, b * SPB, 1, 0.75));
    }

    return song('Neon Drive', 118, bars, [
      trk('Pad', 'Glass Pad', pad, 0.62),
      trk('Arp', 'Chip Arp', lead, 0.5, -0.25),
      trk('Bass', 'Sub Growl', bass, 0.85),
      trk('Kick', 'Kit: Kick', drumPattern('X---X---X---X---', 36, bars, 1), 0.95),
      trk('Snare', 'Kit: Snare', drumPattern('----X-------X---', 60, bars, 1, 0.7), 0.6, 0.2),
      trk('Hat', 'Kit: Hat', drumPattern('--x---x---x---xX', 60, bars, 1, 0.45), 0.4, -0.3)
    ], 0.85);
  }

  /* --------------------------------------------------- 2. Deep Circuit */
  function deepCircuit() {
    const bars = 4;
    const roots = [38, 34, 41, 36];
    const chords = [[50, 53, 57], [46, 50, 53], [48, 53, 57], [48, 52, 55]];
    let bass = [];
    let stab = [];

    for (let b = 0; b < bars; b++) {
      const root = roots[b];
      [0, 3, 6, 8, 11, 14].forEach(function (s, i) {
        bass.push(N(b * SPB + s, i === 3 ? root + 12 : root, 2, i === 0 ? 1 : 0.75));
      });
      [2, 6, 10, 14].forEach(function (s) {
        stab = stab.concat(chord(chords[b], b * SPB + s, 1, 0.7));
      });
    }

    return song('Deep Circuit', 124, bars, [
      trk('Stab', 'Neon Pluck', stab, 0.55, 0.35),
      trk('Bass', 'Reese Bass', bass, 0.8),
      trk('Kick', 'Kit: Kick', drumPattern('X---X---X---X---', 36, bars, 1), 0.95),
      trk('Clap', 'Kit: Clap', drumPattern('----X-------X---', 60, bars, 1, 0.75), 0.55, -0.2),
      trk('Hat', 'Kit: Hat', drumPattern('--x---x---x---x-', 60, bars, 1, 0.45), 0.38, 0.3)
    ], 0.9);
  }

  /* ------------------------------------------------ 3. Glass Cathedral */
  function glassCathedral() {
    const bars = 2;
    const total = bars * SPB;
    const pad = chord([48, 55, 59, 64], 0, total, 0.6);
    const bells = [
      N(0, 72, 6, 0.7), N(8, 76, 6, 0.55), N(14, 79, 4, 0.6),
      N(20, 74, 6, 0.5), N(26, 81, 6, 0.65)
    ];
    const drone = [N(0, 36, total, 0.9)];

    return song('Glass Cathedral', 68, bars, [
      trk('Pad', 'Glass Pad', pad, 0.6),
      trk('Bells', 'Circuit Bells', bells, 0.6, -0.3),
      trk('Drone', 'Sub Growl', drone, 0.5)
    ], 0.9);
  }

  /* ------------------------------------------------------- 4. Acid Rain */
  function acidRain() {
    const bars = 4;
    const root = 45;
    const patterns = [
      [0, 0, 12, 0, 3, 0, 12, 0, 0, 10, 0, 12, 0, 3, 0, 7],
      [0, 0, 12, 0, 3, 0, 12, 0, 0, 10, 0, 12, 0, 7, 0, 10],
      [0, 0, 12, 0, 7, 0, 12, 0, 0, 10, 0, 12, 0, 3, 0, 7],
      [0, 12, 0, 3, 0, 12, 0, 10, 0, 7, 0, 12, 0, 0, 0, 0]
    ];
    let acid = [];
    let bass = [];

    for (let b = 0; b < bars; b++) {
      const pat = patterns[b % patterns.length];
      for (let i = 0; i < SPB; i++) {
        if (pat[i] === null) continue;
        acid.push(N(b * SPB + i, root + pat[i], 1, i % 4 === 0 ? 0.95 : 0.6));
      }
      bass.push(N(b * SPB, root - 12, 6, 1));
      bass.push(N(b * SPB + 8, root - 12, 6, 0.8));
    }

    return song('Acid Rain', 132, bars, [
      trk('Acid', 'Acid Lead', acid, 0.6, 0.25),
      trk('Bass', 'Sub Growl', bass, 0.85),
      trk('Kick', 'Kit: Kick', drumPattern('X---X---X---X---', 36, bars, 1), 0.95),
      trk('Hat', 'Kit: Hat', drumPattern('x-x-x-x-x-x-x-x-', 60, bars, 1, 0.4), 0.34, -0.35)
    ], 0.85);
  }


  /* -------------------------------------------- 5. Sunset Boulevard */
  function sunsetBlvd() {
    const bars = 4;
    const chords = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]];
    const roots = [33, 29, 36, 31];
    let keys = [], bass = [], lead = [];
    for (let b = 0; b < bars; b++) {
      const ch = chords[b];
      keys = keys.concat(chord(ch, b * SPB, 14, 0.55));
      [0, 6, 8, 14].forEach((s, i) => {
        bass.push(N(b * SPB + s, i === 2 ? roots[b] + 12 : roots[b], s === 14 ? 2 : 4, i === 0 ? 1 : 0.8));
      });
      const seq = [ch[0], ch[1], ch[2], ch[3], ch[2], ch[1]];
      lead = lead.concat(arp(seq, 8, 2, b * SPB, 2, 0.6));
    }
    return song('Sunset Boulevard', 92, bars, [
      trk('Rhodes', 'Rhodes', keys, 0.62),
      trk('Lead', 'Arcade Lead', lead, 0.42, -0.35),
      trk('Bass', '808 Sub', bass, 0.85),
      trk('Kick', 'Kit: Kick', drumPattern('X-------X-------', 36, bars, 1), 0.9),
      trk('Snare', 'Kit: Snare', drumPattern('----X-------X---', 60, bars, 1, 0.65), 0.5, 0.2),
      trk('Hat', 'Kit: Hat', drumPattern('--x---x---x---x-', 60, bars, 1, 0.42), 0.35, -0.3)
    ], 0.85);
  }

  /* --------------------------------------------- 6. Cathedral Dust */
  function cathedralDust() {
    const bars = 2;
    const total = bars * SPB;
    return song('Cathedral Dust', 60, bars, [
      trk('Choir', 'Choir', chord([55, 59, 62], 0, total, 0.5), 0.55),
      trk('Strings', 'Strings', chord([43, 50, 55], 0, total, 0.42), 0.5, 0.25),
      trk('Bells', 'Tubular Bells', [
        N(0, 72, 6, 0.55), N(12, 79, 6, 0.45), N(20, 76, 6, 0.5), N(28, 72, 8, 0.4)
      ], 0.5, -0.35),
      trk('Drone', '808 Sub', [N(0, 31, total, 0.75)], 0.45)
    ], 0.9);
  }

  /* ---------------------------------------------- 7. Funk Machine */
  function funkMachine() {
    const bars = 4;
    const riff = [
      [52, 55, 57, 55, 52, 59],
      [52, 55, 57, 59, 62, 59],
      [52, 55, 57, 55, 52, 59],
      [55, 57, 59, 62, 64, 62]
    ];
    const bassLine = [
      [40, 40, 47, 40, 43, 40],
      [40, 40, 47, 40, 45, 43],
      [40, 40, 47, 40, 43, 40],
      [43, 45, 47, 50, 47, 45]
    ];
    let clav = [], bass = [];
    for (let b = 0; b < bars; b++) {
      const steps = [0, 3, 6, 8, 11, 14];
      steps.forEach((s, i) => { clav.push(N(b * SPB + s, riff[b][i], 2, i === 0 ? 0.95 : 0.75)); });
      [0, 2, 5, 7, 10, 12].forEach((s, i) => { bass.push(N(b * SPB + s, bassLine[b][i], s === 12 ? 4 : 2, i === 0 ? 1 : 0.8)); });
    }
    return song('Funk Machine', 112, bars, [
      trk('Clav', 'Clavinet', clav, 0.6, 0.3),
      trk('Bass', 'FM Bass', bass, 0.85),
      trk('Kick', 'Kit: Kick', drumPattern('X--X--X---X-X---', 36, bars, 1), 0.9),
      trk('Snare', 'Kit: Snare', drumPattern('----X-------X---', 60, bars, 1, 0.7), 0.55, -0.2),
      trk('Hat', 'Kit: Hat', drumPattern('x-x-x-x-x-x-x-x-', 60, bars, 1, 0.4), 0.32, 0.3),
      trk('Bell', 'Kit: Cowbell', drumPattern('------X-------X-', 60, bars, 1, 0.7), 0.4, -0.4),
      trk('Shaker', 'Kit: Shaker', drumPattern('--x---x---x---x-', 60, bars, 1, 0.5), 0.3, 0.45)
    ], 0.85);
  }

  /* ---------------------------------------------- 8. Pixel Garden */
  function pixelGarden() {
    const bars = 4;
    const mel = [
      [72, 76, 79, 76, 74, 72, 69, 72],
      [69, 72, 76, 72, 71, 69, 67, 69],
      [65, 69, 72, 69, 67, 65, 62, 65],
      [67, 71, 74, 71, 69, 67, 64, 67]
    ];
    const roots = [36, 33, 29, 31];
    const chips = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]];
    let lead = [], chip = [], bass = [];
    for (let b = 0; b < bars; b++) {
      mel[b].forEach((p, i) => { lead.push(N(b * SPB + i * 2, p, 2, i % 2 ? 0.6 : 0.85)); });
      chip = chip.concat(arp(chips[b], 16, 1, b * SPB, 1, 0.35));
      [0, 4, 8, 12].forEach((s, i) => { bass.push(N(b * SPB + s, i === 3 ? roots[b] + 7 : roots[b], 4, 0.9)); });
    }
    return song('Pixel Garden', 140, bars, [
      trk('Melody', 'Arcade Lead', lead, 0.5),
      trk('Arp', 'Chip Arp', chip, 0.32, -0.4),
      trk('Bass', 'Chip Arp', bass, 0.5, 0.35),
      trk('Kick', 'Kit: Kick', drumPattern('X---X---X---X---', 36, bars, 1), 0.85),
      trk('Hat', 'Kit: Hat', drumPattern('x-x-x-x-x-x-x-x-', 60, bars, 1, 0.4), 0.3, 0.4),
      trk('Rim', 'Kit: Rim', drumPattern('--X-------X-----', 60, bars, 1, 0.6), 0.3, -0.35)
    ], 0.85);
  }

  /* ------------------------------------------------ 9. Steel Rain */
  function steelRain() {
    const bars = 4;
    const riff = [
      [38, 38, 41, 38, 43, 41],
      [38, 38, 41, 44, 43, 41],
      [36, 36, 39, 36, 43, 41],
      [43, 41, 38, 41, 45, 43]
    ];
    let guitar = [], bass = [], hits = [];
    for (let b = 0; b < bars; b++) {
      const steps = [0, 3, 6, 8, 11, 14];
      steps.forEach((s, i) => { guitar.push(N(b * SPB + s, riff[b][i], s === 14 ? 2 : 3, i === 0 ? 1 : 0.8)); });
      [0, 6, 8, 12].forEach((s) => { bass.push(N(b * SPB + s, 38 - (b === 2 ? 2 : 0), 4, 0.9)); });
      if (b === 0 || b === 2) hits.push(N(b * SPB, 24, 8, 0.9));
    }
    return song('Steel Rain', 128, bars, [
      trk('Guitar', 'Overdrive Guitar', guitar, 0.55, 0.25),
      trk('Bass', 'Reese Bass', bass, 0.8),
      trk('Kick', 'Kit: Kick', drumPattern('X---X---X---X-X-', 36, bars, 1), 0.95),
      trk('Snare', 'Kit: Snare', drumPattern('----X-------X---', 60, bars, 1, 0.7), 0.5, -0.2),
      trk('Cymbal', 'Kit: Cymbal', drumPattern('X---------------', 60, bars, 1, 0.8), 0.35, 0.35),
      trk('Impact', 'Impact Hit', hits, 0.7)
    ], 0.85);
  }

  /* ---------------------------------------------- 10. Lullaby Box */
  function lullabyBox() {
    const bars = 2;
    const total = bars * SPB;
    const mel = [0, 4, 6, 10, 14, 16, 20, 24, 28];
    const pitches = [72, 76, 79, 84, 79, 76, 72, 74, 72];
    const box = mel.map((s, i) => N(s, pitches[i], i === 8 ? 8 : 4, i % 3 === 0 ? 0.85 : 0.6));
    const kalimba = [];
    [0, 6, 12, 18, 24].forEach((s, i) => { kalimba.push(N(s, [60, 64, 67, 64, 60][i], 4, 0.5)); });
    return song('Lullaby Box', 76, bars, [
      trk('Music Box', 'Music Box', box, 0.6),
      trk('Kalimba', 'Kalimba', kalimba, 0.42, -0.3),
      trk('Harp', 'Harp', chord([48, 55, 60], 0, total, 0.45), 0.45, 0.3),
      trk('Sub', '808 Sub', [N(0, 36, 16, 0.7)], 0.4)
    ], 0.9);
  }

  /* -------------------------------------------- 11. Midnight Groove */
  function midnightGroove() {
    const bars = 4;
    const chords = [[53, 56, 60, 67], [58, 61, 65, 72], [51, 55, 58, 62], [56, 60, 63, 67]];
    const walks = [
      [41, 48, 51, 53, 55, 53, 51, 48],
      [46, 53, 56, 58, 60, 58, 56, 53],
      [39, 46, 50, 51, 55, 51, 50, 46],
      [44, 51, 55, 56, 60, 56, 55, 51]
    ];
    let keys = [], bass = [];
    for (let b = 0; b < bars; b++) {
      keys = keys.concat(chord(chords[b], b * SPB, 12, 0.55));
      walks[b].forEach((p, i) => { bass.push(N(b * SPB + i * 2, p, 2, i === 0 ? 1 : 0.75)); });
    }
    const s = song('Midnight Groove', 96, bars, [
      trk('Keys', 'Rhodes', keys, 0.62),
      trk('Bass', 'FM Bass', bass, 0.82),
      trk('Kick', 'Kit: Kick', drumPattern('X-----x---X-----', 36, bars, 1), 0.85),
      trk('Snare', 'Kit: Snare', drumPattern('----X-------X---', 60, bars, 1, 0.7), 0.55, 0.15),
      trk('Hat', 'Kit: Hat', drumPattern('--x---x---x---xX', 60, bars, 1, 0.45), 0.4, -0.3),
      trk('Rim', 'Kit: Rim', drumPattern('------x-----x---', 60, bars, 1, 0.5), 0.3, 0.4)
    ], 0.88);
    s.swing = 0.22;
    return s;
  }

  /* ------------------------------------------------- 12. Hyper Rush */
  function hyperRush() {
    const bars = 4;
    const roots = [33, 29, 31, 28];
    const pads = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]];
    const melody = [
      [N(0, 69, 3, 0.8), N(4, 72, 2, 0.7), N(8, 76, 4, 0.85), N(14, 74, 2, 0.65)],
      [N(0, 72, 3, 0.75), N(4, 69, 2, 0.65), N(6, 72, 4, 0.8), N(12, 77, 4, 0.85)],
      [N(0, 74, 3, 0.8), N(4, 72, 2, 0.65), N(8, 71, 6, 0.85), N(14, 69, 2, 0.65)],
      [N(0, 69, 6, 0.85), N(8, 64, 8, 0.8)]
    ];
    let bass = [], pad = [], lead = [];
    for (let b = 0; b < bars; b++) {
      const r = roots[b];
      bass.push(N(b * SPB, r, 3, 1));
      bass.push(N(b * SPB + 4, r, 1, 0.7));
      bass.push(N(b * SPB + 6, r + 12, 2, 0.85));
      bass.push(N(b * SPB + 10, r, 2, 0.8));
      bass.push(N(b * SPB + 13, r + 12, 3, 0.75));
      pad = pad.concat(chord(pads[b], b * SPB, 16, 0.55));
      lead = lead.concat(melody[b].map((n) => Object.assign({}, n, { step: n.step + b * SPB })));
    }
    return song('Hyper Rush', 172, bars, [
      trk('Pad', 'Glass Pad', pad, 0.5),
      trk('Lead', 'Tape Lead', lead, 0.5, -0.2),
      trk('Bass', 'Reese Bass', bass, 0.85),
      trk('Kick', 'Kit: Kick', drumPattern('X---------X-----', 36, bars, 1), 0.95),
      trk('Snare', 'Kit: Snare', drumPattern('----X---x---X--X', 60, bars, 1, 0.65), 0.55, -0.15),
      trk('Hat', 'Kit: Hat', drumPattern('X-x-X-x-X-x-X-x-', 60, bars, 1, 0.35), 0.35, 0.3),
      trk('Ride', 'Kit: Cymbal', drumPattern('--------------x-', 60, bars, 1, 0.4), 0.3, 0.4)
    ], 0.85);
  }

  /* -------------------------------------------- 13. Prelude in Amber */
  function preludeAmber() {
    const bars = 8;
    const roots = [45, 41, 48, 43, 45, 41, 40, 45];
    const chords = [
      [57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62],
      [57, 60, 64], [53, 57, 60], [52, 56, 59], null
    ];
    const idx = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3];
    let harp = [], strings = [];
    for (let b = 0; b < bars; b++) {
      if (b < 7) {
        const pool = [chords[b][0], chords[b][1], chords[b][2], chords[b][0] + 12];
        idx.forEach((ix, i) => { harp.push(N(b * SPB + i, pool[ix], 2, i % 4 === 0 ? 0.85 : 0.5)); });
        strings = strings.concat(chord([roots[b], chords[b][0], chords[b][1], chords[b][2]], b * SPB, 16, 0.42));
      } else {
        [57, 60, 64, 69, 72].forEach((p, i) => { harp.push(N(b * SPB + i * 2, p, 4, i === 4 ? 0.9 : 0.7)); });
        [57, 60, 64, 69].forEach((p) => { harp.push(N(b * SPB + 12, p, 4, 0.6)); });
        strings = strings.concat(chord([45, 52, 57, 60, 64], b * SPB, 16, 0.5));
      }
    }
    return song('Prelude in Amber', 84, bars, [
      trk('Harp', 'Harp', harp, 0.6),
      trk('Strings', 'Strings', strings, 0.45, 0.2),
      trk('Bells', 'Circuit Bells', [
        N(0, 69, 8, 0.4), N(64, 72, 8, 0.35), N(112, 81, 8, 0.45)
      ], 0.4, -0.35)
    ], 0.9);
  }

  /* ----------------------------------------------- 14. Orbital Pulse */
  function orbitalPulse() {
    const bars = 4;
    const roots = [33, 31, 29, 31];
    const pads = [[57, 60, 64, 69], [55, 59, 62, 67], [53, 57, 60, 65], [55, 59, 62, 67]];
    const leadNotes = [
      [N(0, 76, 3, 0.85), N(4, 72, 2, 0.7), N(6, 71, 2, 0.7), N(8, 69, 6, 0.85), N(14, 72, 2, 0.7)],
      [N(0, 67, 3, 0.8), N(4, 64, 2, 0.65), N(6, 67, 2, 0.7), N(8, 71, 8, 0.85)]
    ];
    let bass = [], pad = [], arpN = [], lead = [];
    for (let b = 0; b < bars; b++) {
      for (let i = 0; i < SPB; i += 2) {
        const oct = (i === 6 || i === 14) ? 12 : 0;
        bass.push(N(b * SPB + i, roots[b] + oct, 2, i === 0 ? 1 : 0.7));
      }
      pad = pad.concat(chord(pads[b], b * SPB, 16, 0.5));
      const seq = [pads[b][0], pads[b][1], pads[b][2], pads[b][3], pads[b][0] + 12, pads[b][2], pads[b][1], pads[b][3]];
      arpN = arpN.concat(arp(seq, 16, 1, b * SPB, 1, 0.45));
      if (b === 2) lead = lead.concat(leadNotes[0].map((n) => Object.assign({}, n, { step: n.step + b * SPB })));
      if (b === 3) lead = lead.concat(leadNotes[1].map((n) => Object.assign({}, n, { step: n.step + b * SPB })));
    }
    return song('Orbital Pulse', 134, bars, [
      trk('Pad', 'Glass Pad', pad, 0.5),
      trk('Arp', 'Chip Arp', arpN, 0.4, 0.3),
      trk('Lead', 'Tape Lead', lead, 0.5, -0.3),
      trk('Bass', 'Sub Growl', bass, 0.8),
      trk('Kick', 'Kit: Kick', drumPattern('X---X---X---X---', 36, bars, 1), 0.95),
      trk('Clap', 'Kit: Clap', drumPattern('----X-------X---', 60, bars, 1, 0.75), 0.55, -0.2),
      trk('Hat', 'Kit: Hat', drumPattern('--X-------X-----', 60, bars, 2, 0.4), 0.4, 0.35),
      trk('Crash', 'Kit: Cymbal', drumPattern('X---------------', 60, 1, 1, 0.7), 0.35, 0.4)
    ], 0.85);
  }

  /* ----------------------------------------------- 15. Bossa Sunrise */
  function bossaSunrise() {
    const bars = 4;
    const chords = [[53, 57, 60, 64], [55, 59, 62, 65], [60, 64, 67, 71], [57, 60, 64, 67]];
    const roots = [[41, 48], [43, 50], [36, 43], [45, 52]];
    const mel = [
      [N(0, 69, 3, 0.8), N(4, 72, 3, 0.7), N(8, 76, 4, 0.85), N(14, 74, 2, 0.65)],
      [N(0, 71, 4, 0.75), N(4, 74, 3, 0.7), N(8, 79, 4, 0.85), N(12, 77, 4, 0.7)],
      [N(0, 76, 3, 0.8), N(4, 72, 3, 0.7), N(8, 67, 6, 0.8), N(14, 64, 2, 0.6)],
      [N(0, 64, 3, 0.75), N(4, 67, 3, 0.7), N(8, 72, 6, 0.85), N(14, 69, 2, 0.7)]
    ];
    let keys = [], bass = [], lead = [];
    for (let b = 0; b < bars; b++) {
      const ch = chords[b];
      [0, 6, 11].forEach((s, i) => { keys = keys.concat(chord(ch, b * SPB + s, i === 0 ? 5 : 2, i === 0 ? 0.6 : 0.5)); });
      bass.push(N(b * SPB, roots[b][0], 6, 1));
      bass.push(N(b * SPB + 8, roots[b][1], 6, 0.85));
      lead = lead.concat(mel[b].map((n) => Object.assign({}, n, { step: n.step + b * SPB })));
    }
    const s = song('Bossa Sunrise', 92, bars, [
      trk('Keys', 'Rhodes', keys, 0.58),
      trk('Melody', 'Kalimba', lead, 0.55, 0.25),
      trk('Bass', '808 Sub', bass, 0.8),
      trk('Kick', 'Kit: Kick', drumPattern('X-------X-------', 36, bars, 1), 0.8),
      trk('Rim', 'Kit: Rim', drumPattern('X-----X-----X---', 60, bars, 1, 0.65), 0.45, -0.3),
      trk('Shaker', 'Kit: Shaker', drumPattern('--x---x---x---x-', 60, bars, 1, 0.5), 0.35, 0.4)
    ], 0.88);
    s.swing = 0.12;
    return s;
  }

  /* --------------------------------------------------- 16. Epic Dawn */
  function epicDawn() {
    const bars = 8;
    const stringsCh = [
      [45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59],
      [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], null
    ];
    const brassCh = [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]];
    const roots = [45, 41, 48, 43, 45, 41, 43, 45];
    const choirMel = [
      [N(0, 69, 4, 0.75), N(4, 72, 4, 0.7), N(8, 71, 4, 0.7), N(12, 69, 4, 0.75)],
      [N(0, 69, 8, 0.7), N(8, 67, 8, 0.7)],
      [N(0, 64, 8, 0.7), N(8, 67, 8, 0.75)],
      [N(0, 62, 12, 0.7)],
      [N(0, 69, 4, 0.8), N(4, 72, 4, 0.75), N(8, 74, 4, 0.75), N(12, 72, 4, 0.8)],
      [N(0, 72, 8, 0.75), N(8, 67, 8, 0.75)],
      [N(0, 71, 8, 0.75), N(8, 67, 8, 0.8)],
      [N(0, 69, 16, 0.85)]
    ];
    let strings = [], brass = [], choir = [], sub = [], toms = [];
    for (let b = 0; b < bars; b++) {
      if (b < 7) {
        strings = strings.concat(chord(stringsCh[b], b * SPB, 16, b < 4 ? 0.4 : 0.5));
        const bc = b < 4 ? brassCh[b] : brassCh[b % 4];
        if (b >= 4) {
          brass = brass.concat(chord(bc, b * SPB, 6, 0.55));
          brass = brass.concat(chord(bc, b * SPB + 8, 6, 0.6));
        } else {
          brass = brass.concat(chord(bc, b * SPB, 14, 0.45));
        }
      } else {
        strings = strings.concat(chord([45, 52, 57, 60, 64], b * SPB, 16, 0.55));
        brass = brass.concat(chord([57, 64, 69], b * SPB, 16, 0.6));
      }
      sub.push(N(b * SPB, roots[b] - 12, 14, 0.7));
      choir = choir.concat(choirMel[b].map((n) => Object.assign({}, n, { step: n.step + b * SPB })));
      if (b === 4 || b === 8 - 1) toms = toms.concat(drumBar('X-X-X-XXX-XXXXXX', 60, b * SPB, 1, 0.55));
      else if (b === 0) toms = toms.concat(drumBar('X-------x-------', 60, 0, 1, 0.5));
    }
    return song('Epic Dawn', 78, bars, [
      trk('Strings', 'Strings', strings, 0.55),
      trk('Brass', 'Synth Brass', brass, 0.5, 0.25),
      trk('Choir', 'Choir', choir, 0.55, -0.25),
      trk('Sub', '808 Sub', sub, 0.6),
      trk('Toms', 'Kit: Tom', toms, 0.5, 0.1),
      trk('Impact', 'Impact Hit', [N(0, 24, 8, 0.9), N(64, 24, 8, 0.9)], 0.6),
      trk('Cymbal', 'Kit: Cymbal', [N(0, 60, 8, 0.7), N(64, 60, 8, 0.6)], 0.3, 0.4)
    ], 0.9);
  }

  SL.EXAMPLE_SONGS = [
    neonDrive(), deepCircuit(), glassCathedral(), acidRain(),
    sunsetBlvd(), cathedralDust(), funkMachine(), pixelGarden(), steelRain(), lullabyBox(),
    midnightGroove(), hyperRush(), preludeAmber(), orbitalPulse(), bossaSunrise(), epicDawn()
  ];
})(window);
