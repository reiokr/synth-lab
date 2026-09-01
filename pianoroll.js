/* SYNTH LAB — canvas piano roll, with marquee selection */
(function (global) {
  'use strict';

  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const BLACK = [1, 3, 6, 8, 10];
  const PALETTE = ['#5fe0a8', '#7cc4ff', '#ff8a3d', '#c792ea', '#ffd23d', '#ff6b8b', '#4fd6d2', '#a3e635'];

  const trackColor = (i) => PALETTE[i % PALETTE.length];
  const isBlackKey = (p) => BLACK.indexOf(((p % 12) + 12) % 12) >= 0;
  const totalOf = (song) => global.SynthLab.totalSteps(song || { bars: 2, stepsPerBar: 16 });

  function PianoRoll(canvas, opts) {
    const o = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.song = null;
    this.trackIndex = -1;
    this.visible = [];
    this.rowH = o.rowH || 14;
    this.stepW = o.stepW || 20;
    this.lo = o.lo === undefined ? 24 : o.lo;
    this.hi = o.hi === undefined ? 96 : o.hi;
    this.defaultLen = o.defaultLen || 2;
    this.playStep = -1;
    this.color = '#5fe0a8';
    this.onChange = null;
    this.onSelect = null;
    this.onCursor = null;
    this.canPaste = null;
    this.onBeforeEdit = null;
    this.scale = null;
    this.snapScale = false;
    this.noMenu = false;
    this.onTrackPick = null;
    this.drag = null;
    this.hover = null;
    this.mode = 'draw';
    this.sel = null;
    this.marquee = null;
    this.cursor = null;
    this.cursorPitch = null;
    this._bind();
  }

  PianoRoll.prototype.setSong = function (song, trackIndex, visible) {
    this.song = song;
    this.trackIndex = trackIndex;
    this.visible = (visible && visible.length) ? visible.slice() : [trackIndex];
    this.color = trackColor(Math.max(trackIndex, 0));
    this.sel = null;
    this.marquee = null;
    this.resize();
    this.draw();
  };

  PianoRoll.prototype.setVisible = function (visible) {
    this.visible = (visible && visible.length) ? visible.slice() : [this.trackIndex];
    this.sel = null;
    this.marquee = null;
    this.draw();
    if (this.onSelect) this.onSelect(null);
  };

  PianoRoll.prototype.drawnTracks = function () {
    const out = [];
    if (!this.song) return out;
    for (let i = 0; i < this.visible.length; i++) {
      const ti = this.visible[i];
      const t = this.song.tracks[ti];
      if (t) out.push({ index: ti, track: t, selected: ti === this.trackIndex });
    }
    return out.sort(function (a, b) { return (a.selected ? 1 : 0) - (b.selected ? 1 : 0); });
  };

  /* hit-test a note in any drawn track — used to click a ghost note and take over that track */
  PianoRoll.prototype.findNoteIn = function (track, step, pitch) {
    if (!track) return null;
    for (let i = 0; i < track.notes.length; i++) {
      const n = track.notes[i];
      if (n.pitch === pitch && step >= n.step && step < n.step + Math.max(1, n.len)) return n;
    }
    return null;
  };

  PianoRoll.prototype.track = function () {
    if (!this.song || this.trackIndex < 0) return null;
    return this.song.tracks[this.trackIndex] || null;
  };

  PianoRoll.prototype.rows = function () { return this.hi - this.lo + 1; };

  PianoRoll.prototype.resize = function () {
    const dpr = Math.min(global.devicePixelRatio || 1, 2);
    const w = Math.max(240, totalOf(this.song) * this.stepW);
    const h = this.rows() * this.rowH;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cssW = w;
    this.cssH = h;
  };

  PianoRoll.prototype.setZoom = function (stepW) {
    this.stepW = Math.max(8, Math.min(64, stepW));
    this.resize();
    this.draw();
  };

  PianoRoll.prototype.setScale = function (root, type, snap) {
    this.scale = { root: ((root % 12) + 12) % 12, type: type || 'chromatic' };
    if (snap !== undefined) this.snapScale = !!snap;
    this.draw();
  };

  PianoRoll.prototype.snapPitch = function (pitch) {
    if (!this.snapScale || !this.scale || this.scale.type === 'chromatic') return pitch;
    return global.SynthLab.snapPitch(pitch, this.scale.root, this.scale.type);
  };

  PianoRoll.prototype.pitchAt = function (y) { return this.hi - Math.floor(y / this.rowH); };
  PianoRoll.prototype.stepAt = function (x) { return Math.floor(x / this.stepW); };

  PianoRoll.prototype.findNote = function (step, pitch) {
    const t = this.track();
    if (!t) return null;
    for (let i = 0; i < t.notes.length; i++) {
      const n = t.notes[i];
      if (n.pitch === pitch && step >= n.step && step < n.step + Math.max(1, n.len)) return n;
    }
    return null;
  };

  /* ------------------------------------------------------------ selection */

  PianoRoll.prototype.normRect = function (a0, a1, b0, b1) {
    const total = totalOf(this.song);
    return {
      s0: Math.max(0, Math.min(total - 1, Math.min(a0, a1))),
      s1: Math.max(0, Math.min(total - 1, Math.max(a0, a1))),
      p0: Math.max(0, Math.min(127, Math.min(b0, b1))),
      p1: Math.max(0, Math.min(127, Math.max(b0, b1)))
    };
  };

  PianoRoll.prototype.isSelected = function (n) {
    const s = this.sel;
    if (!s) return false;
    return n.pitch >= s.p0 && n.pitch <= s.p1 && n.step >= s.s0 && n.step <= s.s1;
  };

  PianoRoll.prototype.setSelection = function (r) {
    const was = JSON.stringify(this.sel);
    this.sel = this.normRect(r.s0, r.s1, r.p0, r.p1);
    this.marquee = null;
    this.draw();
    if (was !== JSON.stringify(this.sel) && this.onSelect) this.onSelect(this.sel);
  };

  PianoRoll.prototype.clearSelection = function () {
    if (!this.sel) return;
    this.sel = null;
    this.marquee = null;
    this.draw();
    if (this.onSelect) this.onSelect(null);
  };

  PianoRoll.prototype.selectedNotes = function () {
    const t = this.track();
    if (!t || !this.sel) return [];
    return t.notes.filter((n) => this.isSelected(n));
  };

  /* step = when, pitch = the row the pasted region's lowest note lands on */
  PianoRoll.prototype.setCursor = function (step, pitch) {
    const total = totalOf(this.song);
    const nextStep = step === null || step === undefined
      ? null : Math.max(0, Math.min(total - 1, Math.round(step)));
    const nextPitch = pitch === null || pitch === undefined
      ? null : Math.max(0, Math.min(127, Math.round(pitch)));
    const wantPitch = nextStep === null ? null : (nextPitch === null ? this.cursorPitch : nextPitch);
    if (nextStep === this.cursor && wantPitch === this.cursorPitch) return;
    this.cursor = nextStep;
    this.cursorPitch = wantPitch;
    this.draw();
    if (this.onCursor) this.onCursor(this.cursor, this.cursorPitch);
  };

  PianoRoll.prototype.clearCursor = function () {
    this.cursor = null;
    this.cursorPitch = null;
    this.draw();
    if (this.onCursor) this.onCursor(null, null);
  };

  PianoRoll.prototype.selectAll = function () {
    const t = this.track();
    if (!t || !t.notes.length) return false;
    let s0 = Infinity, s1 = -Infinity, p0 = Infinity, p1 = -Infinity;
    t.notes.forEach((n) => {
      if (n.step < s0) s0 = n.step;
      if (n.step > s1) s1 = n.step;
      if (n.pitch < p0) p0 = n.pitch;
      if (n.pitch > p1) p1 = n.pitch;
    });
    this.setSelection({ s0: s0, s1: s1, p0: p0, p1: p1 });
    return true;
  };

  /* ----------------------------------------------------------------- draw */

  PianoRoll.prototype.roundRect = function (x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  PianoRoll.prototype.draw = function () {
    const ctx = this.ctx;
    const w = this.cssW, h = this.cssH;
    const total = totalOf(this.song);
    const rowH = this.rowH, stepW = this.stepW;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0e1218';
    ctx.fillRect(0, 0, w, h);

    const sc = this.scale;
    const scaleOn = !!(sc && sc.type && sc.type !== 'chromatic');

    for (let p = this.lo; p <= this.hi; p++) {
      const y = (this.hi - p) * rowH;
      let fill = isBlackKey(p) ? '#12161d' : '#171d26';
      if (scaleOn) {
        const rel = (((p - sc.root) % 12) + 12) % 12;
        if (!global.SynthLab.inScale(p, sc.root, sc.type)) {
          fill = isBlackKey(p) ? '#0c0f14' : '#0f131a';
        } else if (rel === 0) {
          fill = isBlackKey(p) ? '#1c2733' : '#1f2c3a';
        }
      }
      ctx.fillStyle = fill;
      ctx.fillRect(0, y, w, rowH);
      if (p % 12 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, y, w, 1);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.font = '9px ui-monospace, monospace';
        ctx.fillText(NAMES[p % 12] + (Math.floor(p / 12) - 1), 3, y + rowH - 3);
      }
    }

    for (let s = 0; s <= total; s++) {
      const x = Math.round(s * stepW) + 0.5;
      ctx.strokeStyle = s % 16 === 0 ? 'rgba(255,255,255,0.20)'
        : (s % 4 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)');
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const m = this.marquee || this.sel;
    if (m) {
      const x = m.s0 * stepW;
      const bw = (m.s1 - m.s0 + 1) * stepW;
      const y = (this.hi - m.p1) * rowH;
      const bh = (m.p1 - m.p0 + 1) * rowH;
      ctx.fillStyle = 'rgba(124,196,255,0.10)';
      ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = this.marquee ? 'rgba(150,214,255,0.85)' : 'rgba(124,196,255,0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash(this.marquee ? [4, 3] : [3, 3]);
      ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(bw), Math.round(bh));
      ctx.setLineDash([]);
    }

    const drawn = this.drawnTracks();
    for (let d = 0; d < drawn.length; d++) {
      const entry = drawn[d];
      const t = entry.track;
      const isSel = entry.selected;
      const base = trackColor(entry.index);
      for (let i = 0; i < t.notes.length; i++) {
        const n = t.notes[i];
        const picked = isSel && this.isSelected(n);
        const flashing = !!(this.flashNotes && this.flashNotes.indexOf(n) >= 0 &&
          (global.performance ? global.performance.now() : Date.now()) < this.flashUntil);
        const x = n.step * stepW;
        const y = (this.hi - n.pitch) * rowH;
        const nw = Math.max(4, Math.max(1, n.len) * stepW - 2);
        const nh = rowH - 3;
        ctx.fillStyle = flashing ? '#ffffff' : base;
        ctx.globalAlpha = flashing ? 0.92 : (isSel
          ? ((picked ? 0.45 : 0.28) + (n.vel === undefined ? 0.9 : n.vel) * 0.72)
          : (0.16 + (n.vel === undefined ? 0.9 : n.vel) * 0.22));
        this.roundRect(x, y + 1.5, nw, nh, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (picked) {
          ctx.strokeStyle = 'rgba(255,255,255,0.95)';
          ctx.lineWidth = 1.5;
        } else if (isSel) {
          ctx.strokeStyle = 'rgba(0,0,0,0.45)';
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,0.30)';
          ctx.lineWidth = 1;
        }
        ctx.stroke();
      }
    }

    if (this.cursor !== null) {
      const x = Math.round(this.cursor * stepW) + 0.5;
      ctx.strokeStyle = 'rgba(255,182,72,0.9)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffb648';
      ctx.beginPath();
      ctx.moveTo(x - 4.5, 0);
      ctx.lineTo(x + 4.5, 0);
      ctx.lineTo(x, 7);
      ctx.closePath();
      ctx.fill();
      if (this.cursorPitch !== null) {
        const top = (this.hi - this.cursorPitch) * rowH;
        ctx.strokeStyle = '#ffb648';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 1, top + 1);
        ctx.lineTo(x + 9, top + 1);
        ctx.moveTo(x + 1, top);
        ctx.lineTo(x + 1, top + 9);
        ctx.stroke();
      }
    }

    if (this.playStep >= 0) {
      const x = this.playStep * stepW;
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(x, 0, 2, h);
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(Math.max(0, x - stepW * 2), 0, stepW * 2, h);
    }
  };

  PianoRoll.prototype.reveal = function (s0, s1, p0, p1) {
    const wrap = this.canvas.parentElement;
    if (!wrap) return;
    const x0 = s0 * this.stepW;
    const x1 = (s1 + 1) * this.stepW;
    const y0 = (this.hi - p1) * this.rowH;
    const y1 = (this.hi - p0 + 1) * this.rowH;
    const vl = wrap.scrollLeft, vr = vl + wrap.clientWidth;
    const vt = wrap.scrollTop, vb = vt + wrap.clientHeight;
    if (x0 < vl + 12 || x1 > vr - 12) {
      wrap.scrollLeft = Math.max(0, Math.min(x0 - wrap.clientWidth * 0.25, this.cssW - wrap.clientWidth));
    }
    if (y0 < vt + 8 || y1 > vb - 8) {
      wrap.scrollTop = Math.max(0, Math.min(y0 - wrap.clientHeight * 0.35, this.cssH - wrap.clientHeight));
    }
  };

  PianoRoll.prototype.revealTrack = function () {
    const t = this.track();
    if (!t || !t.notes.length) return;
    let s0 = Infinity, s1 = -Infinity, p0 = Infinity, p1 = -Infinity;
    t.notes.forEach((n) => {
      if (n.step < s0) s0 = n.step;
      if (n.step > s1) s1 = n.step;
      if (n.pitch < p0) p0 = n.pitch;
      if (n.pitch > p1) p1 = n.pitch;
    });
    this.reveal(s0, s1, p0, p1);
  };

  PianoRoll.prototype.flash = function (notes) {
    if (!notes || !notes.length) return;
    this.flashNotes = notes.slice();
    this.flashUntil = (global.performance ? global.performance.now() : Date.now()) + 520;
    clearTimeout(this._flashT);
    const self = this;
    const tick = function () {
      self.draw();
      if ((global.performance ? global.performance.now() : Date.now()) < self.flashUntil) {
        self._flashT = setTimeout(tick, 55);
      } else {
        self.flashNotes = null;
        self.draw();
      }
    };
    tick();
  };

  PianoRoll.prototype.setPlayStep = function (s) {
    if (s === this.playStep) return;
    this.playStep = s;
    this.draw();
  };

  PianoRoll.prototype.localPos = function (e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  /* ------------------------------------------------------------- editing */

  PianoRoll.prototype._bind = function () {
    const cv = this.canvas;
    const self = this;

    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    cv.addEventListener('pointerdown', function (e) {
      const t = self.track();
      if (!t || !self.song) return;
      self.noMenu = false;
      try { cv.focus({ preventScroll: true }); } catch (err) { /* older browsers */ }
      if (e.button === 2 || e.altKey) {
        const p = self.localPos(e);
        const hit = self.findNote(
          Math.max(0, Math.min(totalOf(self.song) - 1, self.stepAt(p.x))),
          self.pitchAt(p.y)
        );
        if (hit) {
          if (self.onBeforeEdit) self.onBeforeEdit();
          t.notes.splice(t.notes.indexOf(hit), 1);
          /* a right-click that deleted a note must not also pop the menu */
          if (e.button === 2) self.noMenu = true;
          self.draw();
          if (self.onChange) self.onChange();
        }
        return;
      }
      if (e.button !== 0) return;

      const pos = self.localPos(e);
      const total = totalOf(self.song);
      const step = Math.max(0, Math.min(total - 1, self.stepAt(pos.x)));
      const pitch = self.snapPitch(Math.max(0, Math.min(127, self.pitchAt(pos.y))));
      const hit = self.findNote(step, pitch);

      /* Clicking a faded note of another visible track is a handy shortcut to
         switch to it — but never while a copy is waiting to be placed, since
         then the click is meant to move the paste cursor. */
      if (!hit && !(self.canPaste && self.canPaste())) {
        const drawn = self.drawnTracks();
        for (let i = 0; i < drawn.length; i++) {
          if (drawn[i].selected) continue;
          if (self.findNoteIn(drawn[i].track, step, pitch)) {
            if (self.onTrackPick) self.onTrackPick(drawn[i].index);
            e.preventDefault();
            return;
          }
        }
      }
      /* capture is best-effort: some pointers (or a pointer released between
         the event and this call) make it throw, and that must never abort the
         rest of the handler — otherwise the click would silently do nothing */
      const capture = function () {
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
      };
      capture();

      /* in select mode, dragging a note that is already selected moves the
         whole selection — that has to take priority over the marquee */
      if (self.mode === 'select' && hit && self.sel && self.isSelected(hit)) {
        const list = self.selectedNotes().map((n) => ({ n: n, step: n.step, pitch: n.pitch, len: Math.max(1, n.len) }));
        if (self.onBeforeEdit) self.onBeforeEdit();
        self.drag = { mode: 'moveSel', list: list, startX: pos.x, startY: pos.y };
        e.preventDefault();
        return;
      }

      /* marquee selection: shift-drag anywhere, or any drag in select mode */
      const wantMarquee = e.shiftKey || self.mode === 'select';
      if (wantMarquee) {
        self.drag = { mode: 'marquee', startX: pos.x, startY: pos.y, s0: step, p0: pitch, hit: hit };
        self.marquee = self.normRect(step, step, pitch, pitch);
        if (!e.shiftKey) self.sel = null;
        self.draw();
        e.preventDefault();
        return;
      }

      if (hit && self.sel && self.isSelected(hit) && self.mode === 'select') {
        const list = self.selectedNotes().map((n) => ({ n: n, step: n.step, pitch: n.pitch, len: Math.max(1, n.len) }));
        self.drag = { mode: 'moveSel', list: list, startX: pos.x, startY: pos.y };
        e.preventDefault();
        return;
      }

      if (hit) {
        const right = (hit.step + Math.max(1, hit.len)) * self.stepW;
        if (self.mode === 'select') {
          self.setSelection({ s0: hit.step, s1: hit.step, p0: hit.pitch, p1: hit.pitch });
          self.drag = {
            mode: 'moveSel',
            list: [{ n: hit, step: hit.step, pitch: hit.pitch, len: Math.max(1, hit.len) }],
            startX: pos.x, startY: pos.y
          };
        } else {
          self.drag = {
            mode: pos.x > right - 7 ? 'resize' : 'move',
            note: hit, startX: pos.x, startY: pos.y,
            origStep: hit.step, origPitch: hit.pitch, origLen: Math.max(1, hit.len)
          };
        }
      } else if (self.mode === 'select' && self.canPaste && self.canPaste()) {
        self.clearSelection();
        self.setCursor(step);
      } else {
        self.clearSelection();
        if (self.onBeforeEdit) self.onBeforeEdit();
        const n = { step: step, len: self.defaultLen, pitch: pitch, vel: 0.9 };
        t.notes.push(n);
        self.drag = {
          mode: 'resize', note: n, startX: pos.x, startY: pos.y,
          origStep: step, origPitch: pitch, origLen: self.defaultLen
        };
        self.draw();
      }
      e.preventDefault();
    });

    cv.addEventListener('pointermove', function (e) {
      const pos = self.localPos(e);
      self.hover = { step: self.stepAt(pos.x), pitch: self.pitchAt(pos.y) };
      const d = self.drag;
      if (!d || !self.song) return;
      const total = totalOf(self.song);

      if (d.mode === 'marquee') {
        const step = Math.max(0, Math.min(total - 1, self.stepAt(pos.x)));
        const pitch = Math.max(0, Math.min(127, self.pitchAt(pos.y)));
        self.marquee = self.normRect(d.s0, step, d.p0, pitch);
        self.draw();
        return;
      }
      if (d.mode === 'moveSel') {
        const dStep = self.stepAt(pos.x) - self.stepAt(d.startX);
        const dPitch = -Math.round((pos.y - d.startY) / self.rowH);
        d.list.forEach((it) => {
          it.n.step = Math.max(0, Math.min(total - it.len, it.step + dStep));
          it.n.pitch = self.snapPitch(Math.max(0, Math.min(127, it.pitch + dPitch)));
        });
        self.draw();
        return;
      }
      if (d.mode === 'resize') {
        const s = Math.max(0, Math.min(total - 1, self.stepAt(pos.x)));
        d.note.len = Math.max(1, Math.min(s - d.origStep + 1, total - d.origStep));
      } else {
        const dStep = self.stepAt(pos.x) - self.stepAt(d.startX);
        const dPitch = -Math.round((pos.y - d.startY) / self.rowH);
        const len = Math.max(1, d.origLen);
        d.note.step = Math.max(0, Math.min(total - len, d.origStep + dStep));
        d.note.pitch = self.snapPitch(Math.max(0, Math.min(127, d.origPitch + dPitch)));
      }
      self.draw();
    });

    const finish = function (e) {
      const d = self.drag;
      if (!d) return;
      self.drag = null;
      try { cv.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }

      if (d.mode === 'marquee') {
        const m = self.marquee;
        self.marquee = null;
        const dragged = m && (m.s1 > m.s0 || m.p1 > m.p0);
        if (m && dragged) {
          const was = JSON.stringify(self.sel);
          self.sel = m;
          if (was !== JSON.stringify(self.sel) && self.onSelect) self.onSelect(self.sel);
        } else if (d.hit && !e.shiftKey) {
          const n = d.hit;
          self.setSelection({ s0: n.step, s1: n.step, p0: n.pitch, p1: n.pitch });
        } else if (!e.shiftKey) {
          /* a plain click, not a drag: clear the selection and, in select
             mode, drop the paste cursor on that step and row. With nothing to
             paste that would be a dead end, so fall back to writing a note. */
          self.clearSelection();
          if (self.mode === 'select' && self.canPaste && self.canPaste()) {
            self.setCursor(d.s0, d.p0);
          } else {
            const tr = self.track();
            if (tr) {
              tr.notes.push({ step: d.s0, len: self.defaultLen, pitch: d.p0, vel: 0.9 });
              if (self.onChange) self.onChange();
            }
          }
        }
        self.draw();
        return;
      }
      self.draw();
      if (self.onChange) self.onChange();
    };
    cv.addEventListener('pointerup', finish);
    cv.addEventListener('pointercancel', finish);

    cv.addEventListener('keydown', function (e) {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (!self.hover) return;
      const t = self.track();
      if (!t) return;
      const n = self.findNote(self.hover.step, self.hover.pitch);
      if (n) {
        if (self.onBeforeEdit) self.onBeforeEdit();
        t.notes.splice(t.notes.indexOf(n), 1);
        self.draw();
        if (self.onChange) self.onChange();
      }
      e.preventDefault();
    });
  };

  global.SynthLab.PianoRoll = PianoRoll;
  global.SynthLab.trackColor = trackColor;
})(window);
