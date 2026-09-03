/* SYNTH LAB — UI: composer, tracks, piano roll, patch editor, persistence */
(function () {
  'use strict';

  const SL = window.SynthLab;
  const clamp = SL.clamp;
  const $ = (s) => document.querySelector(s);

  const LS_PRESETS = 'synthlab.presets.v1';
  const LS_SLOTS = 'synthlab.slots.v1';
  const LS_STATE = 'synthlab.state.v1';
  const LS_SONGS = 'synthlab.songs.v1';
  const LS_SESSION = 'synthlab.session.v1';

  let song = null;
  let composer = null;
  let roll = null;
  let selTrack = 0;
  let patch = SL.defaultPatch();
  let view = 'compose';
  let recording = false;
  let dirty = false;
  let userPresets = [];
  let savedSongs = [];
  let slots = { A: null, B: null, active: 'A' };
  const controls = [];

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let baseOctave = 3;
  let baseNote = 48;

  /* --------------------------------------------------------- utilities */

  function getPath(obj, path) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length; i++) {
      if (o == null) return undefined;
      o = o[parts[i]];
    }
    return o;
  }

  function setPath(obj, path, value) {
    const parts = path.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }

  function fmtVal(c, v) {
    if (c.step && c.step >= 1) return (v > 0 ? '+' : '') + Math.round(v);
    switch (c.unit) {
      case 'Hz': return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 1 : 2) + 'k' : String(Math.round(v));
      case 'ms': return v >= 1 ? v.toFixed(2) + 's' : Math.round(v * 1000) + 'ms';
      case 'sec': return v.toFixed(2) + 's';
      case '%': return Math.round(v * 100) + '%';
      case 'ct': return Math.round(v) + 'ct';
      default: return v.toFixed(c.dec === undefined ? 2 : c.dec);
    }
  }

  function toNorm(c, v) {
    if (c.curve === 'log') {
      const lo = Math.log(Math.max(c.min, 1e-6));
      const hi = Math.log(Math.max(c.max, 1e-6));
      return clamp((Math.log(Math.max(v, c.min)) - lo) / (hi - lo), 0, 1);
    }
    return clamp((v - c.min) / (c.max - c.min), 0, 1);
  }

  function fromNorm(c, n) {
    let v;
    if (c.curve === 'log') {
      const lo = Math.log(Math.max(c.min, 1e-6));
      const hi = Math.log(Math.max(c.max, 1e-6));
      v = Math.exp(lo + n * (hi - lo));
    } else {
      v = c.min + n * (c.max - c.min);
    }
    if (c.step) v = Math.round(v / c.step) * c.step;
    if (c.unit === 'Hz' && v >= 1000) v = Math.round(v / 10) * 10;
    return clamp(v, c.min, c.max);
  }

  let toastTimer = null;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function download(name, data) {
    const blob = (data instanceof Blob) ? data
      : new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* ------------------------------------------------------ song plumbing */

  function currentTrack() {
    return song && song.tracks[selTrack] ? song.tracks[selTrack] : null;
  }

  function visibleIndices() {
    if (!song) return [];
    const out = [];
    song.tracks.forEach((t, i) => { if (t.show) out.push(i); });
    return out;
  }

  function applyScale() {
    if (!roll || !song) return;
    roll.setScale(song.scaleRoot, song.scaleType, song.scaleSnap);
  }

  function syncRollVisible() {
    if (!roll) return;
    roll.setVisible(visibleIndices());
    updateSelReadout();
  }

  function currentEngine() {
    return composer ? (composer.engines[selTrack] || null) : null;
  }

  function syncPatchRef() {
    const t = currentTrack();
    if (t) patch = t.patch;
  }

  function setDirty(v) {
    dirty = !!v;
    $('#songName').classList.toggle('dirty', dirty);
    $('#songName').title = dirty ? 'unsaved changes' : 'saved';
    $('#dirtyDot').hidden = !dirty;
  }

  const markDirty = () => setDirty(true);

  function reindex() {
    if (!song) return;
    song.tracks.forEach((t) => {
      SL.indexTrack(song, t);
    });
  }

  function cleanSong(s) {
    return {
      name: s.name,
      bpm: s.bpm,
      swing: s.swing,
      scaleRoot: s.scaleRoot,
      scaleType: s.scaleType,
      scaleSnap: s.scaleSnap,
      bars: s.bars,
      stepsPerBar: s.stepsPerBar,
      masterVolume: s.masterVolume,
      tracks: s.tracks.map((t) => ({
        name: t.name,
        patch: t.patch,
        volume: t.volume,
        pan: t.pan,
        mute: t.mute,
        solo: t.solo,
        show: t.show,
        notes: t.notes.map((n) => ({ step: n.step, len: n.len, pitch: n.pitch, vel: n.vel }))
      }))
    };
  }

  function normalizeSong(raw) {
    const s = SL.newSong();
    if (!raw || typeof raw !== 'object') return s;
    s.name = String(raw.name || 'Untitled');
    s.bpm = clamp(Number(raw.bpm) || 120, 40, 240);
    s.swing = clamp(Number(raw.swing) || 0, 0, 0.7);
    s.scaleRoot = clamp(Math.round(Number(raw.scaleRoot) || 0), 0, 11);
    s.scaleType = (SL.SCALES && SL.SCALES[raw.scaleType]) ? raw.scaleType : 'chromatic';
    s.scaleSnap = !!raw.scaleSnap;
    s.bars = [1, 2, 4, 8, 16, 32, 64].indexOf(Number(raw.bars)) >= 0 ? Number(raw.bars) : 2;
    s.masterVolume = clamp(raw.masterVolume === undefined ? 0.85 : Number(raw.masterVolume), 0, 1);
    s.tracks = (Array.isArray(raw.tracks) ? raw.tracks : []).map((t, ti) => {
      const trkPatch = SL.mergePatch(SL.defaultPatch(), (t && t.patch) || {});
      /* older files / the MCP server keep the arp config on the track, the
         rack UI on the patch — fold both into the patch so they agree */
      if (t && t.arp) trkPatch.arp = Object.assign({}, trkPatch.arp, t.arp);
      return {
        name: String((t && t.name) || 'Track'),
        patch: trkPatch,
        volume: clamp(t.volume === undefined ? 0.9 : Number(t.volume), 0, 1),
        pan: clamp(Number(t.pan) || 0, -1, 1),
        mute: !!t.mute,
        solo: !!t.solo,
        show: t.show === undefined ? undefined : !!t.show,
        notes: (Array.isArray(t.notes) ? t.notes : []).map((n) => ({
          step: Math.max(0, Math.round(Number(n.step) || 0)),
          len: Math.max(1, Math.round(Number(n.len) || 1)),
          pitch: clamp(Math.round(Number(n.pitch) || 60), 0, 127),
          vel: clamp(n.vel === undefined ? 0.9 : Number(n.vel), 0.05, 1)
        }))
      };
    });
    /* older songs have no show flag: default to the first track only */
    s.tracks.forEach((t, ti) => { if (t.show === undefined) t.show = ti === 0; });
    return s;
  }

  function loadSong(raw, opts) {
    const o = opts || {};
    composerStop();
    song = normalizeSong(raw);
    selTrack = Math.min(selTrack, Math.max(0, song.tracks.length - 1));
    composer = new SL.Composer(song);
    syncPatchRef();
    reindex();
    $('#songName').value = song.name;
    $('#bpm').value = song.bpm;
    $('#swing').value = song.swing;
    $('#bars').value = String(song.bars);
    $('#masterVol').value = song.masterVolume;
    history.undo.length = 0;
    history.redo.length = 0;
    $('#scaleRoot').value = String(song.scaleRoot);
    $('#scaleType').value = song.scaleType;
    $('#scaleSnap').checked = !!song.scaleSnap;
    renderTracks();
    roll.setSong(song, selTrack, visibleIndices());
    applyScale();
    updateSelReadout();
    refreshControls();
    saveSession();
    roll.revealTrack();
    if (o.announce) toast('loaded "' + song.name + '"');
  }

  /* --------------------------------------------------------- parameters */

  function setParam(path, value, fromUi) {
    setPath(patch, path, value);
    const eng = currentEngine();
    if (eng) eng.apply(path);
    if (!fromUi) refreshControls(path);
    markDirty();
    saveSession();
  }

  function refreshControls(path) {
    controls.forEach((c) => {
      if (!path || c.path === path) c.refresh();
    });
  }

  /* ----------------------------------------------------------- controls */

  function makeKnob(c) {
    const el = document.createElement('div');
    el.className = 'knob';
    el.tabIndex = 0;
    el.innerHTML =
      '<div class="knob-body">' +
      '<div class="knob-arc"></div>' +
      '<div class="knob-face"><i class="knob-ptr"></i></div>' +
      '</div>' +
      '<div class="knob-label"></div>' +
      '<div class="knob-val"></div>';
    el.querySelector('.knob-label').textContent = t(c.i18n || '', c.label);
    const valEl = el.querySelector('.knob-val');
    el.dataset.tip = I18N.tip(c.path, c.info);
    el.dataset.tipTitle = t(c.i18n || '', c.label);
    el.dataset.tipValue = 'live';

    const paint = (v) => {
      const n = toNorm(c, v);
      el.style.setProperty('--n', n.toFixed(4));
      valEl.textContent = fmtVal(c, v);
    };
    const commit = (v) => {
      paint(v);
      setParam(c.path, v, true);
    };

    let dragging = false;
    let startY = 0;
    let startNorm = 0;

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      composerEnsure();
      Tip.hide();
      dragging = true;
      startY = e.clientY;
      startNorm = toNorm(c, getPath(patch, c.path));
      el.setPointerCapture(e.pointerId);
      el.classList.add('active');
      e.preventDefault();
    });
    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const scale = e.shiftKey ? 900 : 200;
      commit(fromNorm(c, clamp(startNorm + (startY - e.clientY) / scale, 0, 1)));
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('active');
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('dblclick', () => commit(c.def));
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      commit(fromNorm(c, clamp(toNorm(c, getPath(patch, c.path)) - Math.sign(e.deltaY) * 0.02, 0, 1)));
    }, { passive: false });
    el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 0.005 : 0.02;
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { commit(fromNorm(c, clamp(toNorm(c, getPath(patch, c.path)) + step, 0, 1))); e.preventDefault(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { commit(fromNorm(c, clamp(toNorm(c, getPath(patch, c.path)) - step, 0, 1))); e.preventDefault(); }
    });

    controls.push({ path: c.path, refresh: () => paint(getPath(patch, c.path)) });
    paint(getPath(patch, c.path));
    return el;
  }

  function makeSeg(c) {
    const el = document.createElement('div');
    el.className = 'seg';
    el.innerHTML = '<div class="seg-label"></div><div class="seg-row"></div>';
    el.querySelector('.seg-label').textContent = t(c.i18n || '', c.label);
    el.dataset.tip = I18N.tip(c.path, c.info);
    el.dataset.tipTitle = t(c.i18n || '', c.label);
    const row = el.querySelector('.seg-row');
    const btns = c.options.map((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn';
      b.textContent = o.label;
      const optKey = 'opt.' + (o.value === true ? 'true' : (o.value === false ? 'false' : o.value));
      if (o.tip || I18N.TIPS[optKey]) b.dataset.tip = I18N.tip(optKey, o.tip);
      b.addEventListener('click', () => {
        composerEnsure();
        setParam(c.path, o.value);
        refreshControls(c.path);
      });
      row.appendChild(b);
      return { btn: b, value: o.value };
    });
    const entry = {
      path: c.path,
      refresh: () => {
        const v = getPath(patch, c.path);
        btns.forEach((b) => { b.btn.classList.toggle('on', b.value === v); });
      }
    };
    controls.push(entry);
    entry.refresh();
    return el;
  }

  const WAVE_OPTS = [
    { label: 'sin', value: 'sine', tip: 'Sine — one harmonic, pure and hollow. Good for subs.' },
    { label: 'tri', value: 'triangle', tip: 'Triangle — soft odd harmonics, like a mellow flute.' },
    { label: 'saw', value: 'sawtooth', tip: 'Sawtooth — all harmonics, bright. The default synth tone.' },
    { label: 'sqr', value: 'square', tip: 'Square — odd harmonics only, hollow and reedy.' }
  ];
  const FILTER_OPTS = [
    { label: 'LP', value: 'lowpass', tip: 'Low pass — keeps lows, rolls off highs.' },
    { label: 'HP', value: 'highpass', tip: 'High pass — keeps highs, removes lows. Thins things out.' },
    { label: 'BP', value: 'bandpass', tip: 'Band pass — keeps a narrow band around the cutoff.' },
    { label: 'NT', value: 'notch', tip: 'Notch — removes a narrow band around the cutoff.' }
  ];
  const TARGET_OPTS = [
    { label: 'cut', value: 'filter', tip: 'Cutoff — sweeps the filter (the classic wobble).' },
    { label: 'pitch', value: 'pitch', tip: 'Pitch — vibrato, up to ±12 semitones.' },
    { label: 'amp', value: 'amp', tip: 'Amp — tremolo, volume pulsing.' },
    { label: 'res', value: 'reso', tip: 'Resonance — animates the filter peak (up to +20 Q).' }
  ];

  const C_ORANGE = '#ff8a3d';
  const C_YELLOW = '#ffd23d';
  const C_GREEN = '#5fe0a8';
  const C_BLUE = '#7cc4ff';
  const C_PURPLE = '#c792ea';
  const C_PINK = '#ff6b8b';

  const ARP_ON_OPTS = [
    { label: 'off', value: false, tip: 'Arp off — the track plays exactly what is written.' },
    { label: 'on', value: true, tip: 'Arp on — written notes become the chord, the arp plays the rhythm.' }
  ];
  const ARP_PAT_OPTS = [
    { label: 'up', value: 'up', tip: 'Lowest to highest.' },
    { label: 'down', value: 'down', tip: 'Highest to lowest.' },
    { label: 'bounce', value: 'updown', tip: 'Up then back down, without repeating the ends.' },
    { label: 'rand', value: 'random', tip: 'Pseudo-random, but the same every loop.' },
    { label: 'as is', value: 'as', tip: 'The order you wrote the notes in.' }
  ];

  const PANELS = [
    { title: 'OSC 1', i18n: 'pOsc1', accent: C_ORANGE, controls: [
      { t: 'seg', path: 'osc1.type', label: 'Wave', i18n: 'wave', options: WAVE_OPTS,
        info: 'Waveform: sine is pure, triangle soft, sawtooth bright, square hollow.' },
      { t: 'knob', path: 'osc1.octave', label: 'Octave', i18n: 'octave', min: -3, max: 3, step: 1,
        info: 'Transposes oscillator 1 up or down in whole octaves.' },
      { t: 'knob', path: 'osc1.semi', label: 'Semi', i18n: 'semi', min: -24, max: 24, step: 1,
        info: 'Transposition in semitones. Stack a fifth (+7) for a power chord.' },
      { t: 'knob', path: 'osc1.detune', label: 'Detune', i18n: 'detune', min: -50, max: 50, unit: 'ct',
        info: 'Offset in cents (100 cents = 1 semitone). Detune against osc 2 for width.' },
      { t: 'knob', path: 'osc1.level', label: 'Level', i18n: 'level', min: 0, max: 1,
        info: 'How much oscillator 1 feeds the filter.' }
    ] },
    { title: 'OSC 2', i18n: 'pOsc2', accent: C_ORANGE, controls: [
      { t: 'seg', path: 'osc2.type', label: 'Wave', i18n: 'wave', options: WAVE_OPTS,
        info: 'Waveform: sine is pure, triangle soft, sawtooth bright, square hollow.' },
      { t: 'knob', path: 'osc2.octave', label: 'Octave', i18n: 'octave', min: -3, max: 3, step: 1,
        info: 'Transposes oscillator 2 up or down in whole octaves.' },
      { t: 'knob', path: 'osc2.semi', label: 'Semi', i18n: 'semi', min: -24, max: 24, step: 1,
        info: 'Transposition in semitones. Stack a fifth (+7) for a power chord.' },
      { t: 'knob', path: 'osc2.detune', label: 'Detune', i18n: 'detune', min: -50, max: 50, unit: 'ct',
        info: 'Offset in cents (100 cents = 1 semitone). Detune against osc 1 for width.' },
      { t: 'knob', path: 'osc2.level', label: 'Level', i18n: 'level', min: 0, max: 1,
        info: 'How much oscillator 2 feeds the filter.' }
    ] },
    { title: 'MIX', i18n: 'pMix', accent: C_ORANGE, controls: [
      { t: 'knob', path: 'sub.level', label: 'Sub', i18n: 'subLevel', min: 0, max: 1,
        info: 'A sine below the played note. Adds weight without muddying the mids.' },
      { t: 'knob', path: 'sub.octave', label: 'Sub Oct', i18n: 'subOctave', min: -2, max: 0, step: 1,
        info: 'How many octaves below the played note the sub sine sits.' },
      { t: 'knob', path: 'noise.level', label: 'Noise', i18n: 'noise', min: 0, max: 1,
        info: 'Band-passed white noise: air, breath, hats and percussion.' },
      { t: 'knob', path: 'glide', label: 'Glide', i18n: 'glide', min: 0.001, max: 1, curve: 'log', unit: 'ms',
        info: 'Portamento: the pitch slides from the previous note into the new one.' }
    ] },
    { title: 'UNISON', i18n: 'pUnison', accent: C_ORANGE, controls: [
      { t: 'knob', path: 'unison.voices', label: 'Voices', i18n: 'unisonVoices', min: 1, max: 5, step: 1,
        info: 'Detuned copies per oscillator. More is fatter, and costs more CPU.' },
      { t: 'knob', path: 'unison.detune', label: 'Detune', i18n: 'detune', min: 0, max: 50, unit: 'ct',
        info: 'Spread between the unison voices, in cents.' },
      { t: 'knob', path: 'unison.width', label: 'Width', i18n: 'width', min: 0, max: 1, unit: '%',
        info: 'How far the unison voices spread across the stereo field.' }
    ] },
    { title: 'FILTER', i18n: 'pFilter', accent: C_YELLOW, wide: true, controls: [
      { t: 'seg', path: 'filter.type', label: 'Type', i18n: 'filterType', options: FILTER_OPTS,
        info: 'LP removes highs, HP removes lows, BP keeps a band, NT cuts a band out.' },
      { t: 'knob', path: 'filter.cutoff', label: 'Cutoff', i18n: 'cutoff', min: 20, max: 18000, curve: 'log', unit: 'Hz',
        info: 'Corner frequency of the filter. Lower is darker, higher is brighter.' },
      { t: 'knob', path: 'filter.reso', label: 'Reso', i18n: 'reso', min: 0.1, max: 24,
        info: 'Peak at the cutoff. High values ring out and can self-oscillate.' },
      { t: 'knob', path: 'filter.keytrack', label: 'Key Trk', i18n: 'keytrack', min: 0, max: 1, unit: '%',
        info: 'How much the cutoff follows the played pitch, so timbre stays even.' },
      { t: 'knob', path: 'filter.envAmt', label: 'Env Amt', i18n: 'envAmt', min: 0, max: 100, unit: '%',
        info: 'How far the filter envelope opens the cutoff, up to +12 kHz.' }
    ] },
    { title: 'FILTER ENV', i18n: 'pFiltEnv', accent: C_GREEN, controls: [
      { t: 'knob', path: 'filtEnv.a', label: 'Attack', i18n: 'attack', min: 0.002, max: 4, curve: 'log', unit: 'ms',
        info: 'How fast the cutoff sweeps up to its peak.' },
      { t: 'knob', path: 'filtEnv.d', label: 'Decay', i18n: 'decay', min: 0.002, max: 4, curve: 'log', unit: 'ms',
        info: 'How fast the cutoff falls back to its sustain level.' },
      { t: 'knob', path: 'filtEnv.s', label: 'Sustain', i18n: 'sustain', min: 0, max: 1,
        info: 'Cutoff offset held while the key is down.' }
    ] },
    { title: 'AMP ENV', i18n: 'pAmpEnv', accent: C_GREEN, controls: [
      { t: 'knob', path: 'ampEnv.a', label: 'Attack', i18n: 'attack', min: 0.001, max: 4, curve: 'log', unit: 'ms',
        info: 'Fade-in time. Slow attacks make pads, fast ones make plucks.' },
      { t: 'knob', path: 'ampEnv.d', label: 'Decay', i18n: 'decay', min: 0.002, max: 4, curve: 'log', unit: 'ms',
        info: 'Time to fall from the peak down to the sustain level.' },
      { t: 'knob', path: 'ampEnv.s', label: 'Sustain', i18n: 'sustain', min: 0, max: 1,
        info: 'Level held while the key is down. Zero gives a percussive hit.' },
      { t: 'knob', path: 'ampEnv.r', label: 'Release', i18n: 'release', min: 0.005, max: 8, curve: 'log', unit: 'ms',
        info: 'Fade-out after you release the key.' }
    ] },
    { title: 'LFO 1', i18n: 'pLfo1', accent: C_BLUE, controls: [
      { t: 'seg', path: 'lfo1.wave', label: 'Wave', i18n: 'wave', options: WAVE_OPTS,
        info: 'Shape of the modulation cycle.' },
      { t: 'seg', path: 'lfo1.target', label: 'Target', i18n: 'target', options: TARGET_OPTS,
        info: 'What gets modulated: cutoff, pitch (vibrato), amp (tremolo) or resonance.' },
      { t: 'knob', path: 'lfo1.rate', label: 'Rate', i18n: 'rate', min: 0.05, max: 30, curve: 'log', unit: 'Hz',
        info: 'Cycles per second. Below ~20 Hz you hear it, above that it becomes FM.' },
      { t: 'knob', path: 'lfo1.depth', label: 'Depth', i18n: 'depth', min: 0, max: 100, unit: '%',
        info: 'Modulation amount. A MIDI mod wheel (CC1) adds to LFO 1.' }
    ] },
    { title: 'LFO 2', i18n: 'pLfo2', accent: C_BLUE, controls: [
      { t: 'seg', path: 'lfo2.wave', label: 'Wave', i18n: 'wave', options: WAVE_OPTS,
        info: 'Shape of the modulation cycle.' },
      { t: 'seg', path: 'lfo2.target', label: 'Target', i18n: 'target', options: TARGET_OPTS,
        info: 'What gets modulated: cutoff, pitch (vibrato), amp (tremolo) or resonance.' },
      { t: 'knob', path: 'lfo2.rate', label: 'Rate', i18n: 'rate', min: 0.05, max: 30, curve: 'log', unit: 'Hz',
        info: 'Cycles per second. Below ~20 Hz you hear it, above that it becomes FM.' },
      { t: 'knob', path: 'lfo2.depth', label: 'Depth', i18n: 'depth', min: 0, max: 100, unit: '%',
        info: 'Modulation amount, independent of LFO 1.' }
    ] },
    { title: 'DRIVE', i18n: 'pDrive', accent: C_PURPLE, controls: [
      { t: 'knob', path: 'drive.amount', label: 'Amount', i18n: 'amount', min: 0, max: 1, unit: '%',
        info: 'Soft saturation before the effects. Adds harmonics, warmth and glue.' },
      { t: 'knob', path: 'drive.tone', label: 'Tone', i18n: 'tone', min: 0, max: 1, unit: '%',
        info: 'Lowpass after the distortion, to tame fizz.' }
    ] },
    { title: 'CHORUS', i18n: 'pChorus', accent: C_PURPLE, controls: [
      { t: 'knob', path: 'chorus.rate', label: 'Rate', i18n: 'rate', min: 0.05, max: 8, curve: 'log', unit: 'Hz',
        info: 'How fast the chorus delay lines wobble.' },
      { t: 'knob', path: 'chorus.depth', label: 'Depth', i18n: 'depth', min: 0, max: 1, unit: '%',
        info: 'How far they wobble. More detune, more shimmer.' },
      { t: 'knob', path: 'chorus.mix', label: 'Mix', i18n: 'mix', min: 0, max: 1, unit: '%',
        info: 'Balance between the dry signal and the chorus.' }
    ] },
    { title: 'DELAY', i18n: 'pDelay', accent: C_PURPLE, controls: [
      { t: 'knob', path: 'delay.time', label: 'Time', i18n: 'time', min: 0.01, max: 1.5, curve: 'log', unit: 'ms',
        info: 'Echo spacing. Dotted eighths (a beat and a half) sit well under most parts.' },
      { t: 'knob', path: 'delay.feedback', label: 'Fdbk', i18n: 'feedback', min: 0, max: 0.95, unit: '%',
        info: 'How much echo returns. High values build long, decaying tails.' },
      { t: 'knob', path: 'delay.mix', label: 'Mix', i18n: 'mix', min: 0, max: 1, unit: '%',
        info: 'Echo loudness against the dry signal.' }
    ] },
    { title: 'REVERB', i18n: 'pReverb', accent: C_PURPLE, controls: [
      { t: 'knob', path: 'reverb.size', label: 'Size', i18n: 'size', min: 0.2, max: 8, curve: 'log', unit: 'sec',
        info: 'Length of the generated reverb tail, in seconds.' },
      { t: 'knob', path: 'reverb.mix', label: 'Mix', i18n: 'mix', min: 0, max: 1, unit: '%',
        info: 'Reverb loudness against the dry signal.' }
    ] },
    { title: 'ARPEGGIATOR', i18n: 'pArp', accent: C_BLUE, wide: true, controls: [
      { t: 'seg', path: 'arp.on', label: 'Arp', i18n: 'arpOn', options: ARP_ON_OPTS,
        info: 'Play the notes written on this track one at a time, as a running pattern. Write the chord, the arp plays the rhythm.' },
      { t: 'seg', path: 'arp.pattern', label: 'Pattern', i18n: 'pattern', options: ARP_PAT_OPTS,
        info: 'Which way the arpeggio walks through the chord: up, down, up-then-down, random, or the order you wrote it.' },
      { t: 'knob', path: 'arp.rate', label: 'Rate', i18n: 'rate', min: 1, max: 16, step: 1, unit: 'st',
        info: 'How often a new note fires, in steps. 1 = every 16th, 2 = every 8th, 4 = every beat.' },
      { t: 'knob', path: 'arp.octaves', label: 'Octaves', i18n: 'octaves', min: 1, max: 4, step: 1,
        info: 'How many octaves the pattern climbs through before repeating.' },
      { t: 'knob', path: 'arp.gate', label: 'Gate', i18n: 'gate', min: 10, max: 100, unit: '%',
        info: 'Note length as a share of one arp step. Short is staccato, long is legato.' }
    ] },
    { title: 'MASTER', i18n: 'pMaster', accent: C_PINK, controls: [
      { t: 'knob', path: 'master.volume', label: 'Volume', i18n: 'volume', min: 0, max: 1, unit: '%',
        info: 'This patch\'s level, before the song master fader.' },
      { t: 'knob', path: 'master.poly', label: 'Poly', i18n: 'poly', min: 1, max: 24, step: 1,
        info: 'Maximum simultaneous voices for this patch.' }
    ] }
  ];


  function buildRack() {
    const rack = $('#rack');
    PANELS.forEach((p) => {
      const sec = document.createElement('section');
      sec.className = 'panel' + (p.wide ? ' panel--wide' : '');
      sec.style.setProperty('--acc', p.accent);
      const h = document.createElement('h2');
      h.className = 'panel-title';
      h.textContent = t(p.i18n || '', p.title);
      sec.appendChild(h);
      const body = document.createElement('div');
      body.className = 'panel-body';
      p.controls.forEach((c) => {
        c.def = getPath(SL.defaultPatch(), c.path);
        body.appendChild(c.t === 'seg' ? makeSeg(c) : makeKnob(c));
      });
      sec.appendChild(body);
      rack.appendChild(sec);
    });
    rack.appendChild(buildScope());
  }

  function buildScope() {
    const sec = document.createElement('section');
    sec.className = 'panel panel--wide panel--scope';
    sec.style.setProperty('--acc', C_GREEN);
    sec.innerHTML =
      '<h2 class="panel-title">ANALYSER</h2>' +
      '<div class="panel-body scope-body">' +
      '<canvas id="scope" class="scope" width="560" height="150"></canvas>' +
      '<canvas id="spectrum" class="scope" width="560" height="150"></canvas>' +
      '</div>';
    return sec;
  }

  /* ---------------------------------------------------------- analyser */

  function initAnalyser() {
    const scope = $('#scope');
    const spec = $('#spectrum');
    const sc = scope.getContext('2d');
    const sp = spec.getContext('2d');
    let timeData = null;
    let freqData = null;

    const sizeCanvas = (cv, ctx) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth || 560;
      const h = cv.clientHeight || 150;
      if (cv.width !== Math.round(w * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h };
    };

    function draw() {
      requestAnimationFrame(draw);
      const an = composer && composer.ctx ? composer.analyser : null;
      if (!an) {
        const s = sizeCanvas(scope, sc);
        sc.clearRect(0, 0, s.w, s.h);
        sc.strokeStyle = 'rgba(255,255,255,0.10)';
        sc.beginPath();
        sc.moveTo(0, s.h / 2);
        sc.lineTo(s.w, s.h / 2);
        sc.stroke();
        sc.fillStyle = 'rgba(255,255,255,0.25)';
        sc.font = '11px ui-monospace, monospace';
        sc.fillText('press play or a key to start audio', 10, s.h / 2 - 8);
        const b = sizeCanvas(spec, sp);
        sp.clearRect(0, 0, b.w, b.h);
        return;
      }
      if (!timeData || timeData.length !== an.fftSize) timeData = new Uint8Array(an.fftSize);
      if (!freqData || freqData.length !== an.frequencyBinCount) freqData = new Uint8Array(an.frequencyBinCount);

      const a = sizeCanvas(scope, sc);
      an.getByteTimeDomainData(timeData);
      sc.clearRect(0, 0, a.w, a.h);
      sc.strokeStyle = 'rgba(255,255,255,0.07)';
      sc.lineWidth = 1;
      sc.beginPath();
      sc.moveTo(0, a.h / 2);
      sc.lineTo(a.w, a.h / 2);
      sc.stroke();
      sc.strokeStyle = '#5fe0a8';
      sc.lineWidth = 1.6;
      sc.beginPath();
      const n = timeData.length;
      for (let x = 0; x < a.w; x++) {
        const i = Math.floor((x / a.w) * (n - 1));
        const y = a.h / 2 - ((timeData[i] - 128) / 128) * (a.h / 2 - 4);
        if (x === 0) sc.moveTo(x, y); else sc.lineTo(x, y);
      }
      sc.stroke();

      const b = sizeCanvas(spec, sp);
      an.getByteFrequencyData(freqData);
      sp.clearRect(0, 0, b.w, b.h);
      const bars = 72;
      const bw = b.w / bars;
      for (let i = 0; i < bars; i++) {
        const t = i / bars;
        const idx = Math.floor(Math.pow(t, 2.2) * (freqData.length - 1));
        let v = freqData[idx] / 255;
        for (let k = 1; k < 3; k++) v = Math.max(v, (freqData[Math.min(freqData.length - 1, idx + k)] || 0) / 255);
        const h = Math.max(1, v * (b.h - 4));
        sp.fillStyle = 'hsl(' + (150 + t * 90) + ',70%,' + (40 + v * 25) + '%)';
        sp.fillRect(i * bw, b.h - h, Math.max(1, bw - 1.5), h);
      }
    }
    requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------------- i18n */

  const I18N = SL.i18n;
  const t = (key, fallback) => I18N.t(key, fallback);

  function renderHelp() {
    const host = $('#helpBody');
    if (!host) return;
    const lang = I18N.getLang();
    const cards = I18N.HELP[lang] || I18N.HELP.en;
    host.innerHTML = '';
    cards.forEach((card) => {
      const art = document.createElement('article');
      art.className = 'card' + (card.type === 'signal' || card.title === 'Quick start' || card.title === 'Kiire algus' ? ' wide' : '');
      const h = document.createElement('h2');
      h.textContent = card.title;
      art.appendChild(h);

      if (card.type === 'signal') {
        const pre = document.createElement('pre');
        pre.className = 'path';
        pre.textContent = [
          '  osc 1 ─┬──→ FILTER ──→ AMP (ADSR) ──→ pan ──→ fader ─┐',
          '  osc 2 ─┤        ↑                                     │',
          '  sub   ─┤        │                                     │',
          '  noise ─┘        └── LFO 1 / LFO 2                     │',
          '                     cutoff · pitch · amp · reso         │',
          '                                                         ▼',
          '   drive ──→ chorus ──→ delay ──→ reverb ──→ MASTER ──→ limiter ──→ out',
          '                                                  ▲',
          '                                   every track sums here'
        ].join('\n');
        art.appendChild(pre);
      } else if (card.type === 'table') {
        const table = document.createElement('table');
        table.className = 'keys';
        card.items.forEach((row) => {
          const tr = document.createElement('tr');
          const td1 = document.createElement('td');
          td1.textContent = row.k;
          const td2 = document.createElement('td');
          td2.textContent = row.v;
          tr.appendChild(td1);
          tr.appendChild(td2);
          table.appendChild(tr);
        });
        art.appendChild(table);
      } else {
        const list = document.createElement(card.type === 'ol' ? 'ol' : 'ul');
        card.items.forEach((item) => {
          const li = document.createElement('li');
          li.textContent = item;
          list.appendChild(li);
        });
        art.appendChild(list);
      }
      if (card.note) {
        const note = document.createElement('p');
        note.className = 'note';
        note.textContent = card.note;
        art.appendChild(note);
      }
      host.appendChild(art);
    });
  }

  function applyLang(lang) {
    I18N.setLang(lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-tip]').forEach((el) => {
      el.dataset.tip = t(el.dataset.i18nTip);
    });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPh);
    });
    document.querySelectorAll('.btn.lang').forEach((b) => {
      b.classList.toggle('on', b.dataset.lang === lang);
    });

    renderHelp();
    refreshRackText();
    renderTracks();
    renderMenuText();
    updateModeButtons();
    updatePatchBar();
    updateSelReadout();
    updateVoiceCount();
    updateFolderButton();
  }

  function refreshRackText() {
    PANELS.forEach((p, idx) => {
      const sec = document.querySelectorAll('#rack .panel')[idx];
      if (!sec) return;
      const title = sec.querySelector('.panel-title');
      if (title) title.textContent = t(p.i18n || '', p.title);
      p.controls.forEach((c, ci) => {
        const body = sec.querySelector('.panel-body');
        if (!body) return;
        const nodes = body.children;
        const el = nodes[ci];
        if (!el) return;
        const lab = el.querySelector('.knob-label, .seg-label');
        if (lab) lab.textContent = t(c.i18n || '', c.label);
        const tipKey = c.path;
        if (c.t !== 'seg') {
          const knob = el;
          if (c.info || I18N.TIPS[tipKey]) knob.dataset.tip = I18N.tip(tipKey, c.info);
          knob.dataset.tipTitle = t(c.i18n || '', c.label);
        } else {
          el.dataset.tip = I18N.tip(tipKey, c.info);
          el.dataset.tipTitle = t(c.i18n || '', c.label);
          Array.prototype.slice.call(el.querySelectorAll('.seg-btn')).forEach((b, bi) => {
            const opt = (c.options || [])[bi];
            if (!opt) return;
            const key = 'opt.' + (opt.value === true ? 'true' : (opt.value === false ? 'false' : opt.value));
            if (I18N.TIPS[key] || opt.tip) b.dataset.tip = I18N.tip(key, opt.tip);
          });
        }
      });
    });
  }

  function renderMenuText() {
    document.querySelectorAll('#rollMenu .menu-item').forEach((b) => {
      const em = b.querySelector('em');
      const suffix = em ? em.textContent : '';
      b.textContent = t(b.dataset.i18n || '');
      const e2 = document.createElement('em');
      e2.textContent = suffix;
      b.appendChild(e2);
    });
  }

  function updateVoiceCount() {
    let v = 0;
    if (composer) {
      composer.engines.forEach((e) => { v += e.voices.size; });
    }
    $('#voiceCount').textContent = v + ' ' + (v === 1 ? t('voice') : t('voices'));
    $('#voiceCount').dataset.tip = t('voicesTip');
    $('#midiState').dataset.tip = t('midiTip');
  }

  /* ---------------------------------------------------------- hover help */

  const Tip = (function () {
    let el = null;
    let showT = null;
    let hideT = null;
    let cur = null;

    function ensure() {
      if (el) return el;
      el = document.createElement('div');
      el.className = 'tip';
      el.setAttribute('role', 'tooltip');
      el.hidden = true;
      document.body.appendChild(el);
      return el;
    }

    function labelOf(target) {
      const k = target.querySelector('.knob-label, .seg-label');
      if (k) return k.textContent;
      return (target.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    }

    function accentOf(target) {
      const panel = target.closest('.panel');
      if (panel) return getComputedStyle(panel).getPropertyValue('--acc').trim();
      return '';
    }

    function render(target) {
      const t = ensure();
      const title = target.dataset.tipTitle || labelOf(target);
      const body = target.dataset.tip || '';
      let value = target.dataset.tipValue || '';
      if (value === 'live') {
        const v = target.querySelector('.knob-val');
        value = v ? v.textContent : '';
      }
      if (!body && !value) return false;

      t.innerHTML = '';
      const h = document.createElement('div');
      h.className = 'tip-title';
      h.textContent = title;
      t.appendChild(h);
      if (body) {
        const b = document.createElement('div');
        b.className = 'tip-body';
        b.textContent = body;
        t.appendChild(b);
      }
      if (value) {
        const v = document.createElement('div');
        v.className = 'tip-val';
        v.textContent = value;
        t.appendChild(v);
      }
      const acc = accentOf(target);
      t.style.setProperty('--acc', acc || '#7cc4ff');
      return true;
    }

    function place(target) {
      const t = ensure();
      t.hidden = false;
      const r = target.getBoundingClientRect();
      const tr = t.getBoundingClientRect();
      let x = r.left + r.width / 2 - tr.width / 2;
      let y = r.top - tr.height - 10;
      if (y < 8) y = r.bottom + 10;
      if (y + tr.height > window.innerHeight - 8) y = Math.max(8, window.innerHeight - tr.height - 8);
      x = Math.max(8, Math.min(x, window.innerWidth - tr.width - 8));
      t.style.left = Math.round(x) + 'px';
      t.style.top = Math.round(y) + 'px';
    }

    function show(target) {
      if (!render(target)) return;
      cur = target;
      place(target);
    }

    function hide() {
      clearTimeout(showT);
      clearTimeout(hideT);
      cur = null;
      if (el) el.hidden = true;
    }

    function scheduleHide() {
      clearTimeout(showT);
      clearTimeout(hideT);
      hideT = setTimeout(hide, 160);
    }

    function over(e) {
      const from = e.target instanceof Element ? e.target : null;
      const t = from ? from.closest('[data-tip]') : null;
      if (!t) { if (cur) scheduleHide(); return; }
      clearTimeout(hideT);
      clearTimeout(showT);
      if (t === cur) return;
      showT = setTimeout(function () { show(t); }, cur ? 40 : 320);
    }

    function out(e) {
      const from = e.target instanceof Element ? e.target : null;
      if (from && from.closest('[data-tip]')) scheduleHide();
    }

    function init() {
      document.addEventListener('mouseover', over);
      document.addEventListener('mouseout', out);
      document.addEventListener('focusin', over);
      document.addEventListener('focusout', out);
      document.addEventListener('pointerdown', hide);
      window.addEventListener('scroll', hide, true);
      window.addEventListener('resize', hide);
      window.addEventListener('blur', hide);
    }

    return { init: init, hide: hide };
  })();

  /* ---------------------------------------------------------- undo / redo */

  const history = { undo: [], redo: [], limit: 80 };

  function snapshotNotes() {
    return song.tracks.map((t) => t.notes.map((n) => ({
      step: n.step, len: n.len, pitch: n.pitch, vel: n.vel
    })));
  }

  function pushUndo() {
    if (!song) return;
    history.undo.push(snapshotNotes());
    if (history.undo.length > history.limit) history.undo.shift();
    history.redo.length = 0;
    updateHistoryButtons();
  }

  function applySnapshot(snap) {
    if (!snap || snap.length !== song.tracks.length) return false;
    song.tracks.forEach((t, i) => {
      t.notes = snap[i].map((n) => ({ step: n.step, len: n.len, pitch: n.pitch, vel: n.vel }));
    });
    reindex();
    roll.clearSelection();
    roll.draw();
    markDirty();
    saveSession();
    return true;
  }

  function undo() {
    if (view !== 'compose') return;
    if (!history.undo.length) { toast('nothing to undo'); return; }
    const cur = snapshotNotes();
    const prev = history.undo.pop();
    history.redo.push(cur);
    applySnapshot(prev);
    updateHistoryButtons();
    toast('undo — ' + history.undo.length + ' more');
  }

  function redo() {
    if (view !== 'compose') return;
    if (!history.redo.length) { toast('nothing to redo'); return; }
    const cur = snapshotNotes();
    const next = history.redo.pop();
    history.undo.push(cur);
    applySnapshot(next);
    updateHistoryButtons();
    toast('redo — ' + history.redo.length + ' more');
  }

  function updateHistoryButtons() {
    const u = $('#btnUndo');
    const r = $('#btnRedo');
    if (u) u.disabled = !history.undo.length;
    if (r) r.disabled = !history.redo.length;
  }

  /* ------------------------------------------------- selection & clipboard */

  const clip = { notes: null, span: 0, from: null, anchor: null, minPitch: 0, relMax: 0 };

  function selectionInfo() {
    const list = roll.selectedNotes();
    if (!list.length) return null;
    let minStep = Infinity, maxEnd = -Infinity, minPitch = Infinity, maxPitch = -Infinity;
    list.forEach((n) => {
      if (n.step < minStep) minStep = n.step;
      if (n.step + Math.max(1, n.len) > maxEnd) maxEnd = n.step + Math.max(1, n.len);
      if (n.pitch < minPitch) minPitch = n.pitch;
      if (n.pitch > maxPitch) maxPitch = n.pitch;
    });
    return { list: list, minStep: minStep, maxEnd: maxEnd, minPitch: minPitch, maxPitch: maxPitch, span: maxEnd - minStep };
  }

  function posLabel(step) {
    const spb = song.stepsPerBar || 16;
    const bar = Math.floor(step / spb) + 1;
    const beat = Math.floor(((step % spb) / (spb / 4))) + 1;
    return bar + ':' + beat;
  }

  function afterNoteEdit() {
    reindex();
    roll.draw();
    markDirty();
    saveSession();
  }

  function clearClip() {
    clip.notes = null;
    clip.span = 0;
    clip.minPitch = 0;
    clip.relMax = 0;
    clip.from = null;
    clip.anchor = null;
  }

  function copySelection(cut) {
    const info = selectionInfo();
    if (!info) { toast('nothing selected — drag with shift, or press Ctrl+A'); return; }
    clip.notes = info.list.map((n) => ({
      step: n.step - info.minStep, len: Math.max(1, n.len), pitch: n.pitch - info.minPitch, vel: n.vel
    }));
    clip.span = info.span;
    clip.minPitch = info.minPitch;
    /* highest pitch inside the region, relative to its lowest note:
       the cursor is the block's top-left corner, so this is how far the
       block hangs below the row you clicked */
    clip.relMax = clip.notes.reduce((m, n) => Math.max(m, n.pitch), 0);
    clip.from = { s0: info.minStep, s1: info.maxEnd - 1 };
    clip.anchor = { s0: roll.sel ? roll.sel.s0 : info.minStep, s1: roll.sel ? roll.sel.s1 : info.maxEnd - 1 };
    if (cut) {
      pushUndo();
      const t = currentTrack();
      t.notes = t.notes.filter((n) => info.list.indexOf(n) < 0);
      roll.clearSelection();
      afterNoteEdit();
      toast('cut ' + info.list.length + ' notes — click the roll to choose a spot, then Paste');
    } else {
      toast('copied ' + info.list.length + ' notes — click the roll to choose a spot, then Paste');
    }
    roll.mode = 'select';
    updateModeButtons();
    updateSelReadout();
  }

  function pasteClipboard() {
    const t = currentTrack();
    if (!t) return;
    if (!clip.notes || !clip.notes.length) { toast('clipboard is empty — select notes and press Copy first'); return; }
    const total = SL.totalSteps(song);
    const anchor = clip.anchor;
    const stale = !!(roll.sel && anchor &&
      roll.sel.s0 === anchor.s0 && roll.sel.s1 === anchor.s1);
    pushUndo();
    let at;
    let basePitch = clip.minPitch;
    /* An explicit target — the selection or the amber cursor — always wins.
       The playhead is only a fallback, so a running loop can never shift a
       paste away from where you pointed. */
    if (roll.sel && !stale) {
      at = roll.sel.s0;
    } else if (roll.cursor !== null) {
      at = roll.cursor;
      if (roll.cursorPitch !== null) basePitch = roll.cursorPitch - (clip.relMax || 0);
    } else if (composer.playing) {
      at = Math.max(0, composer.displayStep());
    } else if (anchor) {
      at = anchor.s1 + 1;
    } else {
      at = 0;
    }
    const added = [];
    clip.notes.forEach((c) => {
      const n = {
        step: (at + c.step) % total,
        len: c.len,
        pitch: clamp(c.pitch + basePitch, 0, 127),
        vel: c.vel
      };
      t.notes.push(n);
      added.push(n);
    });
    /* advance by the block's real length, not by its last note's start,
       otherwise repeating a paste would drop the copy inside the first one */
    let s1 = 0, end = 0, p0 = 127, p1 = 0;
    added.forEach((n) => {
      if (n.step > s1) s1 = n.step;
      if (n.step + Math.max(1, n.len) > end) end = n.step + Math.max(1, n.len);
      if (n.pitch < p0) p0 = n.pitch;
      if (n.pitch > p1) p1 = n.pitch;
    });
    /* clamp to the loop: the anchor has to match what setSelection stores,
       otherwise the "is this selection the thing I just pasted?" check fails
       and the next paste lands back on top of the previous one */
    const lastStep = Math.min(total - 1, Math.max(at, end - 1));
    clip.anchor = { s0: at, s1: lastStep };
    const keepPitch = roll.cursorPitch;
    roll.setSelection({ s0: at, s1: lastStep, p0: p0, p1: p1 });
    roll.setCursor(end % total, keepPitch);
    afterNoteEdit();
    roll.reveal(at, lastStep, p0, p1);
    roll.flash(added);
    toast('pasted ' + added.length + ' notes at ' + posLabel(at) +
      ' — next Paste lands at ' + posLabel(roll.cursor));
  }

  function duplicateSelection() {
    const t = currentTrack();
    const info = selectionInfo();
    if (!t || !info) { toast('nothing selected'); return; }
    pushUndo();
    const total = SL.totalSteps(song);
    const shift = Math.max(1, info.span);
    const added = [];
    info.list.forEach((n) => {
      const c = { step: (n.step + shift) % total, len: Math.max(1, n.len), pitch: n.pitch, vel: n.vel };
      t.notes.push(c);
      added.push(c);
    });
    let s0 = Infinity, s1 = 0, end = 0;
    added.forEach((n) => {
      if (n.step < s0) s0 = n.step;
      if (n.step > s1) s1 = n.step;
      if (n.step + Math.max(1, n.len) > end) end = n.step + Math.max(1, n.len);
    });
    const lastStep2 = Math.min(total - 1, Math.max(s0, end - 1));
    clip.anchor = { s0: s0, s1: lastStep2 };
    const keepPitch2 = roll.cursorPitch;
    roll.setSelection({ s0: s0, s1: lastStep2, p0: info.minPitch, p1: info.maxPitch });
    roll.setCursor(end % total, keepPitch2);
    afterNoteEdit();
    roll.reveal(s0, s1, info.minPitch, info.maxPitch);
    roll.flash(added);
    toast('duplicated ' + added.length + ' notes at ' + posLabel(s0));
  }

  function deleteSelection() {
    const t = currentTrack();
    const info = selectionInfo();
    if (!t || !info) return;
    pushUndo();
    t.notes = t.notes.filter((n) => info.list.indexOf(n) < 0);
    roll.clearSelection();
    afterNoteEdit();
    toast('deleted ' + info.list.length + ' notes');
  }

  function selectAllNotes() {
    if (view !== 'compose') return;
    if (!roll.selectAll()) { toast('this track has no notes'); return; }
    roll.revealTrack();
  }

  /* end the copy step: drop the selection, the cursor and the clipboard,
     and hand the pencil back so the next click draws again */
  function clearEditState() {
    roll.clearSelection();
    roll.clearCursor();
    clearClip();
    roll.mode = 'draw';
    updateModeButtons();
    updateSelReadout();
    toast('cleared selection, paste cursor and clipboard — Draw mode');
  }

  function nudgeSelection(dStep, dPitch) {
    const info = selectionInfo();
    if (!info) return;
    pushUndo();
    const total = SL.totalSteps(song);
    info.list.forEach((n) => {
      n.step = Math.max(0, Math.min(total - Math.max(1, n.len), n.step + dStep));
      n.pitch = clamp(n.pitch + dPitch, 0, 127);
    });
    roll.setSelection({
      s0: Math.max(0, info.minStep + dStep), s1: Math.max(0, info.maxEnd - 1 + dStep),
      p0: clamp(info.minPitch + dPitch, 0, 127), p1: clamp(info.maxPitch + dPitch, 0, 127)
    });
    afterNoteEdit();
  }

  /* ------------------------------------------------------------- composer */

  function composerEnsure() {
    if (!composer) return null;
    const ctx = composer.ensure();
    if (ctx.state === 'suspended') ctx.resume();
    syncPatchRef();
    return ctx;
  }

  function composerStop() {
    if (composer) composer.stop();
    updatePlayButton();
  }

  function togglePlay() {
    if (!composer) return;
    if (composer.playing) {
      composer.stop();
    } else {
      composerEnsure();
      reindex();
      composer.play();
    }
    updatePlayButton();
  }

  function updateModeButtons() {
    document.querySelectorAll('.btn.mode').forEach((b) => {
      b.classList.toggle('on', b.dataset.mode === roll.mode);
    });
    const cv = $('#roll');
    if (cv) {
      cv.dataset.tipTitle = roll.mode === 'select' ? 'Select mode' : 'Draw mode';
      cv.dataset.tip = roll.mode === 'select'
        ? 'Select mode: drag to select, click empty space to move the paste cursor, click a note to edit it. Switch to Draw to write new notes.'
        : 'Draw mode: click empty space to write a note, drag to set its length. Drag a note to move it, drag its right edge to resize, alt-click to delete.';
    }
  }

  function updateSelReadout() {
    const el = $('#selReadout');
    if (!el) return;
    const n = roll.sel ? roll.selectedNotes().length : 0;
    if (!roll.sel) {
      el.textContent = 'no selection';
      el.classList.remove('on');
    } else {
      el.textContent = n + (n === 1 ? ' note' : ' notes') + ' · ' +
        (roll.sel.s1 - roll.sel.s0 + 1) + ' steps';
      el.classList.toggle('on', n > 0);
    }
    if (roll.cursor !== null) {
      el.textContent += ' · paste @ ' + (roll.cursor + 1);
      if (roll.cursorPitch !== null) {
        el.textContent += ' / ' + NOTE_NAMES[roll.cursorPitch % 12] +
          (Math.floor(roll.cursorPitch / 12) - 1);
      }
      el.classList.add('on');
    }
    const has = n > 0;
    const hasClip = !!(clip.notes && clip.notes.length);
    const anyNotes = !!(currentTrack() && currentTrack().notes.length);
    const set = (id, on) => { const b = $(id); if (b) b.disabled = !on; };
    set('#btnCopy', has);
    set('#btnCut', has);
    set('#btnDup', has);
    set('#btnDelSel', has);
    set('#btnSemiUp', has);
    set('#btnSemiDn', has);
    set('#btnOctUp', has);
    set('#btnOctDn', has);
    set('#btnPaste', hasClip);
    set('#btnSelAll', anyNotes);
    set('#btnClear', has || roll.cursor !== null || hasClip);
    updateHistoryButtons();
    document.querySelectorAll('#rollMenu .menu-item').forEach((b) => {
      const a = b.dataset.act;
      if (a === 'paste' || a === 'pastehere') { b.disabled = !hasClip; return; }
      b.disabled = a === 'all' ? !anyNotes : !has;
    });
  }

  function updatePlayButton() {
    const b = $('#btnPlay');
    const on = composer && composer.playing;
    b.innerHTML = on ? '&#9632;' : '&#9654;';
    b.classList.toggle('on', !!on);
  }

  function initTransport() {
    const rootSel = $('#scaleRoot');
    NOTE_NAMES.forEach((n, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = n;
      rootSel.appendChild(o);
    });
    const typeSel = $('#scaleType');
    Object.keys(SL.SCALE_LABELS).forEach((k) => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = SL.SCALE_LABELS[k];
      typeSel.appendChild(o);
    });

    $('#btnPlay').addEventListener('click', togglePlay);
    $('#btnRec').addEventListener('click', () => {
      recording = !recording;
      $('#btnRec').classList.toggle('on', recording);
    });
    $('#bpm').addEventListener('input', () => {
      song.bpm = clamp(Number($('#bpm').value) || 120, 40, 240);
      $('#bpm').value = song.bpm;
      markDirty();
      saveSession();
    });
    $('#swing').addEventListener('input', () => {
      song.swing = clamp(Number($('#swing').value), 0, 0.7);
      markDirty();
      saveSession();
    });
    $('#bars').addEventListener('change', () => {
      song.bars = Number($('#bars').value);
      reindex();
      roll.resize();
      roll.draw();
      markDirty();
      saveSession();
    });
    $('#masterVol').addEventListener('input', () => {
      const v = Number($('#masterVol').value);
      song.masterVolume = v;
      if (composer && composer.master) composer.setMasterVolume(v);
      markDirty();
      saveSession();
    });
    const scaleChanged = () => {
      song.scaleRoot = Number($('#scaleRoot').value);
      song.scaleType = $('#scaleType').value;
      song.scaleSnap = $('#scaleSnap').checked;
      applyScale();
      markDirty();
      saveSession();
    };
    $('#scaleRoot').addEventListener('change', scaleChanged);
    $('#scaleType').addEventListener('change', scaleChanged);
    $('#scaleSnap').addEventListener('change', scaleChanged);

    $('#btnAddTrack').addEventListener('click', () => {
      const name = window.prompt('New track name:', 'Track ' + (song.tracks.length + 1));
      if (name === null) return;
      song.tracks.push(SL.newTrack(name.trim() || 'Track', SL.patchByName('Init Saw'), []));
      selTrack = song.tracks.length - 1;
      if (composer.ctx) composer.buildTrack(selTrack);
      syncPatchRef();
      reindex();
      renderTracks();
      roll.setSong(song, selTrack, visibleIndices());
      refreshControls();
      markDirty();
      saveSession();
    });
    $('#zoomIn').addEventListener('click', () => roll.setZoom(roll.stepW + 4));
    $('#zoomOut').addEventListener('click', () => roll.setZoom(roll.stepW - 4));
    document.querySelectorAll('.btn.mode').forEach((b) => {
      b.addEventListener('click', () => {
        roll.mode = b.dataset.mode;
        updateModeButtons();
      });
    });
    updateModeButtons();

    const loop = () => {
      requestAnimationFrame(loop);
      if (!composer) return;
      if (composer.playing) {
        const s = composer.displayStep();
        roll.setPlayStep(s);
        const total = SL.totalSteps(song);
        const step = s < 0 ? 0 : s;
        $('#stepReadout').textContent =
          String(Math.floor(step / 16) + 1).padStart(3, '0') + ':' + ((step % 16) + 1);
        if (total > 0 && s >= 0) {
          const wrap = $('#rollWrap');
          const x = s * roll.stepW;
          if (x < wrap.scrollLeft || x > wrap.scrollLeft + wrap.clientWidth - 40) {
            wrap.scrollLeft = Math.max(0, x - wrap.clientWidth * 0.3);
          }
        }
      } else {
        roll.setPlayStep(-1);
      }
      let v = 0;
      composer.engines.forEach((e) => {
        v += e.voices.size;
      });
      $('#voiceCount').textContent = v + ' ' + (v === 1 ? t('voice') : t('voices'));
    };
    requestAnimationFrame(loop);
  }

  /* --------------------------------------------------------- track list */

  let menuStep = null;
  let menuPitch = null;

  function editAction(act) {
    if (act === 'copy') copySelection(false);
    else if (act === 'cut') copySelection(true);
    else if (act === 'paste') pasteClipboard();
    else if (act === 'pastehere') {
      const st = parseInt(menuStep, 10);
      if (isNaN(st)) { pasteClipboard(); return; }
      roll.setCursor(st, menuPitch);
      pasteClipboard();
    } else if (act === 'dup') duplicateSelection();
    else if (act === 'del') deleteSelection();
    else if (act === 'all') selectAllNotes();
  }

  function initEditBar() {
    const map = {
      '#btnSelAll': 'all', '#btnCopy': 'copy', '#btnCut': 'cut',
      '#btnPaste': 'paste', '#btnDup': 'dup', '#btnDelSel': 'del'
    };
    Object.keys(map).forEach((id) => {
      const b = $(id);
      if (b) b.addEventListener('click', () => editAction(map[id]));
    });
    $('#btnClear').addEventListener('click', clearEditState);
    $('#btnUndo').addEventListener('click', undo);
    $('#btnRedo').addEventListener('click', redo);
    $('#btnSemiUp').addEventListener('click', () => nudgeSelection(0, 1));
    $('#btnSemiDn').addEventListener('click', () => nudgeSelection(0, -1));
    $('#btnOctUp').addEventListener('click', () => nudgeSelection(0, 12));
    $('#btnOctDn').addEventListener('click', () => nudgeSelection(0, -12));

    const menu = $('#rollMenu');
    $('#roll').addEventListener('contextmenu', (e) => {
      e.preventDefault();
      /* the right-click already deleted a note — don't open the menu on top */
      if (roll.noMenu) { roll.noMenu = false; return; }
      const rr = $('#roll').getBoundingClientRect();
      menuStep = Math.floor((e.clientX - rr.left) / roll.stepW);
      menuPitch = roll.pitchAt(e.clientY - rr.top);
      const has = !!(roll.sel && roll.selectedNotes().length);
      const hasClip = !!(clip.notes && clip.notes.length);
      document.querySelectorAll('#rollMenu .menu-item').forEach((b) => {
        const a = b.dataset.act;
        if (a === 'paste' || a === 'pastehere') { b.disabled = !hasClip; return; }
        b.disabled = a === 'all' ? !currentTrack().notes.length : !has;
      });
      const here = menu.querySelector('[data-act="pastehere"]');
      if (here) {
        let em = here.querySelector('em');
        if (!em) {
          em = document.createElement('em');
          here.appendChild(em);
        }
        em.textContent = 'step ' + (menuStep + 1) +
          (menuPitch !== null
            ? ' / ' + NOTE_NAMES[menuPitch % 12] + (Math.floor(menuPitch / 12) - 1)
            : '');
      }
      menu.hidden = false;
      const mw = menu.getBoundingClientRect();
      const x = Math.min(e.clientX, window.innerWidth - mw.width - 8);
      const y = Math.min(e.clientY, window.innerHeight - mw.height - 8);
      menu.style.left = Math.max(8, x) + 'px';
      menu.style.top = Math.max(8, y) + 'px';
    });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('.menu-item');
      if (!b || b.disabled) return;
      editAction(b.dataset.act);
      menu.hidden = true;
    });
    const closeMenu = () => { menu.hidden = true; };
    window.addEventListener('pointerdown', (e) => {
      if (!menu.hidden && !menu.contains(e.target)) closeMenu();
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('blur', closeMenu);
  }

  function patchNames() {
    const names = SL.FACTORY_PRESETS.map((p) => p.name);
    userPresets.forEach((p) => { if (names.indexOf(p.name) < 0) names.push(p.name); });
    return names;
  }

  function patchGroups() {
    const groups = [];
    const byName = {};
    const add = function (cat, name) {
      if (byName[name]) return;
      byName[name] = true;
      let g = groups.find((x) => x.label === cat);
      if (!g) { g = { label: cat, names: [] }; groups.push(g); }
      g.names.push(name);
    };
    const order = SL.PATCH_CATEGORIES || [];
    SL.FACTORY_PRESETS.forEach((p) => add(p.category || 'Other', p.name));
    userPresets.forEach((p) => add('User', p.name));
    groups.sort(function (a, b) {
      if (a.label === 'User') return 1;
      if (b.label === 'User') return -1;
      const ia = order.indexOf(a.label);
      const ib = order.indexOf(b.label);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    return groups;
  }

  function fillPatchSelect(sel, selected) {
    sel.innerHTML = '';
    patchGroups().forEach((g) => {
      const og = document.createElement('optgroup');
      og.label = g.label + ' (' + g.names.length + ')';
      g.names.forEach((n) => {
        const o = document.createElement('option');
        o.value = n;
        o.textContent = n;
        if (n === selected) o.selected = true;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
  }

  function renderTracks() {
    const list = $('#trackList');
    if (!list) return;
    list.innerHTML = '';
    if (!song) { return; }
    if (!song.tracks.length) {
      const e = document.createElement('div');
      e.className = 'tracks-empty';
      e.textContent = 'no tracks — press "+ Track"';
      list.appendChild(e);
      return;
    }
    song.tracks.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'track' + (i === selTrack ? ' sel' : '');
      row.dataset.i = String(i);
      row.style.setProperty('--tc', SL.trackColor(i));

      const show = document.createElement('input');
      show.type = 'checkbox';
      show.className = 'tshow';
      show.checked = !!t.show;
      show.dataset.tipTitle = 'Show in roll';
      show.dataset.tip = 'Draw this track\'s notes on the piano roll. Any number of tracks can be shown at once.';
      show.addEventListener('change', () => {
        t.show = show.checked;
        if (!t.show && i === selTrack) {
          const vis = visibleIndices();
          if (vis.length) selectTrack(vis[0]);
          else { t.show = true; show.checked = true; toast('at least one track must be shown'); }
        }
        syncRollVisible();
        renderTracks();
        saveSession();
      });
      row.appendChild(show);

      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.dataset.tipTitle = 'Track ' + (i + 1);
      dot.dataset.tip = 'Click the row to select it — its patch then loads in the Patch tab, and its notes become editable in the roll.';
      row.appendChild(dot);

      const name = document.createElement('input');
      name.type = 'text';
      name.className = 'tname';
      name.dataset.tipTitle = 'Track name';
      name.dataset.tip = 'Rename this track.';
      name.value = t.name;
      name.addEventListener('change', () => {
        t.name = name.value.trim() || 'Track';
        name.value = t.name;
        markDirty();
        saveSession();
      });
      row.appendChild(name);

      const psel = document.createElement('select');
      psel.className = 'select sm tpatch';
      psel.dataset.tipTitle = 'Patch';
      psel.dataset.tip = 'Swap the sound on this track without touching its notes.';
      fillPatchSelect(psel, t.patch.name);
      psel.addEventListener('change', () => {
        const src = SL.FACTORY_PRESETS.concat(userPresets).find((p) => p.name === psel.value);
        if (!src) return;
        composerEnsure();
        composer.setTrackPatch(i, SL.clone(src));
        syncPatchRef();
        refreshControls();
        updatePatchBar();
        markDirty();
        saveSession();
        toast(i === selTrack ? 'loaded ' + src.name : src.name + ' → ' + t.name);
      });
      row.appendChild(psel);

      const mk = (cls, label, tip, on) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tbtn ' + cls + (on ? ' on' : '');
        b.textContent = label;
        b.dataset.tipTitle = tip.title;
        b.dataset.tip = tip.body;
        row.appendChild(b);
        return b;
      };

      mk('m', 'M', { title: 'Mute', body: 'Silence this track. Handy for auditioning a part.' }, t.mute)
        .addEventListener('click', () => {
          t.mute = !t.mute; renderTracks(); markDirty(); saveSession();
        });
      mk('s', 'S', { title: 'Solo', body: 'Play only the soloed tracks.' }, t.solo)
        .addEventListener('click', () => {
          t.solo = !t.solo; renderTracks(); markDirty(); saveSession();
        });

      const vol = document.createElement('input');
      vol.type = 'range';
      vol.className = 'range tvol';
      vol.min = '0'; vol.max = '1'; vol.step = '0.01';
      vol.value = String(t.volume);
      vol.dataset.tipTitle = 'Track volume';
      vol.dataset.tip = 'Level of this track into the song master fader.';
      vol.addEventListener('input', () => {
        t.volume = Number(vol.value);
        if (composer) composer.setTrackMix(i);
        markDirty();
        saveSession();
      });
      row.appendChild(vol);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'tbtn x';
      del.textContent = '✕';
      del.dataset.tipTitle = 'Delete track';
      del.dataset.tip = 'Remove this track and all of its notes.';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!window.confirm('Delete track "' + t.name + '"?')) return;
        if (composer && composer.engines[i]) composer.engines[i].allNotesOff();
        song.tracks.splice(i, 1);
        if (composer && composer.ctx) {
          composer.engines.splice(i, 1);
          composer.strips.splice(i, 1);
        }
        selTrack = clamp(selTrack, 0, Math.max(0, song.tracks.length - 1));
        syncPatchRef();
        reindex();
        renderTracks();
        roll.setSong(song, selTrack, visibleIndices());
        refreshControls();
        markDirty();
        saveSession();
      });
      row.appendChild(del);

      row.addEventListener('pointerdown', (e) => {
        if (e.target !== dot && e.target !== row) return;
        selectTrack(i);
      });
      list.appendChild(row);
    });
  }

  function initTrackViewControls() {
    $('#btnShowAll').addEventListener('click', () => {
      song.tracks.forEach((t) => { t.show = true; });
      syncRollVisible();
      renderTracks();
      saveSession();
      toast('showing all ' + song.tracks.length + ' tracks');
    });
    $('#btnShowSel').addEventListener('click', () => {
      song.tracks.forEach((t, i) => { t.show = i === selTrack; });
      syncRollVisible();
      renderTracks();
      saveSession();
      toast('showing the selected track only');
    });
  }

  function selectTrack(i) {
    if (!song.tracks[i]) return;
    selTrack = i;
    /* selecting a track means you want to work on it, so make it visible */
    if (!song.tracks[selTrack].show) {
      song.tracks[selTrack].show = true;
      saveSession();
    }
    syncPatchRef();
    roll.setSong(song, selTrack, visibleIndices());
    updateSelReadout();
    refreshControls();
    updatePatchBar();
    renderTracks();
    roll.revealTrack();
  }

  function updatePatchBar() {
    const trk = currentTrack();
    $('#patchTrack').textContent = trk ? t('editing') + trk.name : t('editing') + '—';
    if (trk && patch) $('#patchName').value = patch.name;
  }

  /* ------------------------------------------------------------- keyboard */

  const BLACK = [1, 3, 6, 8, 10];
  const KEYMAP = {
    a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
    k: 12, o: 13, l: 14, p: 15, ';': 16, "'": 17, ']': 18
  };
  const KEYHINT = {
    0: 'a', 1: 'w', 2: 's', 3: 'e', 4: 'd', 5: 'f', 6: 't', 7: 'g', 8: 'y', 9: 'h',
    10: 'u', 11: 'j', 12: 'k', 13: 'o', 14: 'l', 15: 'p', 16: ';', 17: "'"
  };

  const isBlack = (s) => BLACK.indexOf(((s % 12) + 12) % 12) >= 0;

  function renderKeyboard() {
    const kb = $('#keyboard');
    kb.innerHTML = '';
    const semis = 25;
    let whiteCount = 0;
    for (let s = 0; s < semis; s++) if (!isBlack(s)) whiteCount++;
    const w = 100 / whiteCount;
    const whiteRow = document.createElement('div');
    whiteRow.className = 'white-row';
    const blackRow = document.createElement('div');
    blackRow.className = 'black-row';
    let wi = 0;

    for (let s = 0; s < semis; s++) {
      const note = baseNote + s;
      const key = document.createElement('div');
      key.className = 'key ' + (isBlack(s) ? 'black' : 'white');
      key.dataset.note = String(note);
      if (isBlack(s)) {
        key.style.left = 'calc(' + (wi * w) + '% - ' + (w * 0.3) + '%)';
        key.style.width = (w * 0.6) + '%';
        blackRow.appendChild(key);
      } else {
        key.style.width = w + '%';
        if (s % 12 === 0) {
          const lab = document.createElement('span');
          lab.className = 'key-label';
          lab.textContent = NOTE_NAMES[note % 12] + (Math.floor(note / 12) - 1);
          key.appendChild(lab);
        }
        if (KEYHINT[s]) {
          const h = document.createElement('span');
          h.className = 'key-hint';
          h.textContent = KEYHINT[s];
          key.appendChild(h);
        }
        whiteRow.appendChild(key);
        wi++;
      }
    }
    kb.appendChild(whiteRow);
    kb.appendChild(blackRow);
    $('#octLabel').textContent = NOTE_NAMES[baseNote % 12] + (Math.floor(baseNote / 12) - 1);
  }

  const markKey = (note, on) => {
    const el = $('#keyboard .key[data-note="' + note + '"]');
    if (el) el.classList.toggle('down', on);
  };

  function press(rawNote, vel) {
    const note = roll.snapPitch(rawNote);
    composerEnsure();
    const eng = currentEngine();
    if (eng) eng.noteOn(note, vel);
    markKey(note, true);
    if (recording && composer && composer.playing) {
      const t = currentTrack();
      const s = Math.max(0, composer.displayStep());
      if (t && !t.notes.some((n) => n.pitch === note && n.step === s)) {
        t.notes.push({ step: s, len: 1, pitch: note, vel: vel });
        reindex();
        roll.draw();
        markDirty();
        saveSession();
      }
    }
  }

  function lift(rawNote) {
    const note = roll.snapPitch(rawNote);
    const eng = currentEngine();
    if (eng) eng.noteOff(note);
    markKey(note, false);
  }

  function initKeyboardInput() {
    const kb = $('#keyboard');
    let down = false;
    let lastNote = null;

    const noteFromEvent = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || !el.classList.contains('key')) return null;
      return parseInt(el.dataset.note, 10);
    };

    kb.addEventListener('pointerdown', (e) => {
      composerEnsure();
      down = true;
      lastNote = noteFromEvent(e);
      if (lastNote !== null) press(lastNote, 0.9);
      e.preventDefault();
    });
    kb.addEventListener('pointermove', (e) => {
      if (!down) return;
      const n = noteFromEvent(e);
      if (n !== null && n !== lastNote) {
        if (lastNote !== null) lift(lastNote);
        lastNote = n;
        press(n, 0.9);
      }
    });
    const release = () => {
      if (!down) return;
      down = false;
      if (lastNote !== null) lift(lastNote);
      lastNote = null;
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    const downKeys = new Set();
    window.addEventListener('keydown', (e) => {
      if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) {
          composerEnsure();
          const eng = currentEngine();
          if (eng) eng.setSustain(true);
          $('#sustain').checked = true;
        }
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (KEYMAP[k] === undefined) return;
      if (downKeys.has(k)) return;
      downKeys.add(k);
      press(baseNote + KEYMAP[k], 0.9);
      e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        const eng = currentEngine();
        if (eng) eng.setSustain(false);
        $('#sustain').checked = false;
        return;
      }
      const k = e.key.toLowerCase();
      if (!downKeys.has(k)) return;
      downKeys.delete(k);
      lift(baseNote + KEYMAP[k]);
    });
    window.addEventListener('blur', () => {
      downKeys.forEach((k) => {
        lift(baseNote + KEYMAP[k]);
      });
      downKeys.clear();
    });

    document.querySelectorAll('.btn.oct').forEach((b) => {
      b.addEventListener('click', () => {
        baseOctave = clamp(baseOctave + parseInt(b.dataset.dir, 10), 0, 7);
        baseNote = (baseOctave + 1) * 12;
        renderKeyboard();
      });
    });
    $('#sustain').addEventListener('change', (e) => {
      const eng = currentEngine();
      if (eng) eng.setSustain(e.target.checked);
    });
  }

  function initMidi() {
    const led = $('#midiState');
    if (!navigator.requestMIDIAccess) {
      led.textContent = 'MIDI n/a';
      led.classList.add('off');
      return;
    }
    navigator.requestMIDIAccess({ sysex: false }).then((access) => {
      const update = () => {
        let n = 0;
        access.inputs.forEach(() => { n += 1; });
        led.textContent = n ? 'MIDI ' + n : 'MIDI —';
        led.classList.toggle('on', n > 0);
      };
      access.inputs.forEach((input) => {
        input.onmidimessage = (msg) => {
          const d = msg.data;
          const st = d[0] & 0xf0;
          if (st === 0x90 && d[2] > 0) press(d[1], d[2] / 127);
          else if (st === 0x80 || (st === 0x90 && d[2] === 0)) lift(d[1]);
          else if (st === 0xb0 && d[1] === 1) composer.engines.forEach((e) => { e.setMod(d[2] / 127); });
          else if (st === 0xb0 && d[1] === 123) panic();
          else if (st === 0xe0) composer.engines.forEach((e) => { e.setBend(((d[2] << 7 | d[1]) - 8192) / 8192 * 200); });
        };
      });
      access.onstatechange = update;
      update();
    }).catch(() => {
      led.textContent = 'MIDI blocked';
      led.classList.add('off');
    });
  }

  function panic() {
    if (composer) {
      composer.engines.forEach((e) => {
        e.allNotesOff();
      });
    }
    document.querySelectorAll('#keyboard .key.down').forEach((k) => {
      k.classList.remove('down');
    });
    toast('all notes off');
  }

  /* -------------------------------------------------------------- storage */

  function loadStore() {
    try {
      userPresets = JSON.parse(localStorage.getItem(LS_PRESETS) || '[]');
      if (!Array.isArray(userPresets)) userPresets = [];
    } catch (e) { userPresets = []; }
    try {
      const s = JSON.parse(localStorage.getItem(LS_SLOTS) || 'null');
      if (s) slots = Object.assign(slots, s);
    } catch (e2) { /* keep defaults */ }
    try {
      savedSongs = JSON.parse(localStorage.getItem(LS_SONGS) || '[]');
      if (!Array.isArray(savedSongs)) savedSongs = [];
    } catch (e3) { savedSongs = []; }
  }

  /* Autosave: every ten seconds the open project is written to local storage,
     but only when something actually happened during those ten seconds. No
     activity, no write — so an untouched tab does not keep touching storage,
     and a burst of edits still costs a single write. Leaving the page flushes
     it straight away, which is what keeps an accidental close harmless. */
  const AUTOSAVE_MS = 10000;
  let sessionActivity = false;
  let sessionWritten = '';

  function flushSession() {
    sessionActivity = false;
    try {
      const json = JSON.stringify(cleanSong(song));
      if (json === sessionWritten) return;
      localStorage.setItem(LS_SESSION, json);
      sessionWritten = json;
    } catch (e) { /* quota */ }
  }

  /* Asking for a save only raises the flag; the loop below does the writing. */
  function saveSession() {
    sessionActivity = true;
  }

  function startAutosave() {
    ['pointerdown', 'pointermove', 'keydown', 'input', 'change', 'wheel', 'touchstart'].forEach((ev) => {
      window.addEventListener(ev, () => { sessionActivity = true; }, { passive: true });
    });
    setInterval(() => { if (sessionActivity) flushSession(); }, AUTOSAVE_MS);
    window.addEventListener('pagehide', flushSession);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) flushSession();
    });
  }

  const saveUserPresets = () => {
    try { localStorage.setItem(LS_PRESETS, JSON.stringify(userPresets)); } catch (e) { /* quota */ }
  };
  const saveSlots = () => {
    try { localStorage.setItem(LS_SLOTS, JSON.stringify(slots)); } catch (e) { /* quota */ }
  };
  const saveSongBank = () => {
    try { localStorage.setItem(LS_SONGS, JSON.stringify(savedSongs)); } catch (e) { /* quota */ }
  };

  function findUserPatch(name) {
    return userPresets.findIndex((p) => p.name.toLowerCase() === String(name).toLowerCase());
  }

  function refreshPresetList() {
    const sel = $('#presetSelect');
    sel.innerHTML = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '— bank (' + SL.FACTORY_PRESETS.length + ') —';
    sel.appendChild(blank);
    let i = 0;
    patchGroups().forEach((g) => {
      const og = document.createElement('optgroup');
      og.label = g.label;
      g.names.forEach((n) => {
        const factory = SL.FACTORY_PRESETS.find((p) => p.name === n);
        const o = document.createElement('option');
        o.value = (factory ? 'f:' + SL.FACTORY_PRESETS.indexOf(factory) : 'u:' + userPresets.findIndex((p) => p.name === n));
        o.textContent = n;
        og.appendChild(o);
        i += 1;
      });
      sel.appendChild(og);
    });
    sel.value = '';
  }

  function applyPatchToTrack(p) {
    const merged = SL.mergePatch(SL.defaultPatch(), SL.clone(p));
    composerEnsure();
    composer.setTrackPatch(selTrack, merged);
    syncPatchRef();
    refreshControls();
    updatePatchBar();
    renderTracks();
    markDirty();
    saveSession();
    toast('loaded "' + p.name + '"');
  }

  function saveCurrentPatch(asNew) {
    let name = $('#patchName').value.trim() || 'Untitled';
    const idx = findUserPatch(name);
    if (asNew) {
      const n = window.prompt('Save patch as:', name);
      if (!n) return;
      name = n.trim();
      if (!name) return;
    } else if (idx >= 0) {
      if (!window.confirm('Overwrite "' + userPresets[idx].name + '"?')) return;
    }
    patch.name = name;
    $('#patchName').value = name;
    const data = SL.clone(patch);
    const at = findUserPatch(name);
    if (at >= 0) userPresets[at] = data; else userPresets.push(data);
    userPresets.sort((a, b) => a.name.localeCompare(b.name));
    saveUserPresets();
    refreshPresetList();
    renderTracks();
    saveSession();
    toast('saved "' + name + '"');
  }

  function deleteCurrentPatch() {
    const name = $('#patchName').value.trim();
    const idx = findUserPatch(name);
    if (idx < 0) { toast('no user patch named "' + name + '"'); return; }
    if (!window.confirm('Delete "' + userPresets[idx].name + '"?')) return;
    userPresets.splice(idx, 1);
    saveUserPresets();
    refreshPresetList();
    toast('deleted "' + name + '"');
  }

  function saveSongAs(forcePrompt) {
    let name = ($('#songName').value.trim() || 'Untitled');
    const idx = findSavedSong(name);
    if (forcePrompt || idx < 0) {
      const n = window.prompt('Save project as:', name);
      if (n === null) return false;
      name = n.trim();
      if (!name) return false;
    } else if (!window.confirm('Overwrite project "' + savedSongs[idx].name + '"?')) {
      return false;
    }
    return saveSongAsName(name);
  }

  function saveSongAsName(name) {
    song.name = name;
    $('#songName').value = name;
    const data = cleanSong(song);
    data.updatedAt = new Date().toISOString();
    const idx = findSavedSong(name);
    if (idx >= 0) savedSongs[idx] = data; else savedSongs.push(data);
    savedSongs.sort((a, b) => a.name.localeCompare(b.name));
    saveSongBank();
    renderProjectDialog();
    setDirty(false);
    saveSession();
    toast(t('savedProject') + name + '"');
    saveToFolder();
    return true;
  }

  function saveCurrentSong() {
    const name = ($('#songName').value.trim() || 'Untitled');
    if (findSavedSong(name) < 0) return saveSongAs(true);
    return saveSongAsName(name);
  }

  /* --------------------------------------------------- new / open project */

  function findSavedSong(name) {
    return savedSongs.findIndex((s) => s.name.toLowerCase() === String(name).toLowerCase());
  }

  function blankProject(name, template) {
    const s = SL.newSong();
    s.name = name;
    s.bpm = 120;
    s.bars = 2;
    if (template === 'copy') return SL.clone(cleanSong(song));
    if (template === 'empty') return s;
    s.tracks = [SL.newTrack('Track 1', SL.patchByName('Init Saw'), [])];
    return s;
  }

  function createProject(name, template) {
    name = uniqueName(name); /* never clobber an existing project by accident */
    const s = normalizeSong(blankProject(name, template));
    s.name = name;
    loadSong(s, { announce: false });
    setDirty(false);
    setView('compose');
    closeProjectDialog();
    saveSongAsName(name); /* the new project is saved right away */
    if (SL.Folder && !SL.Folder.connected() && !folderHintShown) {
      folderHintShown = true;
      toast(t('folderHint'));
    }
  }

  function newProject() {
    if (!guardUnsaved('start a new project')) return;
    const suggested = uniqueName('Untitled');
    const name = window.prompt('New project name:', suggested);
    if (name === null) return;
    createProject(name.trim() || suggested, $('#pdTemplate').value);
  }

  function uniqueName(base) {
    let n = base;
    let i = 2;
    while (findSavedSong(n) >= 0) { n = base + ' ' + i; i += 1; }
    return n;
  }

  function openProject(raw, label) {
    if (!guardUnsaved('open "' + (raw && raw.name ? raw.name : 'project') + '"')) return;
    loadSong(SL.clone(raw), { announce: true });
    setDirty(false);
    setView('compose');
    closeProjectDialog();
  }

  function renameSavedSong(i) {
    const s = savedSongs[i];
    if (!s) return;
    const n = window.prompt('Rename project:', s.name);
    if (n === null) return;
    const name = n.trim();
    if (!name || name === s.name) return;
    if (findSavedSong(name) >= 0) { toast('a project named "' + name + '" already exists'); return; }
    const oldName = s.name;
    s.name = name;
    if (song.name === oldName) {
      song.name = name;
      $('#songName').value = name;
    }
    savedSongs.sort((a, b) => a.name.localeCompare(b.name));
    saveSongBank();
    renderProjectDialog();
    toast('renamed to "' + name + '"');
    writeBankSong(s); /* the file follows the new name */
    if (SL.Folder && SL.Folder.connected()) {
      removeBankFile(SL.Folder.fileName({ name: oldName }));
    }
  }

  function duplicateSavedSong(i) {
    const s = savedSongs[i];
    if (!s) return;
    const copy = SL.clone(s);
    copy.name = uniqueName(s.name + ' copy');
    copy.updatedAt = new Date().toISOString();
    savedSongs.push(copy);
    savedSongs.sort((a, b) => a.name.localeCompare(b.name));
    saveSongBank();
    renderProjectDialog();
    toast('duplicated as "' + copy.name + '"');
    writeBankSong(copy);
  }

  function deleteSavedSong(i) {
    const s = savedSongs[i];
    if (!s) return;
    if (!window.confirm('Delete project "' + s.name + '"? This cannot be undone.')) return;
    savedSongs.splice(i, 1);
    saveSongBank();
    renderProjectDialog();
    toast('deleted "' + s.name + '"');
    removeBankSong(s);
  }

  function guardUnsaved(action) {
    if (!dirty) return true;
    return window.confirm('Discard unsaved changes to "' + song.name + '" and ' + action + '?');
  }

  /* ------------------------------------------------------- project dialog */

  function songMeta(s) {
    const notes = (s.tracks || []).reduce((n, t) => n + (t.notes ? t.notes.length : 0), 0);
    return (s.tracks ? s.tracks.length : 0) + ' tracks · ' + notes + ' notes · ' +
      (s.bpm || 120) + ' bpm · ' + (s.bars || 2) + ' bars';
  }

  function when(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function projectRow(s, actions) {
    const row = document.createElement('div');
    row.className = 'pd-row';
    const main = document.createElement('div');
    main.className = 'pd-main';
    const nm = document.createElement('div');
    nm.className = 'pd-name';
    nm.textContent = s.name;
    const meta = document.createElement('div');
    meta.className = 'pd-meta';
    meta.textContent = songMeta(s) + (s.updatedAt ? ' · ' + when(s.updatedAt) : '');
    main.appendChild(nm);
    main.appendChild(meta);
    row.appendChild(main);
    const acts = document.createElement('div');
    acts.className = 'pd-acts';
    actions.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn sm' + (a.danger ? ' danger' : '');
      b.textContent = a.label;
      if (a.tip) {
        b.dataset.tipTitle = a.label;
        b.dataset.tip = a.tip;
      }
      b.addEventListener('click', a.run);
      acts.appendChild(b);
    });
    row.appendChild(acts);
    return row;
  }

  /* ------------------------------------------- a folder linked on the disk */
  let folderFiles = [];
  let folderHintShown = false;

  function updateFolderButton() {
    const b = $('#btnFolder');
    if (!b) return;
    if (!SL.Folder) return;
    const on = SL.Folder.connected();
    if (!SL.Folder.supported() && !on) {
      b.disabled = true;
      b.dataset.tip = t('folderUnsupported');
      return;
    }
    b.disabled = false;
    b.classList.toggle('accent', on);
    b.textContent = on ? SL.Folder.folderName() : t('linkFolder', 'Folder');
    b.dataset.tip = on
      ? (SL.Folder.mode && SL.Folder.mode() === 'http'
        ? t('btnFolderServerTip')
        : 'Linked: ' + SL.Folder.folderName() + ' — saving writes a .song.json file here. Click to unlink.')
      : t('btnFolderTip');
  }

  /* List the .song.json files in the linked folder under Open. */
  function refreshFolder() {
    updateFolderButton();
    const offer = $('#pdFolderOffer');
    if (offer) {
      const want = SL.Folder && !SL.Folder.connected();
      offer.hidden = !want;
      offer.innerHTML = '';
      if (want) {
        const span = document.createElement('span');
        span.textContent = t('folderOffer');
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn sm';
        b.textContent = t('linkFolder', 'Folder');
        b.addEventListener('click', toggleFolder);
        offer.appendChild(span);
        offer.appendChild(b);
      }
    }
    const group = $('#pdFolderGroup');
    const box = $('#pdFolder');
    if (!group || !box) return;
    if (!SL.Folder || !SL.Folder.connected()) {
      group.hidden = true;
      box.innerHTML = '';
      folderFiles = [];
      return;
    }
    group.hidden = false;
    SL.Folder.list().then((files) => {
      folderFiles = files;
      const count = $('#pdFolderCount');
      if (count) count.textContent = files.length ? '(' + files.length + ')' : '';
      box.innerHTML = '';
      files.forEach((f) => {
        const row = projectRow({ name: f.name, bpm: 0, bars: 0, tracks: [] }, [
          { label: 'Open', tip: 'Load this song from the linked folder.', run: () => openFolderSong(f.file) },
          { label: 'Delete', danger: true, tip: 'Delete this file from the linked folder.', run: () => deleteFolderSong(f) }
        ]);
        const meta = row.querySelector('.pd-meta');
        if (meta) meta.textContent = f.file + ' · ' + Math.max(1, Math.round(f.size / 1024)) + ' kB';
        box.appendChild(row);
      });
    }).catch(() => { group.hidden = true; });
  }

  function openFolderSong(file) {
    if (!SL.Folder || !SL.Folder.connected()) return;
    SL.Folder.read(file).then((data) => {
      if (!guardUnsaved('open "' + (data && data.name ? data.name : file) + '"')) return;
      /* the file becomes a known project, so Ctrl+S just writes it back */
      if (data && data.name && findSavedSong(data.name) < 0) {
        savedSongs.push(SL.clone(data));
        savedSongs.sort((a, b) => a.name.localeCompare(b.name));
        saveSongBank();
      }
      loadSong(data, { announce: true });
      setDirty(false);
      setView('compose');
      closeProjectDialog();
    }).catch(() => toast(t('importFailed', 'import failed: bad JSON')));
  }

  function deleteFolderSong(f) {
    if (!window.confirm(t('folderDeleteAsk') + ' (' + f.file + ')')) return;
    const i = findSavedSong(f.name);
    if (i >= 0) {
      savedSongs.splice(i, 1);
      saveSongBank();
    }
    SL.Folder.remove(f.file).then(() => {
      toast(t('folderDeleted') + f.name);
      renderProjectDialog();
    }).catch((e) => toast(t('folderWriteFailed') + (e && e.message ? e.message : e)));
  }

  /* Saving a project also writes it into the linked folder, so the file the
     MCP server works from is always the one on screen. */
  function saveToFolder() {
    if (!SL.Folder || !SL.Folder.connected()) return;
    SL.Folder.write(cleanSong(song)).then((file) => {
      toast(t('folderSaved') + file);
    }).catch((e) => toast(t('folderWriteFailed') + (e && e.message ? e.message : e)));
  }

  /* Write or remove a bank copy's file without touching the open song. */
  function writeBankSong(data) {
    if (!SL.Folder || !SL.Folder.connected()) return;
    SL.Folder.write(data).then(() => refreshFolder())
      .catch((e) => toast(t('folderWriteFailed') + (e && e.message ? e.message : e)));
  }

  function removeBankFile(file) {
    if (!SL.Folder || !SL.Folder.connected()) return;
    SL.Folder.remove(file).then(() => refreshFolder()).catch(() => { /* never written */ });
  }

  function removeBankSong(data) {
    if (!SL.Folder || !SL.Folder.connected()) return;
    removeBankFile(SL.Folder.fileName(data));
  }

  function toggleFolder() {
    if (!SL.Folder) return;
    if (SL.Folder.mode && SL.Folder.mode() === 'fs') {
      if (!window.confirm(t('folderUnlinkAsk'))) return;
      SL.Folder.disconnect().then(() => {
        toast(t('folderUnlinked'));
        refreshFolder();
      });
      return;
    }
    if (!SL.Folder.supported()) {
      toast(SL.Folder.connected() ? t('folderServerActive') : t('folderUnsupported'));
      return;
    }
    SL.Folder.connect().then(() => {
      folderHintShown = true;
      toast(t('folderLinked') + SL.Folder.folderName());
      refreshFolder();
      saveToFolder(); /* put the open song on disk right away */
    }).catch(() => toast(t('folderDenied')));
  }

  function renderProjectDialog() {
    const saved = $('#pdSaved');
    const ex = $('#pdExamples');
    saved.innerHTML = '';
    refreshFolder();
    ex.innerHTML = '';
    $('#pdSavedCount').textContent = savedSongs.length ? '(' + savedSongs.length + ')' : '';

    if (!savedSongs.length) {
      const e = document.createElement('div');
      e.className = 'pd-empty';
      e.textContent = 'nothing saved yet — create a project and press Save';
      saved.appendChild(e);
    }
    savedSongs.forEach((s, i) => {
      saved.appendChild(projectRow(s, [
        { label: 'Open', tip: 'Load this project, replacing what is open now.', run: () => openProject(s) },
        { label: 'Rename', tip: 'Change the project name.', run: () => renameSavedSong(i) },
        { label: 'Duplicate', tip: 'Save a copy under a new name.', run: () => duplicateSavedSong(i) },
        { label: 'Delete', danger: true, tip: 'Delete this project permanently. Cannot be undone.', run: () => deleteSavedSong(i) }
      ]));
    });
    SL.EXAMPLE_SONGS.forEach((s) => {
      ex.appendChild(projectRow(s, [
        { label: 'Open', tip: 'Load this demo song as a starting point.', run: () => openProject(s) }
      ]));
    });
    $('#pdHint').textContent = song ? 'current: ' + song.name + (dirty ? ' (unsaved)' : '') : '';
  }

  const openProjectDialog = () => {
    renderProjectDialog();
    $('#projectDialog').hidden = false;
    $('#pdNewName').value = uniqueName('Untitled');
    $('#pdNewName').focus();
    $('#pdNewName').select();
  };
  const closeProjectDialog = () => { $('#projectDialog').hidden = true; };

  function exportMidi() {
    try {
      const bytes = SL.songToMidi(song);
      download((song.name || 'song').replace(/[^\w\-]+/g, '_') + '.mid',
        new Blob([bytes], { type: 'audio/midi' }));
      toast('exported MIDI — ' + song.tracks.length + ' tracks, ' + song.bpm + ' bpm');
    } catch (err) {
      toast('MIDI export failed: ' + (err && err.message ? err.message : err));
    }
  }

  async function exportWav() {
    const btn = $('#btnWav');
    btn.disabled = true;
    const label = btn.innerHTML;
    btn.innerHTML = 'rendering…';
    try {
      const snapshot = normalizeSong(cleanSong(song));
      const buffer = await composer.renderOffline(snapshot);
      const blob = SL.encodeWav(buffer);
      download((song.name || 'song').replace(/[^\w\-]+/g, '_') + '.wav', blob);
      toast('exported ' + buffer.duration.toFixed(1) + 's WAV');
    } catch (err) {
      toast('render failed: ' + (err && err.message ? err.message : err));
    }
    btn.disabled = false;
    btn.innerHTML = label;
  }

  /* ------------------------------------------------------------- A/B + UI */

  function initToolbar() {
    document.querySelectorAll('.btn.tab').forEach((b) => {
      b.addEventListener('click', () => setView(b.dataset.view));
    });

    $('#btnSave').addEventListener('click', () => saveCurrentPatch(false));
    $('#btnSaveAs').addEventListener('click', () => saveCurrentPatch(true));
    $('#btnDelete').addEventListener('click', deleteCurrentPatch);

    $('#presetSelect').addEventListener('change', (e) => {
      const v = e.target.value;
      if (!v) return;
      const p = v[0] === 'f' ? SL.FACTORY_PRESETS[+v.slice(2)] : userPresets[+v.slice(2)];
      if (p) applyPatchToTrack(p);
      e.target.value = '';
    });

    document.querySelectorAll('.btn.slot').forEach((b) => {
      b.addEventListener('click', () => {
        const s = b.dataset.slot;
        slots.active = s;
        if (slots[s]) applyPatchToTrack(slots[s]);
        else toast('slot ' + s + ' is empty — press Store');
        updateSlotButtons();
      });
    });
    $('#btnStore').addEventListener('click', () => {
      slots[slots.active] = SL.clone(patch);
      saveSlots();
      updateSlotButtons();
      toast('stored to slot ' + slots.active);
    });
    updateSlotButtons();

    $('#btnRandom').addEventListener('click', () => applyPatchToTrack(randomPatch()));
    $('#btnInit').addEventListener('click', () => {
      const p = SL.defaultPatch();
      p.name = 'Init';
      applyPatchToTrack(p);
    });

    $('#btnExport').addEventListener('click', () => {
      download((patch.name || 'patch').replace(/[^\w\-]+/g, '_') + '.synthlab.json', patch);
      toast('exported patch');
    });
    $('#btnImport').addEventListener('click', () => $('#fileInput').click());
    $('#fileInput').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(String(r.result));
          if (Array.isArray(data)) {
            data.forEach((p) => { if (p && p.name) userPresets.push(SL.mergePatch(SL.defaultPatch(), p)); });
            userPresets.sort((a, b) => a.name.localeCompare(b.name));
            saveUserPresets();
            refreshPresetList();
            renderTracks();
            toast('imported ' + data.length + ' patches');
          } else {
            applyPatchToTrack(data);
          }
        } catch (err) {
          toast('import failed: bad JSON');
        }
      };
      r.readAsText(f);
      e.target.value = '';
    });

    $('#btnNew').addEventListener('click', newProject);
    $('#btnOpen').addEventListener('click', openProjectDialog);
    $('#btnSongSave').addEventListener('click', saveCurrentSong);
    $('#btnFolder').addEventListener('click', toggleFolder);
    $('#btnSongSaveAs').addEventListener('click', () => saveSongAs(true));
    $('#pdClose').addEventListener('click', closeProjectDialog);
    $('#pdCreate').addEventListener('click', () => {
      const name = $('#pdNewName').value.trim() || uniqueName('Untitled');
      $('#pdNewName').value = name;
      if (guardUnsaved('start a new project')) createProject(name, $('#pdTemplate').value);
    });
    $('#pdNewName').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $('#pdCreate').click();
    });
    $('#btnHelp').addEventListener('click', () => setView('help'));
    $('#pdImport').addEventListener('click', () => $('#songFileInput').click());
    $('#projectDialog').addEventListener('click', (e) => {
      if (e.target === $('#projectDialog')) closeProjectDialog();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!$('#projectDialog').hidden) { closeProjectDialog(); return; }
        if (view === 'compose' && (roll.sel || roll.cursor !== null)) {
          clearEditState();
          return;
        }
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveCurrentSong(); return; }
      if (view !== 'compose') return;
      const typing = !!(e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName));
      const k = e.key.toLowerCase();
      /* while typing, leave copy/cut/paste/select-all to the browser */
      if (typing && (k === 'c' || k === 'x' || k === 'v' || k === 'a' || k === 'z' || k === 'y') && mod) return;
      if (mod && k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && ((k === 'z' && e.shiftKey) || k === 'y')) { e.preventDefault(); redo(); return; }
      if (typing && (e.key === 'Delete' || e.key === 'Backspace')) return;
      if (typing) return;
      if (mod && k === 'a') { e.preventDefault(); selectAllNotes(); return; }
      if (mod && k === 'c') { e.preventDefault(); copySelection(false); return; }
      if (mod && k === 'x') { e.preventDefault(); copySelection(true); return; }
      if (mod && k === 'v') { e.preventDefault(); pasteClipboard(); return; }
      if (mod && k === 'd') { e.preventDefault(); duplicateSelection(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelection(); return; }
      if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); nudgeSelection(0, 1); return; }
      if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); nudgeSelection(0, -1); return; }
      if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); nudgeSelection(1, 0); return; }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); nudgeSelection(-1, 0); return; }
    });
    $('#btnWav').addEventListener('click', exportWav);
    document.querySelectorAll('.btn.lang').forEach((b) => {
      b.addEventListener('click', () => applyLang(b.dataset.lang));
    });
    $('#btnSongMidi').addEventListener('click', exportMidi);
    $('#btnSongJson').addEventListener('click', () => {
      download((song.name || 'song').replace(/[^\w\-]+/g, '_') + '.song.json', cleanSong(song));
      toast('exported song JSON');
    });
    $('#btnSongImport').addEventListener('click', () => $('#songFileInput').click());
    $('#songFileInput').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          loadSong(JSON.parse(String(r.result)), { announce: true });
          setDirty(true);
        } catch (err) {
          toast('import failed: bad JSON');
        }
      };
      r.readAsText(f);
      e.target.value = '';
    });

    $('#btnPanic').addEventListener('click', panic);
    $('#patchName').addEventListener('change', () => {
      patch.name = $('#patchName').value.trim() || 'Untitled';
      renderTracks();
      saveSession();
    });
    $('#songName').addEventListener('change', () => {
      song.name = $('#songName').value.trim() || 'Untitled';
      $('#songName').value = song.name;
      markDirty();
      saveSession();
    });

    document.addEventListener('pointerdown', () => composerEnsure(), { once: true });
  }

  function updateSlotButtons() {
    document.querySelectorAll('.btn.slot').forEach((b) => {
      b.classList.toggle('on', b.dataset.slot === slots.active);
      b.classList.toggle('filled', !!slots[b.dataset.slot]);
    });
  }

  function setView(v) {
    view = v;
    document.body.classList.toggle('view-compose', v === 'compose');
    document.body.classList.toggle('view-patch', v === 'patch');
    document.body.classList.toggle('view-help', v === 'help');
    document.querySelectorAll('.btn.tab').forEach((b) => {
      b.classList.toggle('on', b.dataset.view === v);
    });
    if (v === 'patch') {
      refreshControls();
      updatePatchBar();
    } else if (v === 'compose') {
      roll.resize();
      roll.draw();
    }
  }

  const rndLog = (lo, hi) => lo * Math.pow(hi / lo, Math.random());

  function randomPatch() {
    const p = SL.defaultPatch();
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    p.name = 'Random ' + (100 + Math.floor(Math.random() * 900));
    p.osc1.type = pick(SL.WAVES);
    p.osc1.level = 0.4 + Math.random() * 0.4;
    p.osc1.octave = pick([-2, -1, 0, 0, 0]);
    p.osc1.semi = pick([0, 0, 0, 7, -5, 12]);
    p.osc1.detune = (Math.random() * 2 - 1) * 18;
    p.osc2.type = pick(SL.WAVES);
    p.osc2.level = Math.random() * 0.6;
    p.osc2.octave = pick([-2, -1, 0, 0, 1]);
    p.osc2.semi = pick([0, 0, 0, -7, 7]);
    p.osc2.detune = (Math.random() * 2 - 1) * 30;
    p.sub.level = Math.random() * 0.45;
    p.sub.octave = pick([-2, -1, -1]);
    p.noise.level = Math.random() < 0.25 ? Math.random() * 0.3 : 0;
    p.unison.voices = pick([1, 1, 2, 3, 3, 5]);
    p.unison.detune = Math.random() * 32;
    p.unison.width = 0.2 + Math.random() * 0.8;
    p.glide = Math.random() < 0.7 ? 0 : rndLog(0.01, 0.3);
    p.filter.type = pick(SL.FILTERS);
    p.filter.cutoff = 140 * Math.pow(2, Math.random() * 7);
    p.filter.reso = 0.5 + Math.random() * 12;
    p.filter.keytrack = Math.random() * 0.7;
    p.filter.envAmt = Math.random() * 75;
    p.filtEnv.a = rndLog(0.002, 2.2);
    p.filtEnv.d = rndLog(0.02, 2.5);
    p.filtEnv.s = Math.random();
    p.ampEnv.a = rndLog(0.002, 1.5);
    p.ampEnv.d = rndLog(0.03, 2.5);
    p.ampEnv.s = Math.random();
    p.ampEnv.r = rndLog(0.02, 4);
    [1, 2].forEach((i) => {
      const l = p['lfo' + i];
      l.wave = pick(SL.WAVES);
      l.target = pick(SL.LFO_TARGETS);
      l.rate = rndLog(0.08, 18);
      l.depth = Math.random() < 0.4 ? 0 : Math.random() * 60;
    });
    p.drive.amount = Math.random() < 0.55 ? 0 : Math.random() * 0.5;
    p.drive.tone = 0.25 + Math.random() * 0.7;
    p.chorus.rate = rndLog(0.1, 4);
    p.chorus.depth = Math.random() < 0.5 ? 0 : Math.random();
    p.chorus.mix = p.chorus.depth ? Math.random() * 0.5 : 0;
    p.delay.time = rndLog(0.03, 0.9);
    p.delay.feedback = Math.random() < 0.4 ? 0 : Math.random() * 0.6;
    p.delay.mix = p.delay.feedback ? Math.random() * 0.4 : 0;
    p.reverb.size = rndLog(0.4, 7);
    p.reverb.mix = Math.random() * 0.6;
    return p;
  }

  /* ------------------------------------------------------------------ boot */

  function boot() {
    let session = null;
    try { session = JSON.parse(localStorage.getItem(LS_SESSION) || 'null'); } catch (e) { session = null; }

    roll = new SL.PianoRoll($('#roll'), { stepW: 22, rowH: 14, lo: 24, hi: 96, defaultLen: 2 });
    roll.onChange = () => {
      Tip.hide();
      reindex();
      markDirty();
      saveSession();
    };
    roll.onSelect = (sel) => {
      if (sel) roll.clearCursor();
      updateSelReadout();
    };
    roll.onCursor = () => { updateSelReadout(); };
    roll.onBeforeEdit = () => { pushUndo(); };
    roll.canPaste = () => !!(clip.notes && clip.notes.length);
    roll.onTrackPick = (i) => { selectTrack(i); };

    Tip.init();
    buildRack();
    let startLang = 'en';
    try { startLang = localStorage.getItem('synthlab.lang') || 'en'; } catch (e) { startLang = 'en'; }
    if (I18N.LANGS.indexOf(startLang) < 0) startLang = 'en';
    initKeyboardInput();
    initAnalyser();
    initMidi();
    initTransport();
    initEditBar();
    initTrackViewControls();
    initToolbar();
    loadStore();
    refreshPresetList();
    renderProjectDialog();
    renderKeyboard();

    setView('compose');
    loadSong(session || SL.clone(SL.EXAMPLE_SONGS[0]), { announce: false });
    setDirty(!!session && findSavedSong(song.name) < 0);
    applyLang(startLang);
    updatePlayButton();
    startAutosave();
    updateFolderButton();
    if (SL.Folder) {
      SL.Folder.restore().then((m) => {
        updateFolderButton();
        refreshFolder();
        if (m === 'fs') toast(t('folderLinked') + SL.Folder.folderName());
        if (m === 'http') toast(t('folderServerActive'));
      });
    }
  }

  boot();

  window.SYNTHLAB = {
    get song() { return song; },
    get composer() { return composer; },
    get track() { return currentTrack(); },
    get patch() { return patch; },
    roll: () => roll,
    load: (s) => loadSong(s, { announce: true }),
    random: randomPatch,
    noteOn: (n, v) => press(n, v === undefined ? 0.9 : v),
    noteOff: (n) => lift(n),
    set: setParam,
    play: () => togglePlay(),
    wav: exportWav,
    midi: exportMidi,
    clear: clearEditState,
    undo: undo,
    redo: redo,
    selectRegion: (r) => roll.setSelection(r),
    selectTrack: (i) => selectTrack(i),
    showTrack: (i, on) => {
      song.tracks[i].show = !!on;
      syncRollVisible();
      renderTracks();
      saveSession();
    },
    copy: copySelection,
    paste: pasteClipboard,
    duplicate: duplicateSelection,
    nudge: nudgeSelection,
    tip: Tip
  };
})();
