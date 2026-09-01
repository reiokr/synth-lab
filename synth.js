/* SYNTH LAB — audio engine (Web Audio API)
 * Signal path:
 *   [voice] osc1/osc2/sub/noise -> filter -> amp(ADSR) -> trem -> voiceBus
 *   [bus]   drive -> chorus -> delay -> reverb -> master -> limiter -> analyser -> out
 *   [mod]   LFO1/LFO2 -> per-target gains -> every voice's filter.freq / osc.detune / Q / trem
 */
(function (global) {
  'use strict';

  let clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };
  let mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };

  let WAVES = ['sine', 'triangle', 'sawtooth', 'square'];
  let FILTERS = ['lowpass', 'highpass', 'bandpass', 'notch'];
  let LFO_TARGETS = ['filter', 'pitch', 'amp', 'reso'];

  function defaultPatch() {
    return {
      name: 'Init',
      category: '',
      osc1: { type: 'sawtooth', octave: 0, semi: 0, detune: 0, level: 0.70 },
      osc2: { type: 'square', octave: -1, semi: 0, detune: 8, level: 0.40 },
      sub: { octave: -1, level: 0.20 },
      noise: { level: 0.00 },
      unison: { voices: 1, detune: 14, width: 0.40 },
      glide: 0.00,
      filter: { type: 'lowpass', cutoff: 6000, reso: 2.0, keytrack: 0.00, envAmt: 25 },
      filtEnv: { a: 0.02, d: 0.40, s: 0.25 },
      ampEnv: { a: 0.01, d: 0.35, s: 0.75, r: 0.45 },
      lfo1: { wave: 'sine', rate: 5.0, depth: 0, target: 'filter' },
      lfo2: { wave: 'triangle', rate: 0.25, depth: 0, target: 'pitch' },
      drive: { amount: 0.00, tone: 0.50 },
      chorus: { rate: 0.40, depth: 0.00, mix: 0.00 },
      arp: { on: false, rate: 2, pattern: 'up', octaves: 1, gate: 60 },
      delay: { time: 0.32, feedback: 0.30, mix: 0.12 },
      reverb: { size: 2.60, mix: 0.22 },
      master: { volume: 0.70, poly: 8 }
    };
  }

  function mergePatch(base, over) {
    if (!over || typeof over !== 'object') return base;
    Object.keys(base).forEach(function (k) {
      let b = base[k], o = over[k];
      if (o === undefined) return;
      if (b && typeof b === 'object' && !Array.isArray(b)) mergePatch(b, o);
      else if (typeof o === typeof b || typeof b === 'number') base[k] = o;
    });
    if (over.name !== undefined) base.name = String(over.name);
    return base;
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ------------------------------------------------------------------ Voice */

  function Voice(engine, note, vel, when) {
    this.engine = engine;
    this.note = note;
    this.vel = clamp(vel, 0, 1);
    this.ctx = engine.ctx;
    this.p = engine.patch;
    this.oscs = [];
    this.oscNodes = [];
    this.modConns = [];
    this.stopped = false;
    this.born = engine.ctx.currentTime;
    this.t0 = when === undefined ? engine.ctx.currentTime + 0.004 : Math.max(when, engine.ctx.currentTime);
    this.build();
  }

  Voice.prototype.build = function () {
    let ctx = this.ctx, p = this.p, self = this;
    let t0 = this.t0;
    let base = mtof(this.note);

    this.mix = ctx.createGain(); this.mix.gain.value = 1;
    this.filter = ctx.createBiquadFilter();
    this.amp = ctx.createGain(); this.amp.gain.value = 0.0001;
    this.trem = ctx.createGain(); this.trem.gain.value = 1;

    this.mix.connect(this.filter);
    this.filter.connect(this.amp);
    this.amp.connect(this.trem);
    this.trem.connect(this.engine.voiceBus);

    let uv = clamp(Math.round(p.unison.voices), 1, 5);

    let mkOsc = function (slot) {
      let cfg = p[slot];
      if (!(cfg.level > 0)) return;
      let semi = cfg.octave * 12 + cfg.semi;
      let freq = clamp(base * Math.pow(2, semi / 12), 10, 20000);
      let lvl = (cfg.level / uv) * (uv > 1 ? 0.9 : 1);

      for (let i = 0; i < uv; i++) {
        let spread = uv > 1 ? ((i / (uv - 1)) - 0.5) * 2 : 0;
        let o = ctx.createOscillator();
        o.type = WAVES.indexOf(cfg.type) >= 0 ? cfg.type : 'sawtooth';
        o.detune.value = cfg.detune + spread * p.unison.detune + self.engine.bend;

        let g = ctx.createGain();
        g.gain.value = lvl;
        o.connect(g);

        let pan = null;
        if (uv > 1 && p.unison.width > 0) {
          pan = ctx.createStereoPanner();
          pan.pan.value = clamp(spread * p.unison.width, -1, 1);
          g.connect(pan);
          pan.connect(self.mix);
        } else {
          g.connect(self.mix);
        }

        if (p.glide > 0.002 && self.engine.lastBaseFreq > 0) {
          let startF = clamp(freq * (self.engine.lastBaseFreq / base), 10, 20000);
          o.frequency.setValueAtTime(startF, t0);
          o.frequency.exponentialRampToValueAtTime(freq, t0 + p.glide);
        } else {
          o.frequency.setValueAtTime(freq, t0);
        }
        o.start(t0);

        self.oscs.push(o);
        self.oscNodes.push({ osc: o, gain: g, panner: pan, slot: slot, index: i, count: uv });
        self.engine.lfos.forEach(function (l) {
          l.g.pitch.connect(o.detune);
          self.modConns.push([l.g.pitch, o.detune]);
        });
      }
    };

    mkOsc('osc1');
    mkOsc('osc2');

    if (p.sub.level > 0) {
      let so = ctx.createOscillator();
      so.type = 'sine';
      so.frequency.value = clamp(base * Math.pow(2, p.sub.octave), 10, 20000);
      so.detune.value = this.engine.bend;
      let sg = ctx.createGain(); sg.gain.value = p.sub.level;
      so.connect(sg); sg.connect(this.mix);
      so.start(t0);
      this.oscs.push(so);
      this.oscNodes.push({ osc: so, gain: sg, panner: null, slot: 'sub', index: 0, count: 1 });
      this.engine.lfos.forEach(function (l) {
        l.g.pitch.connect(so.detune);
        self.modConns.push([l.g.pitch, so.detune]);
      });
    }

    if (p.noise.level > 0) {
      let ns = ctx.createBufferSource();
      ns.buffer = this.engine.noiseBuffer;
      ns.loop = true;
      let nf = ctx.createBiquadFilter();
      nf.type = 'bandpass'; nf.frequency.value = 4500; nf.Q.value = 0.7;
      let ng = ctx.createGain(); ng.gain.value = p.noise.level * 0.5;
      ns.connect(nf); nf.connect(ng); ng.connect(this.mix);
      ns.start(t0);
      this.oscs.push(ns);
      this.noiseGain = ng;
    }

    this.envSrc = ctx.createConstantSource();
    this.envSrc.offset.value = 0;
    this.envSrc.start(t0);
    this.envSrc.connect(this.filter.frequency);
    this.modConns.push([this.envSrc, this.filter.frequency]);

    this.engine.lfos.forEach(function (l) {
      l.g.filter.connect(self.filter.frequency);
      l.g.reso.connect(self.filter.Q);
      l.g.amp.connect(self.trem.gain);
      self.modConns.push([l.g.filter, self.filter.frequency]);
      self.modConns.push([l.g.reso, self.filter.Q]);
      self.modConns.push([l.g.amp, self.trem.gain]);
    });

    this.setCutoff();
    this.startEnv(t0);
  };

  Voice.prototype.setCutoff = function () {
    let p = this.p, t = this.ctx.currentTime;
    let mult = Math.pow(2, ((this.note - 60) / 12) * p.filter.keytrack);
    let base = clamp(p.filter.cutoff * mult, 20, 20000);
    this.filter.type = p.filter.type;
    this.filter.frequency.setTargetAtTime(base, t, 0.015);
    this.filter.Q.setTargetAtTime(clamp(p.filter.reso, 0.0001, 30), t, 0.015);
  };

  Voice.prototype.startEnv = function (t0) {
    let p = this.p;
    let peak = Math.max(this.vel * 0.85, 0.0005);
    let sus = Math.max(peak * p.ampEnv.s, 0.0002);
    let a = Math.max(p.ampEnv.a, 0.002);
    let d = Math.max(p.ampEnv.d, 0.002);
    let g = this.amp.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(0.0001, t0);
    g.linearRampToValueAtTime(peak, t0 + a);
    g.setTargetAtTime(sus, t0 + a, d / 3);

    let fe = p.filtEnv;
    let amt = clamp(p.filter.envAmt, 0, 100) / 100;
    let fa = Math.max(fe.a, 0.002), fd = Math.max(fe.d, 0.002);
    let peakHz = clamp(this.filter.frequency.value + amt * 12000, 0, 20000);
    let susHz = clamp(this.filter.frequency.value + amt * fe.s * 12000, 0, 20000);
    let off = this.envSrc.offset;
    off.cancelScheduledValues(t0);
    off.setValueAtTime(0, t0);
    off.linearRampToValueAtTime(peakHz, t0 + fa);
    off.setTargetAtTime(susHz, t0 + fa, fd / 3);
  };

  Voice.prototype.updateSources = function () {
    let p = this.p, t = this.ctx.currentTime, base = mtof(this.note);
    for (let i = 0; i < this.oscNodes.length; i++) {
      let n = this.oscNodes[i];
      if (n.slot === 'sub') {
        n.gain.gain.setTargetAtTime(p.sub.level, t, 0.02);
        n.osc.frequency.setTargetAtTime(clamp(base * Math.pow(2, p.sub.octave), 10, 20000), t, 0.02);
        n.osc.detune.setTargetAtTime(this.engine.bend, t, 0.01);
        continue;
      }
      let cfg = p[n.slot];
      let spread = n.count > 1 ? ((n.index / (n.count - 1)) - 0.5) * 2 : 0;
      n.osc.type = WAVES.indexOf(cfg.type) >= 0 ? cfg.type : 'sawtooth';
      n.osc.frequency.setTargetAtTime(clamp(base * Math.pow(2, (cfg.octave * 12 + cfg.semi) / 12), 10, 20000), t, 0.02);
      n.osc.detune.setTargetAtTime(cfg.detune + spread * p.unison.detune + this.engine.bend, t, 0.02);
      n.gain.gain.setTargetAtTime((cfg.level / n.count) * (n.count > 1 ? 0.9 : 1), t, 0.02);
      if (n.panner) n.panner.pan.setTargetAtTime(clamp(spread * p.unison.width, -1, 1), t, 0.02);
    }
    if (this.noiseGain) this.noiseGain.gain.setTargetAtTime(p.noise.level * 0.5, t, 0.02);
  };

  Voice.prototype.release = function (fast, when) {
    if (this.stopped) return;
    this.stopped = true;
    let ctx = this.ctx;
    let t = when === undefined ? ctx.currentTime : Math.max(when, ctx.currentTime);
    let r = fast ? 0.02 : Math.max(this.p.ampEnv.r, 0.01);

    let g = this.amp.gain;
    let v;
    try { g.cancelAndHoldAtTime(t); }
    catch (e) { v = g.value; g.cancelScheduledValues(t); g.setValueAtTime(v, t); }
    g.setTargetAtTime(0.0001, t, r / 4);

    let off = this.envSrc.offset;
    try { off.cancelAndHoldAtTime(t); }
    catch (e2) { v = off.value; off.cancelScheduledValues(t); off.setValueAtTime(v, t); }
    off.setTargetAtTime(0, t, r / 4);

    let stopAt = t + r + 0.15;
    for (let i = 0; i < this.oscs.length; i++) { try { this.oscs[i].stop(stopAt); } catch (e3) {} }
    try { this.envSrc.stop(stopAt); } catch (e4) {}

    let self = this;
    let ms = Math.max((stopAt - ctx.currentTime) * 1000 + 120, 60);
    this._timer = setTimeout(function () { self.dispose(); }, ms);
  };

  Voice.prototype.dispose = function () {
    if (this._disposed) return;
    this._disposed = true;
    for (let i = 0; i < this.modConns.length; i++) {
      try { this.modConns[i][0].disconnect(this.modConns[i][1]); } catch (e) {}
    }
    [this.mix, this.filter, this.amp, this.trem, this.envSrc].forEach(function (n) {
      try { n.disconnect(); } catch (e) {}
    });
  };

  /* ----------------------------------------------------------------- Engine */

  function SynthEngine(patch) {
    this.ctx = null;
    this.patch = patch ? mergePatch(defaultPatch(), clone(patch)) : defaultPatch();
    this.voices = new Map();
    this.held = new Set();
    this.sustain = false;
    this.mod = 0;
    this.bend = 0;
    this.lastBaseFreq = 0;
    this.onVoices = null;
    this.dest = null;
    this.offline = false;
  }

  SynthEngine.prototype.setDestination = function (node) {
    this.dest = node || null;
    if (!this.ctx) return;
    try { this.analyser.disconnect(); } catch (e) { /* not connected yet */ }
    this.analyser.connect(this.dest || this.ctx.destination);
  };

  SynthEngine.prototype.start = function (ext) {
    if (this.ctx) {
      if (!this.offline && this.ctx.state === 'suspended' && this.ctx.resume) this.ctx.resume();
      return;
    }
    let AC = global.AudioContext || global.webkitAudioContext;
    let ctx;
    if (ext) {
      ctx = ext;
      this.offline = typeof ext.startRendering === 'function';
    } else {
      ctx = new AC({ latencyHint: 'interactive' });
      this.offline = false;
    }
    this.ctx = ctx;

    this.voiceBus = ctx.createGain(); this.voiceBus.gain.value = 1;

    /* drive */
    this.drivePre = ctx.createGain(); this.drivePre.gain.value = 1;
    this.shaper = ctx.createWaveShaper(); this.shaper.oversample = '4x';
    this.driveTone = ctx.createBiquadFilter(); this.driveTone.type = 'lowpass';
    this.drivePost = ctx.createGain(); this.drivePost.gain.value = 1;

    /* chorus */
    this.chorusIn = ctx.createGain();
    this.chorusDry = ctx.createGain(); this.chorusDry.gain.value = 1;
    this.chorusWet = ctx.createGain(); this.chorusWet.gain.value = 0;
    this.chorusD1 = ctx.createDelay(0.1); this.chorusD1.delayTime.value = 0.012;
    this.chorusD2 = ctx.createDelay(0.1); this.chorusD2.delayTime.value = 0.020;
    this.chorusLfo = ctx.createOscillator(); this.chorusLfo.type = 'sine'; this.chorusLfo.frequency.value = 0.4;
    this.chorusG1 = ctx.createGain(); this.chorusG1.gain.value = 0;
    this.chorusG2 = ctx.createGain(); this.chorusG2.gain.value = 0;
    this.chorusLfo.connect(this.chorusG1); this.chorusG1.connect(this.chorusD1.delayTime);
    this.chorusLfo.connect(this.chorusG2); this.chorusG2.connect(this.chorusD2.delayTime);
    this.chorusLfo.start();

    /* delay */
    this.delayIn = ctx.createGain();
    this.delayDry = ctx.createGain(); this.delayDry.gain.value = 1;
    this.delayNode = ctx.createDelay(2.0);
    this.delayFilt = ctx.createBiquadFilter(); this.delayFilt.type = 'lowpass'; this.delayFilt.frequency.value = 4200;
    this.delayFb = ctx.createGain();
    this.delayWet = ctx.createGain();

    /* reverb */
    this.revIn = ctx.createGain();
    this.convolver = ctx.createConvolver();
    this.revDry = ctx.createGain(); this.revDry.gain.value = 1;
    this.revWet = ctx.createGain();

    /* master */
    this.master = ctx.createGain();
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.25;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.voiceBus.connect(this.drivePre);
    this.drivePre.connect(this.shaper);
    this.shaper.connect(this.driveTone);
    this.driveTone.connect(this.drivePost);
    this.drivePost.connect(this.chorusIn);

    this.chorusIn.connect(this.chorusDry); this.chorusDry.connect(this.delayIn);
    this.chorusIn.connect(this.chorusD1); this.chorusD1.connect(this.chorusWet);
    this.chorusIn.connect(this.chorusD2); this.chorusD2.connect(this.chorusWet);
    this.chorusWet.connect(this.delayIn);

    this.delayIn.connect(this.delayDry); this.delayDry.connect(this.revIn);
    this.delayIn.connect(this.delayNode);
    this.delayNode.connect(this.delayFilt);
    this.delayFilt.connect(this.delayFb);
    this.delayFb.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);
    this.delayWet.connect(this.revIn);

    this.revIn.connect(this.revDry); this.revDry.connect(this.master);
    this.revIn.connect(this.convolver); this.convolver.connect(this.revWet); this.revWet.connect(this.master);

    this.master.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.analyser.connect(this.dest || ctx.destination);

    /* LFOs: one oscillator per LFO, four parallel target gains (0 = inactive) */
    let self = this;
    this.lfos = [0, 1].map(function () {
      let osc = ctx.createOscillator();
      let g = {};
      LFO_TARGETS.forEach(function (t) {
        let x = ctx.createGain(); x.gain.value = 0;
        osc.connect(x);
        g[t] = x;
      });
      osc.start();
      return { osc: osc, g: g };
    });

    /* white-noise loop for the noise source */
    let len = Math.floor(ctx.sampleRate * 2);
    let nb = ctx.createBuffer(1, len, ctx.sampleRate);
    let nd = nb.getChannelData(0);
    for (let i = 0; i < len; i++) nd[i] = Math.random() * 2 - 1;
    this.noiseBuffer = nb;

    this.applyAll();
  };

  SynthEngine.prototype.makeIR = function (seconds) {
    let ctx = this.ctx, rate = ctx.sampleRate;
    let len = Math.max(64, Math.floor(rate * clamp(seconds, 0.15, 10)));
    let buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      let d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        let t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6);
      }
    }
    return buf;
  };

  SynthEngine.prototype.updateDrive = function () {
    let p = this.patch, t = this.ctx.currentTime;
    let amt = clamp(p.drive.amount, 0, 1);
    let n = 1024, curve = new Float32Array(n);
    let g = 1 + amt * 60;
    let norm = Math.tanh(g);
    for (let i = 0; i < n; i++) {
      let x = (i / (n - 1)) * 2 - 1;
      curve[i] = x * (1 - amt) + (Math.tanh(x * g) / norm) * amt;
    }
    this.shaper.curve = curve;
    this.driveTone.frequency.setTargetAtTime(700 + p.drive.tone * p.drive.tone * 19000, t, 0.02);
    this.drivePost.gain.setTargetAtTime(1 / (1 + amt * 0.7), t, 0.02);
  };

  SynthEngine.prototype.updateChorus = function () {
    let p = this.patch, t = this.ctx.currentTime;
    let d = clamp(p.chorus.depth, 0, 1), m = clamp(p.chorus.mix, 0, 1);
    this.chorusLfo.frequency.setTargetAtTime(clamp(p.chorus.rate, 0.05, 12), t, 0.05);
    this.chorusG1.gain.setTargetAtTime(d * 0.006, t, 0.05);
    this.chorusG2.gain.setTargetAtTime(d * 0.009, t, 0.05);
    this.chorusWet.gain.setTargetAtTime(m * 0.9, t, 0.05);
  };

  SynthEngine.prototype.updateDelay = function () {
    let p = this.patch, t = this.ctx.currentTime;
    let m = clamp(p.delay.mix, 0, 1);
    this.delayNode.delayTime.setTargetAtTime(clamp(p.delay.time, 0.005, 2), t, 0.05);
    this.delayFb.gain.setTargetAtTime(clamp(p.delay.feedback, 0, 0.95), t, 0.05);
    this.delayWet.gain.setTargetAtTime(m, t, 0.05);
  };

  SynthEngine.prototype.updateReverb = function () {
    let self = this, p = this.patch, t = this.ctx.currentTime;
    this.revWet.gain.setTargetAtTime(clamp(p.reverb.mix, 0, 1), t, 0.05);
    let build = function () {
      if (self.ctx) self.convolver.buffer = self.makeIR(p.reverb.size);
    };
    clearTimeout(this._revTimer);
    if (!this.convolver.buffer) { build(); return; }
    this._revTimer = setTimeout(build, 140);
  };

  SynthEngine.prototype.updateMaster = function () {
    let p = this.patch, t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(clamp(p.master.volume, 0, 1), t, 0.03);
  };

  SynthEngine.prototype.updateLfos = function () {
    let p = this.patch, t = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      let cfg = p['lfo' + (i + 1)];
      let L = this.lfos[i];
      let d = clamp(cfg.depth + (i === 0 ? this.mod * 100 : 0), 0, 100) / 100;
      L.osc.type = WAVES.indexOf(cfg.wave) >= 0 ? cfg.wave : 'sine';
      L.osc.frequency.setTargetAtTime(clamp(cfg.rate, 0.01, 60), t, 0.02);
      let vals = { filter: d * 5000, pitch: d * 1200, amp: d * 0.5, reso: d * 20 };
      for (let k = 0; k < LFO_TARGETS.length; k++) {
        let name = LFO_TARGETS[k];
        L.g[name].gain.setTargetAtTime(name === cfg.target ? vals[name] : 0, t, 0.02);
      }
    }
  };

  SynthEngine.prototype.apply = function (path) {
    if (!this.ctx) return;
    let head = String(path).split('.')[0];
    if (head === 'filter' || head === 'filtEnv') {
      this.voices.forEach(function (v) { v.setCutoff(); });
    } else if (head === 'lfo1' || head === 'lfo2') {
      this.updateLfos();
    } else if (head === 'osc1' || head === 'osc2' || head === 'sub' || head === 'noise' || head === 'unison') {
      this.voices.forEach(function (v) { v.updateSources(); });
    } else if (head === 'drive') {
      this.updateDrive();
    } else if (head === 'chorus') {
      this.updateChorus();
    } else if (head === 'delay') {
      this.updateDelay();
    } else if (head === 'reverb') {
      this.updateReverb();
    } else if (head === 'master') {
      this.updateMaster();
    }
  };

  SynthEngine.prototype.applyAll = function () {
    if (!this.ctx) return;
    this.updateDrive();
    this.updateChorus();
    this.updateDelay();
    this.updateReverb();
    this.updateMaster();
    this.updateLfos();
    this.voices.forEach(function (v) { v.setCutoff(); v.updateSources(); });
  };

  SynthEngine.prototype.emit = function () {
    if (this.onVoices) this.onVoices(this.voices.size);
  };

  SynthEngine.prototype.noteOn = function (note, vel, when) {
    this.start();
    note = clamp(Math.round(note), 0, 127);
    if (this.voices.has(note)) {
      let old = this.voices.get(note);
      this.voices.delete(note);
      old.release(true);
    }
    let max = clamp(Math.round(this.patch.master.poly), 1, 24);
    if (this.voices.size >= max) {
      let oldest = null;
      this.voices.forEach(function (v) {
        if (!oldest || v.born < oldest.born) oldest = v;
      });
      if (oldest) { this.voices.delete(oldest.note); oldest.release(true); }
    }
    let v = new Voice(this, note, vel === undefined ? 0.9 : vel, when);
    this.voices.set(note, v);
    this.held.add(note);
    this.lastBaseFreq = mtof(note);
    this.emit();
  };

  SynthEngine.prototype.noteOff = function (note, when) {
    note = clamp(Math.round(note), 0, 127);
    this.held.delete(note);
    if (this.sustain) { this.emit(); return; }
    let v = this.voices.get(note);
    if (v) { this.voices.delete(note); v.release(false, when); }
    this.emit();
  };

  SynthEngine.prototype.setSustain = function (on) {
    this.sustain = !!on;
    if (!this.sustain) {
      let self = this;
      Array.from(this.voices.keys()).forEach(function (n) {
        if (!self.held.has(n)) {
          let v = self.voices.get(n);
          self.voices.delete(n);
          v.release();
        }
      });
    }
    this.emit();
  };

  SynthEngine.prototype.allNotesOff = function () {
    let self = this;
    Array.from(this.voices.values()).forEach(function (v) { v.release(true); });
    this.voices.clear();
    this.held.clear();
    this.emit();
  };

  SynthEngine.prototype.setMod = function (v) {
    this.mod = clamp(v, 0, 1);
    if (this.ctx) this.updateLfos();
  };

  SynthEngine.prototype.setBend = function (cents) {
    this.bend = clamp(cents, -1200, 1200);
    if (this.ctx) this.voices.forEach(function (v) { v.updateSources(); });
  };

  global.SynthLab = {
    SynthEngine: SynthEngine,
    defaultPatch: defaultPatch,
    mergePatch: mergePatch,
    clone: clone,
    clamp: clamp,
    mtof: mtof,
    WAVES: WAVES,
    FILTERS: FILTERS,
    LFO_TARGETS: LFO_TARGETS
  };
})(window);
