/* SYNTH LAB — song model, step scheduler, offline render + WAV export */
(function (global) {
  'use strict';

  const SL = global.SynthLab;
  const STEPS_PER_BAR = 16;

  function newSong() {
    return {
      name: 'Untitled',
      bpm: 120,
      swing: 0,
      scaleRoot: 0,
      scaleType: 'chromatic',
      scaleSnap: false,
      bars: 2,
      stepsPerBar: STEPS_PER_BAR,
      masterVolume: 0.85,
      tracks: []
    };
  }

  function newTrack(name, patch, notes) {
    return {
      name: name || 'Track',
      patch: patch || SL.defaultPatch(),
      volume: 0.9,
      pan: 0,
      mute: false,
      solo: false,
      show: true,
      notes: notes || []
    };
  }

  const totalSteps = (song) => song.bars * (song.stepsPerBar || STEPS_PER_BAR);
  const stepDur = (song) => 60 / song.bpm / 4;

  /* Precompute per-step note lists and how long each note may ring before the
   * same pitch retriggers (so a scheduled note-off can't cut the next note). */
  const SCALES = {
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    harmMinor: [0, 2, 3, 5, 7, 8, 11],
    melMinor: [0, 2, 3, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    majPent: [0, 2, 4, 7, 9],
    minPent: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
    wholeTone: [0, 2, 4, 6, 8, 10]
  };

  const SCALE_LABELS = {
    chromatic: 'Chromatic (off)',
    major: 'Major',
    minor: 'Natural minor',
    harmMinor: 'Harmonic minor',
    melMinor: 'Melodic minor',
    dorian: 'Dorian',
    phrygian: 'Phrygian',
    lydian: 'Lydian',
    mixolydian: 'Mixolydian',
    majPent: 'Major pentatonic',
    minPent: 'Minor pentatonic',
    blues: 'Blues',
    wholeTone: 'Whole tone'
  };

  function inScale(pitch, root, type) {
    const iv = SCALES[type];
    if (!iv) return true;
    return iv.indexOf((((pitch - root) % 12) + 12) % 12) >= 0;
  }

  /* nearest in-scale pitch, searching the note itself plus an octave either way */
  function snapPitch(pitch, root, type) {
    const iv = SCALES[type];
    if (!iv || !iv.length) return pitch;
    const rel = (((pitch - root) % 12) + 12) % 12;
    let best = pitch;
    let bestD = 99;
    iv.forEach(function (i) {
      [-12, 0, 12].forEach(function (off) {
        const delta = (i - rel) + off;
        const d = delta < 0 ? -delta : delta;
        if (d < bestD) { bestD = d; best = pitch + delta; }
      });
    });
    return best < 0 ? 0 : (best > 127 ? 127 : best);
  }

  /* which arpeggio note (if any) a track plays on step `s` */
  function arpNoteFor(track, s) {
    const a = track.arp;
    if (!a || !a.on) return null;
    const rate = Math.max(1, Math.min(16, Math.round(a.rate || 2)));
    if (s % rate !== 0) return null;
    const chords = track._chords;
    if (!chords || !chords.length) return null;
    let chord = null;
    for (let i = 0; i < chords.length; i++) {
      if (chords[i].step <= s) chord = chords[i]; else break;
    }
    if (!chord || !chord.items.length) return null;

    const idx = Math.floor((s - chord.step) / rate);
    const oct = Math.max(1, Math.min(4, Math.round(a.octaves || 1)));
    const pat = a.pattern || 'up';

    const ordered = chord.items.slice();
    if (pat !== 'as') ordered.sort(function (x, y) { return x.pitch - y.pitch; });
    const seq = [];
    if (pat === 'down') {
      for (let o = oct - 1; o >= 0; o--) {
        for (let k = ordered.length - 1; k >= 0; k--) seq.push({ pitch: ordered[k].pitch + 12 * o, vel: ordered[k].vel });
      }
    } else {
      for (let o = 0; o < oct; o++) {
        for (let k = 0; k < ordered.length; k++) seq.push({ pitch: ordered[k].pitch + 12 * o, vel: ordered[k].vel });
      }
    }
    if (!seq.length) return null;

    let pick;
    if (pat === 'updown') {
      const L = seq.length;
      const period = L > 1 ? 2 * L - 2 : 1;
      const i = idx % period;
      pick = seq[i < L ? i : period - i];
    } else if (pat === 'random') {
      const h = Math.abs(Math.floor(idx * 2654435761) % 104729);
      pick = seq[h % seq.length];
    } else {
      pick = seq[idx % seq.length];
    }
    const gate = Math.max(10, Math.min(100, Math.round(a.gate === undefined ? 60 : a.gate)));
    return {
      pitch: Math.max(0, Math.min(127, pick.pitch)),
      vel: pick.vel === undefined ? 0.9 : pick.vel,
      len: Math.max(1, Math.round(rate * gate / 100))
    };
  }

  function indexTrack(song, track) {
    const total = totalSteps(song);
    const starts = new Array(total);
    const byPitch = new Map();

    track.notes.forEach(function (n) {
      const s = ((n.step % total) + total) % total;
      if (!starts[s]) starts[s] = [];
      starts[s].push(n);
      if (!byPitch.has(n.pitch)) byPitch.set(n.pitch, []);
      byPitch.get(n.pitch).push(s);
    });
    byPitch.forEach(function (arr) { arr.sort(function (a, b) { return a - b; }); });

    track.notes.forEach(function (n) {
      const s = ((n.step % total) + total) % total;
      const arr = byPitch.get(n.pitch) || [];
      let next = null;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] > s) { next = arr[i]; break; }
      }
      n._maxSteps = next === null ? total : next - s;
    });

    track._starts = starts;

    /* chord events for the arpeggiator: notes grouped by their start step */
    const byStep = new Map();
    track.notes.forEach(function (n) {
      const st = (((n.step % total) + total) % total);
      let arr = byStep.get(st);
      if (!arr) { arr = []; byStep.set(st, arr); }
      arr.push({ pitch: n.pitch, vel: n.vel });
    });
    const chords = [];
    Array.from(byStep.keys()).sort(function (a, b) { return a - b; }).forEach(function (st) {
      chords.push({ step: st, items: byStep.get(st) });
    });
    track._chords = chords;
  }

  /* Fill a track's patch with defaults, keeping the object identity so any
   * live editor reference and the synth engine keep pointing at the same data. */
  function fillPatch(track, patch) {
    const filled = SL.mergePatch(SL.defaultPatch(), patch || {});
    if (!track.patch || typeof track.patch !== 'object') track.patch = {};
    Object.keys(filled).forEach(function (k) { track.patch[k] = filled[k]; });
    return track.patch;
  }

  function isAudible(song, track) {
    const anySolo = song.tracks.some(function (t) { return t.solo; });
    return anySolo ? !!track.solo : !track.mute;
  }

  function Composer(song) {
    this.song = song;
    this.ctx = null;
    this.engines = [];
    this.strips = [];
    this.playing = false;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.queue = [];
    this.lookahead = 0.12;
    this.tail = 2.5;
    this.onStep = null;
    this._disp = -1;
  }

  Composer.prototype.ensure = function () {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }
    const AC = global.AudioContext || global.webkitAudioContext;
    this.ctx = new AC({ latencyHint: 'interactive' });
    this.build();
    return this.ctx;
  };

  Composer.prototype.build = function () {
    const ctx = this.ctx;
    const song = this.song;

    this.engines.forEach(function (e) { e.allNotesOff(); });
    this.engines = [];
    this.strips = [];

    this.master = ctx.createGain();
    this.master.gain.value = song.masterVolume;
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -8;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.25;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    this.master.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    for (let i = 0; i < song.tracks.length; i++) this.buildTrack(i);
    return this;
  };

  Composer.prototype.buildTrack = function (i) {
    const ctx = this.ctx;
    const t = this.song.tracks[i];
    if (this.engines[i]) {
      try { this.engines[i].allNotesOff(); } catch (e) { /* already gone */ }
    }
    fillPatch(t, t.patch);
    const eng = new SL.SynthEngine();
    eng.start(ctx);
    eng.patch = t.patch;
    eng.applyAll();
    const pan = ctx.createStereoPanner();
    pan.pan.value = t.pan;
    const vol = ctx.createGain();
    vol.gain.value = t.volume;
    eng.setDestination(pan);
    pan.connect(vol);
    vol.connect(this.master);
    this.engines[i] = eng;
    this.strips[i] = { pan: pan, vol: vol };
    return eng;
  };

  Composer.prototype.setTrackPatch = function (i, patch) {
    fillPatch(this.song.tracks[i], patch);
    if (!this.ctx) return null;
    return this.buildTrack(i);
  };

  Composer.prototype.setTrackMix = function (i) {
    const t = this.song.tracks[i];
    if (!this.strips[i]) return;
    const now = this.ctx.currentTime;
    this.strips[i].vol.gain.setTargetAtTime(t.volume, now, 0.02);
    this.strips[i].pan.pan.setTargetAtTime(t.pan, now, 0.02);
  };

  Composer.prototype.setMasterVolume = function (v) {
    this.song.masterVolume = v;
    if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03);
  };

  /* ---- scheduling ---- */

  Composer.prototype.scheduleStep = function (s, time) {
    const song = this.song;
    const sd = stepDur(song);
    const when = time + (s % 2 === 1 ? song.swing * sd * 0.5 : 0);

    for (let i = 0; i < song.tracks.length; i++) {
      const t = song.tracks[i];
      if (!isAudible(song, t)) continue;
      const eng = this.engines[i];
      if (!eng || !t._starts) continue;
      if (t.arp && t.arp.on) {
        const an = arpNoteFor(t, s);
        if (an) {
          const end = when + Math.max(1, an.len) * sd * 0.98;
          eng.noteOn(an.pitch, an.vel, when);
          eng.noteOff(an.pitch, end);
        }
        continue;
      }
      const list = t._starts[s];
      if (!list) continue;
      for (let k = 0; k < list.length; k++) {
        const n = list[k];
        const durSteps = Math.min(Math.max(1, n.len), n._maxSteps || 1);
        const end = when + durSteps * sd * 0.98;
        eng.noteOn(n.pitch, n.vel === undefined ? 0.9 : n.vel, when);
        eng.noteOff(n.pitch, end);
      }
    }
  };

  Composer.prototype.tick = function () {
    const ctx = this.ctx;
    if (!this.playing || !ctx) return;
    const total = totalSteps(this.song);
    const sd = stepDur(this.song);
    while (this.nextTime < ctx.currentTime + this.lookahead) {
      this.scheduleStep(this.step, this.nextTime);
      this.queue.push({ step: this.step, time: this.nextTime });
      this.nextTime += sd;
      this.step = (this.step + 1) % total;
    }
  };

  Composer.prototype.play = function () {
    const ctx = this.ensure();
    if (ctx.state === 'suspended') ctx.resume();
    if (this.playing) return;
    this.song.tracks.forEach(function (t) { indexTrack(this.song, t); }, this);
    this.playing = true;
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.06;
    this.queue.length = 0;
    this.tick();
    const self = this;
    this.timer = setInterval(function () { self.tick(); }, 25);
  };

  Composer.prototype.stop = function () {
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    this.queue.length = 0;
    this._disp = -1;
    this.engines.forEach(function (e) { e.allNotesOff(); });
    if (this.onStep) this.onStep(-1);
  };

  Composer.prototype.toggle = function () {
    if (this.playing) this.stop(); else this.play();
  };

  Composer.prototype.displayStep = function () {
    if (!this.playing || !this.ctx) return -1;
    const now = this.ctx.currentTime;
    let s = -1;
    while (this.queue.length && this.queue[0].time <= now) s = this.queue.shift().step;
    if (s >= 0) this._disp = s;
    return this._disp;
  };

  /* ---- offline render / WAV ---- */

  Composer.prototype.renderOffline = function (song) {
    const OAC = global.OfflineAudioContext || global.webkitOfflineAudioContext;
    const sd = 60 / song.bpm / 4;
    const total = totalSteps(song);
    const dur = total * sd + this.tail;
    const sr = 44100;
    const octx = new OAC(2, Math.ceil(dur * sr), sr);

    const tmp = new Composer(song);
    tmp.ctx = octx;
    tmp.build();
    song.tracks.forEach(function (t) { indexTrack(song, t); });
    for (let s = 0; s < total; s++) tmp.scheduleStep(s, s * sd);

    return octx.startRendering();
  };

  function encodeWav(buffer) {
    const numCh = buffer.numberOfChannels;
    const len = buffer.length;
    const sr = buffer.sampleRate;
    const dataBytes = len * numCh * 2;
    const ab = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(ab);
    let p = 0;
    const tag = function (s) { for (let i = 0; i < s.length; i++) view.setUint8(p + i, s.charCodeAt(i)); p += s.length; };
    const u32 = function (v) { view.setUint32(p, v, true); p += 4; };
    const u16 = function (v) { view.setUint16(p, v, true); p += 2; };

    tag('RIFF'); u32(36 + dataBytes); tag('WAVE');
    tag('fmt '); u32(16); u16(1); u16(numCh); u32(sr); u32(sr * numCh * 2); u16(numCh * 2); u16(16);
    tag('data'); u32(dataBytes);

    const chans = [];
    for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
    let off = 44;
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < numCh; c++) {
        let v = chans[c][i];
        if (v > 1) v = 1; else if (v < -1) v = -1;
        view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7fff, true);
        off += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  SL.Composer = Composer;
  SL.newSong = newSong;
  SL.newTrack = newTrack;
  SL.totalSteps = totalSteps;
  SL.stepDur = stepDur;
  SL.indexTrack = indexTrack;
  SL.encodeWav = encodeWav;
  SL.STEPS_PER_BAR = STEPS_PER_BAR;
  SL.SCALES = SCALES;
  SL.SCALE_LABELS = SCALE_LABELS;
  SL.inScale = inScale;
  SL.snapPitch = snapPitch;
  SL.arpNoteFor = arpNoteFor;
})(window);
