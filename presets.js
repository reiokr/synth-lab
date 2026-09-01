/* SYNTH LAB — factory patch bank (generated at load)
 *
 * Drum patches are voiced for a particular note:
 *   Kick C2 (36) · Tom C3 (48) · everything else C4 (60)
 */
(function (global) {
  'use strict';

  const CATEGORIES = ['Basic', 'Keys', 'Bass', 'Lead', 'Pluck', 'Pad', 'Bell', 'Arp', 'FX', 'Drums'];

  const bank = [
    /* ---------------------------------------------------------- Basic */
    ['Init Saw', 'Basic', {
      osc1: { type: 'sawtooth', level: 0.70 },
      osc2: { level: 0.00 },
      sub: { level: 0.15 },
      filter: { cutoff: 7000, reso: 1.2, envAmt: 15 },
      ampEnv: { a: 0.01, d: 0.30, s: 0.70, r: 0.40 },
      delay: { mix: 0.10 }, reverb: { mix: 0.18 }
    }],

    /* ----------------------------------------------------------- Keys */
    ['Felt Keys', 'Keys', {
      osc1: { type: 'triangle', level: 0.70 },
      osc2: { type: 'sine', octave: 1, detune: 4, level: 0.40 },
      sub: { level: 0.25 },
      filter: { cutoff: 3200, reso: 1.4, envAmt: 25 },
      filtEnv: { a: 0.01, d: 0.60, s: 0.25 },
      ampEnv: { a: 0.008, d: 0.70, s: 0.35, r: 0.55 },
      lfo1: { wave: 'sine', rate: 5.2, depth: 18, target: 'amp' },
      chorus: { rate: 0.35, depth: 0.30, mix: 0.18 },
      delay: { mix: 0.10 }, reverb: { size: 3.5, mix: 0.30 }
    }],
    ['Rhodes', 'Keys', {
      osc1: { type: 'triangle', level: 0.70 },
      osc2: { type: 'sine', octave: 1, detune: 5, level: 0.35 },
      sub: { level: 0.20 },
      filter: { cutoff: 2600, reso: 1.6, envAmt: 38 },
      filtEnv: { a: 0.004, d: 0.90, s: 0.20 },
      ampEnv: { a: 0.004, d: 1.40, s: 0.25, r: 0.70 },
      lfo1: { wave: 'sine', rate: 4.6, depth: 14, target: 'amp' },
      drive: { amount: 0.12, tone: 0.55 },
      chorus: { rate: 0.30, depth: 0.35, mix: 0.22 },
      delay: { time: 0.28, feedback: 0.20, mix: 0.14 },
      reverb: { size: 3.0, mix: 0.28 }
    }],
    ['Electric Piano', 'Keys', {
      osc1: { type: 'sine', level: 0.75 },
      osc2: { type: 'triangle', octave: 1, semi: 7, detune: -4, level: 0.28 },
      sub: { level: 0.15 },
      filter: { cutoff: 4200, reso: 1.2, envAmt: 58 },
      filtEnv: { a: 0.002, d: 0.55, s: 0.10 },
      ampEnv: { a: 0.002, d: 1.10, s: 0.15, r: 0.60 },
      drive: { amount: 0.20, tone: 0.62 },
      chorus: { rate: 0.45, depth: 0.28, mix: 0.20 },
      delay: { time: 0.32, feedback: 0.22, mix: 0.16 },
      reverb: { size: 2.6, mix: 0.24 }
    }],
    ['Church Organ', 'Keys', {
      osc1: { type: 'sine', level: 1.00 },
      osc2: { type: 'sine', octave: 1, semi: 7, level: 0.50 },
      sub: { level: 0.40 },
      filter: { cutoff: 4200, reso: 0.8, envAmt: 8 },
      ampEnv: { a: 0.04, d: 0.10, s: 0.90, r: 0.28 },
      lfo2: { wave: 'sine', rate: 0.22, depth: 22, target: 'filter' },
      chorus: { rate: 0.28, depth: 0.40, mix: 0.30 },
      reverb: { size: 5.0, mix: 0.45 }
    }],
    ['Clavinet', 'Keys', {
      osc1: { type: 'sawtooth', level: 0.55 },
      osc2: { type: 'square', octave: 1, detune: -8, level: 0.35 },
      sub: { level: 0.10 },
      filter: { type: 'bandpass', cutoff: 1400, reso: 6.0, envAmt: 62 },
      filtEnv: { a: 0.001, d: 0.18, s: 0.06 },
      ampEnv: { a: 0.001, d: 0.30, s: 0.00, r: 0.14 },
      drive: { amount: 0.22, tone: 0.58 },
      delay: { time: 0.16, feedback: 0.18, mix: 0.12 },
      reverb: { size: 1.8, mix: 0.16 }
    }],

    /* ----------------------------------------------------------- Bass */
    ['Sub Growl', 'Bass', {
      osc1: { type: 'sawtooth', octave: -1, level: 0.75 },
      osc2: { type: 'square', octave: -2, detune: -12, level: 0.35 },
      sub: { level: 0.55 },
      unison: { voices: 3, detune: 18, width: 0.15 },
      filter: { cutoff: 320, reso: 6.0, envAmt: 45 },
      filtEnv: { a: 0.005, d: 0.22, s: 0.10 },
      ampEnv: { a: 0.006, d: 0.35, s: 0.60, r: 0.18 },
      drive: { amount: 0.35, tone: 0.35 },
      delay: { mix: 0.00 }, reverb: { mix: 0.08 }
    }],
    ['Reese Bass', 'Bass', {
      osc1: { type: 'sawtooth', octave: -1, level: 0.65 },
      osc2: { type: 'sawtooth', octave: -1, detune: 28, level: 0.65 },
      sub: { level: 0.40 },
      unison: { voices: 3, detune: 26, width: 0.45 },
      filter: { cutoff: 520, reso: 4.0, envAmt: 35 },
      filtEnv: { a: 0.01, d: 0.45, s: 0.20 },
      ampEnv: { a: 0.01, d: 0.60, s: 0.85, r: 0.30 },
      drive: { amount: 0.30, tone: 0.30 },
      delay: { mix: 0.00 }, reverb: { mix: 0.10 }
    }],
    ['808 Sub', 'Bass', {
      osc1: { type: 'sine', octave: -1, level: 1.00 },
      osc2: { level: 0.00 },
      sub: { octave: -1, level: 0.60 },
      noise: { level: 0.02 },
      filter: { cutoff: 190, reso: 2.2, envAmt: 46 },
      filtEnv: { a: 0.001, d: 0.32, s: 0.12 },
      ampEnv: { a: 0.002, d: 1.30, s: 0.30, r: 0.90 },
      drive: { amount: 0.18, tone: 0.30 },
      delay: { mix: 0.00 }, reverb: { mix: 0.06 }
    }],
    ['Acid Bass', 'Bass', {
      osc1: { type: 'sawtooth', octave: -1, level: 0.85 },
      osc2: { type: 'square', octave: -2, detune: -6, level: 0.25 },
      sub: { level: 0.20 },
      glide: 0.05,
      filter: { cutoff: 380, reso: 14.0, envAmt: 82 },
      filtEnv: { a: 0.002, d: 0.16, s: 0.05 },
      ampEnv: { a: 0.003, d: 0.22, s: 0.40, r: 0.16 },
      drive: { amount: 0.32, tone: 0.42 },
      delay: { time: 0.20, feedback: 0.22, mix: 0.12 },
      reverb: { mix: 0.08 }
    }],
    ['FM Bass', 'Bass', {
      osc1: { type: 'sine', octave: -1, level: 0.90 },
      osc2: { type: 'sine', octave: 0, semi: 7, level: 0.30 },
      sub: { level: 0.40 },
      filter: { cutoff: 900, reso: 1.0, envAmt: 30 },
      filtEnv: { a: 0.002, d: 0.28, s: 0.15 },
      ampEnv: { a: 0.001, d: 0.40, s: 0.55, r: 0.22 },
      drive: { amount: 0.10, tone: 0.45 },
      delay: { mix: 0.00 }, reverb: { mix: 0.08 }
    }],

    /* ----------------------------------------------------------- Lead */
    ['Acid Lead', 'Lead', {
      osc1: { type: 'sawtooth', level: 0.80 },
      osc2: { type: 'square', octave: -1, detune: -6, level: 0.30 },
      sub: { level: 0.10 },
      glide: 0.06,
      filter: { cutoff: 420, reso: 16.0, envAmt: 85 },
      filtEnv: { a: 0.003, d: 0.18, s: 0.04 },
      ampEnv: { a: 0.004, d: 0.20, s: 0.35, r: 0.20 },
      drive: { amount: 0.45, tone: 0.55 },
      delay: { time: 0.18, feedback: 0.38, mix: 0.20 },
      reverb: { mix: 0.12 }
    }],
    ['Tape Lead', 'Lead', {
      osc1: { type: 'sawtooth', level: 0.60 },
      osc2: { type: 'square', octave: 0, detune: -10, level: 0.35 },
      sub: { level: 0.15 },
      unison: { voices: 2, detune: 12, width: 0.35 },
      filter: { cutoff: 4200, reso: 2.5, envAmt: 30 },
      ampEnv: { a: 0.02, d: 0.40, s: 0.75, r: 0.45 },
      lfo1: { wave: 'sine', rate: 5.6, depth: 14, target: 'pitch' },
      drive: { amount: 0.28, tone: 0.65 },
      chorus: { rate: 0.55, depth: 0.65, mix: 0.35 },
      delay: { time: 0.28, feedback: 0.30, mix: 0.22 },
      reverb: { size: 3.0, mix: 0.26 }
    }],
    ['Arcade Lead', 'Lead', {
      osc1: { type: 'square', level: 0.65 },
      osc2: { type: 'square', octave: 0, detune: 12, level: 0.45 },
      sub: { level: 0.10 },
      unison: { voices: 3, detune: 10, width: 0.25 },
      filter: { cutoff: 8000, reso: 1.0, envAmt: 12 },
      ampEnv: { a: 0.002, d: 0.14, s: 0.60, r: 0.10 },
      lfo1: { wave: 'square', rate: 11.0, depth: 9, target: 'pitch' },
      chorus: { rate: 0.80, depth: 0.40, mix: 0.28 },
      delay: { time: 0.16, feedback: 0.26, mix: 0.18 },
      reverb: { size: 2.0, mix: 0.18 }
    }],
    ['Synth Brass', 'Lead', {
      osc1: { type: 'sawtooth', level: 0.70 },
      osc2: { type: 'sawtooth', octave: 0, detune: -8, level: 0.40 },
      sub: { level: 0.15 },
      unison: { voices: 3, detune: 16, width: 0.40 },
      filter: { cutoff: 1400, reso: 3.2, envAmt: 66 },
      filtEnv: { a: 0.09, d: 0.30, s: 0.60 },
      ampEnv: { a: 0.05, d: 0.22, s: 0.75, r: 0.26 },
      drive: { amount: 0.14, tone: 0.55 },
      chorus: { rate: 0.40, depth: 0.25, mix: 0.20 },
      reverb: { size: 2.6, mix: 0.22 }
    }],
    ['Overdrive Guitar', 'Lead', {
      osc1: { type: 'sawtooth', level: 0.70 },
      osc2: { type: 'triangle', octave: 0, detune: 7, level: 0.40 },
      sub: { level: 0.10 },
      unison: { voices: 2, detune: 9, width: 0.45 },
      filter: { cutoff: 3200, reso: 2.6, envAmt: 34 },
      ampEnv: { a: 0.006, d: 0.80, s: 0.40, r: 0.30 },
      drive: { amount: 0.55, tone: 0.60 },
      chorus: { rate: 0.50, depth: 0.20, mix: 0.18 },
      delay: { time: 0.24, feedback: 0.24, mix: 0.16 },
      reverb: { size: 2.2, mix: 0.20 }
    }],

    /* ---------------------------------------------------------- Pluck */
    ['Neon Pluck', 'Pluck', {
      osc1: { type: 'square', level: 0.55 },
      osc2: { type: 'sawtooth', octave: 1, detune: 6, level: 0.25 },
      sub: { level: 0.10 },
      unison: { voices: 2, detune: 10, width: 0.55 },
      filter: { cutoff: 1800, reso: 9.0, envAmt: 75 },
      filtEnv: { a: 0.004, d: 0.16, s: 0.05 },
      ampEnv: { a: 0.003, d: 0.22, s: 0.00, r: 0.30 },
      delay: { time: 0.22, feedback: 0.42, mix: 0.30 },
      reverb: { size: 3.2, mix: 0.28 }
    }],
    ['Marimba', 'Pluck', {
      osc1: { type: 'sine', level: 0.85 },
      osc2: { type: 'sine', octave: 2, level: 0.25 },
      sub: { level: 0.05 },
      filter: { cutoff: 3000, reso: 1.0, envAmt: 30 },
      filtEnv: { a: 0.001, d: 0.22, s: 0.02 },
      ampEnv: { a: 0.001, d: 0.38, s: 0.00, r: 0.28 },
      delay: { time: 0.20, feedback: 0.20, mix: 0.14 },
      reverb: { size: 2.4, mix: 0.30 }
    }],
    ['Harp', 'Pluck', {
      osc1: { type: 'triangle', level: 0.70 },
      osc2: { type: 'sine', octave: 1, detune: 3, level: 0.35 },
      sub: { level: 0.10 },
      filter: { cutoff: 5200, reso: 1.2, envAmt: 40 },
      filtEnv: { a: 0.002, d: 0.60, s: 0.05 },
      ampEnv: { a: 0.002, d: 0.95, s: 0.05, r: 1.30 },
      delay: { time: 0.26, feedback: 0.24, mix: 0.22 },
      reverb: { size: 3.6, mix: 0.38 }
    }],
    ['Kalimba', 'Pluck', {
      osc1: { type: 'triangle', level: 0.80 },
      osc2: { level: 0.00 },
      sub: { level: 0.20 },
      filter: { type: 'bandpass', cutoff: 1800, reso: 3.0, envAmt: 45 },
      filtEnv: { a: 0.001, d: 0.40, s: 0.02 },
      ampEnv: { a: 0.001, d: 0.55, s: 0.00, r: 0.50 },
      delay: { time: 0.24, feedback: 0.22, mix: 0.16 },
      reverb: { size: 3.2, mix: 0.40 }
    }],
    ['Music Box', 'Pluck', {
      osc1: { type: 'sine', level: 0.70 },
      osc2: { type: 'sine', octave: 2, semi: 7, detune: 3, level: 0.30 },
      sub: { level: 0.05 },
      filter: { cutoff: 7000, reso: 0.9, envAmt: 22 },
      ampEnv: { a: 0.001, d: 0.75, s: 0.00, r: 0.95 },
      delay: { time: 0.25, feedback: 0.32, mix: 0.26 },
      reverb: { size: 3.0, mix: 0.32 }
    }],

    /* ------------------------------------------------------------ Pad */
    ['Glass Pad', 'Pad', {
      osc1: { type: 'triangle', level: 0.55 },
      osc2: { type: 'sine', octave: 1, detune: 12, level: 0.35 },
      sub: { level: 0.10 },
      unison: { voices: 5, detune: 22, width: 0.90 },
      filter: { cutoff: 2600, reso: 1.0, envAmt: 40 },
      filtEnv: { a: 1.20, d: 1.50, s: 0.70 },
      ampEnv: { a: 1.10, d: 0.90, s: 0.80, r: 2.80 },
      lfo2: { wave: 'sine', rate: 0.18, depth: 22, target: 'filter' },
      chorus: { rate: 0.22, depth: 0.55, mix: 0.35 },
      delay: { time: 0.52, feedback: 0.35, mix: 0.22 },
      reverb: { size: 6.0, mix: 0.55 }
    }],
    ['Breath Pad', 'Pad', {
      osc1: { type: 'triangle', level: 0.35 },
      osc2: { level: 0.00 },
      sub: { level: 0.20 },
      noise: { level: 0.45 },
      unison: { voices: 3, detune: 20, width: 0.85 },
      filter: { cutoff: 1400, reso: 3.5, envAmt: 50 },
      filtEnv: { a: 0.90, d: 1.20, s: 0.60 },
      ampEnv: { a: 0.80, d: 0.80, s: 0.75, r: 2.20 },
      lfo2: { wave: 'sine', rate: 0.13, depth: 35, target: 'filter' },
      reverb: { size: 6.5, mix: 0.58 }
    }],
    ['Drone Sweep', 'Pad', {
      osc1: { type: 'sawtooth', level: 0.55 },
      osc2: { type: 'triangle', octave: -1, detune: 14, level: 0.50 },
      sub: { level: 0.35 },
      unison: { voices: 4, detune: 30, width: 0.80 },
      filter: { cutoff: 900, reso: 7.0, envAmt: 55 },
      filtEnv: { a: 2.50, d: 2.00, s: 0.85 },
      ampEnv: { a: 2.20, d: 1.20, s: 0.90, r: 3.50 },
      lfo1: { wave: 'triangle', rate: 0.09, depth: 60, target: 'filter' },
      chorus: { rate: 0.18, depth: 0.60, mix: 0.30 },
      reverb: { size: 7.5, mix: 0.60 }
    }],
    ['Strings', 'Pad', {
      osc1: { type: 'sawtooth', level: 0.55 },
      osc2: { type: 'sawtooth', octave: 0, detune: -9, level: 0.45 },
      sub: { level: 0.15 },
      unison: { voices: 5, detune: 18, width: 0.70 },
      filter: { cutoff: 2200, reso: 1.4, envAmt: 30 },
      filtEnv: { a: 0.40, d: 0.60, s: 0.75 },
      ampEnv: { a: 0.50, d: 0.60, s: 0.80, r: 1.60 },
      lfo2: { wave: 'sine', rate: 5.0, depth: 7, target: 'pitch' },
      chorus: { rate: 0.35, depth: 0.45, mix: 0.40 },
      reverb: { size: 4.5, mix: 0.45 }
    }],
    ['Choir', 'Pad', {
      osc1: { type: 'triangle', level: 0.60 },
      osc2: { type: 'sine', octave: 1, detune: 8, level: 0.30 },
      sub: { level: 0.25 },
      unison: { voices: 4, detune: 24, width: 0.80 },
      filter: { type: 'bandpass', cutoff: 900, reso: 2.5, envAmt: 35 },
      filtEnv: { a: 0.60, d: 0.50, s: 0.80 },
      ampEnv: { a: 0.60, d: 0.50, s: 0.85, r: 1.40 },
      lfo2: { wave: 'sine', rate: 5.2, depth: 9, target: 'pitch' },
      chorus: { rate: 0.30, depth: 0.35, mix: 0.30 },
      reverb: { size: 5.5, mix: 0.50 }
    }],
    ['Vaporwave', 'Pad', {
      osc1: { type: 'triangle', level: 0.60 },
      osc2: { type: 'triangle', octave: 0, detune: -18, level: 0.50 },
      sub: { level: 0.25 },
      unison: { voices: 3, detune: 26, width: 0.65 },
      filter: { cutoff: 1500, reso: 1.0, envAmt: 28 },
      filtEnv: { a: 0.15, d: 0.80, s: 0.70 },
      ampEnv: { a: 0.15, d: 0.80, s: 0.70, r: 1.20 },
      lfo1: { wave: 'sine', rate: 0.12, depth: 30, target: 'filter' },
      chorus: { rate: 0.25, depth: 0.60, mix: 0.50 },
      delay: { time: 0.45, feedback: 0.36, mix: 0.30 },
      reverb: { size: 5.0, mix: 0.45 }
    }],

    /* ----------------------------------------------------------- Bell */
    ['Circuit Bells', 'Bell', {
      osc1: { type: 'sine', level: 0.60 },
      osc2: { type: 'sine', octave: 2, semi: 7, detune: 3, level: 0.30 },
      sub: { level: 0.05 },
      filter: { cutoff: 9000, reso: 0.8, envAmt: 10 },
      filtEnv: { a: 0.002, d: 0.60, s: 0.05 },
      ampEnv: { a: 0.002, d: 1.10, s: 0.00, r: 1.40 },
      lfo2: { wave: 'sine', rate: 0.30, depth: 8, target: 'pitch' },
      delay: { time: 0.375, feedback: 0.48, mix: 0.34 },
      reverb: { size: 5.0, mix: 0.42 }
    }],
    ['Tubular Bells', 'Bell', {
      osc1: { type: 'sine', level: 0.65 },
      osc2: { type: 'sine', octave: 2, semi: 7, level: 0.35 },
      sub: { level: 0.05 },
      filter: { cutoff: 6000, reso: 1.0, envAmt: 18 },
      filtEnv: { a: 0.001, d: 0.80, s: 0.02 },
      ampEnv: { a: 0.001, d: 2.00, s: 0.00, r: 2.20 },
      delay: { time: 0.42, feedback: 0.30, mix: 0.22 },
      reverb: { size: 6.0, mix: 0.50 }
    }],

    /* ------------------------------------------------------------ Arp */
    ['Chip Arp', 'Arp', {
      osc1: { type: 'square', level: 0.70 },
      osc2: { type: 'square', octave: 1, semi: 7, level: 0.20 },
      sub: { level: 0.05 },
      glide: 0.00,
      filter: { cutoff: 12000, reso: 0.7, envAmt: 5 },
      ampEnv: { a: 0.002, d: 0.09, s: 0.25, r: 0.08 },
      lfo1: { wave: 'square', rate: 11.0, depth: 12, target: 'pitch' },
      chorus: { rate: 0.9, depth: 0.45, mix: 0.30 },
      delay: { time: 0.14, feedback: 0.30, mix: 0.18 },
      reverb: { mix: 0.14 }
    }],

    /* ------------------------------------------------------------- FX */
    ['Noise Riser', 'FX', {
      osc1: { level: 0.00 },
      osc2: { level: 0.00 },
      sub: { level: 0.00 },
      noise: { level: 0.85 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'bandpass', cutoff: 400, reso: 5.0, envAmt: 100 },
      filtEnv: { a: 4.00, d: 0.40, s: 1.00 },
      ampEnv: { a: 3.80, d: 0.30, s: 0.90, r: 0.80 },
      reverb: { size: 5.0, mix: 0.45 }
    }],
    ['Impact Hit', 'FX', {
      osc1: { type: 'sine', octave: -2, level: 1.00 },
      osc2: { level: 0.00 },
      sub: { octave: -2, level: 0.80 },
      noise: { level: 0.55 },
      filter: { type: 'lowpass', cutoff: 300, reso: 1.6, envAmt: 90 },
      filtEnv: { a: 0.001, d: 1.60, s: 0.00 },
      ampEnv: { a: 0.001, d: 2.20, s: 0.00, r: 1.60 },
      drive: { amount: 0.30, tone: 0.40 },
      reverb: { size: 6.0, mix: 0.55 }
    }],

    /* ---------------------------------------------------------- Drums */
    ['Kit: Kick', 'Drums', {
      osc1: { type: 'sine', octave: 0, level: 1.00 },
      osc2: { level: 0.00 },
      sub: { level: 0.00 },
      noise: { level: 0.04 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'lowpass', cutoff: 190, reso: 1.6, envAmt: 62 },
      filtEnv: { a: 0.001, d: 0.075, s: 0.00 },
      ampEnv: { a: 0.001, d: 0.200, s: 0.00, r: 0.070 },
      drive: { amount: 0.18, tone: 0.30 },
      delay: { mix: 0.00 }, reverb: { mix: 0.00 }
    }],
    ['Kit: Snare', 'Drums', {
      osc1: { type: 'triangle', octave: 2, level: 0.22 },
      osc2: { level: 0.00 },
      sub: { level: 0.00 },
      noise: { level: 0.95 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'bandpass', cutoff: 1900, reso: 1.1, envAmt: 20 },
      filtEnv: { a: 0.001, d: 0.090, s: 0.00 },
      ampEnv: { a: 0.001, d: 0.150, s: 0.00, r: 0.060 },
      lfo1: { depth: 0 }, lfo2: { depth: 0 },
      delay: { mix: 0.00 }, reverb: { size: 1.1, mix: 0.16 }
    }],
    ['Kit: Hat', 'Drums', {
      osc1: { type: 'square', octave: 3, level: 0.05 },
      osc2: { level: 0.00 },
      sub: { level: 0.00 },
      noise: { level: 1.00 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'highpass', cutoff: 7200, reso: 2.2, envAmt: 8 },
      filtEnv: { a: 0.001, d: 0.030, s: 0.00 },
      ampEnv: { a: 0.001, d: 0.045, s: 0.00, r: 0.020 },
      lfo1: { depth: 0 }, lfo2: { depth: 0 },
      delay: { mix: 0.00 }, reverb: { size: 0.7, mix: 0.07 }
    }],
    ['Kit: Clap', 'Drums', {
      osc1: { level: 0.00 },
      osc2: { level: 0.00 },
      sub: { level: 0.00 },
      noise: { level: 1.00 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'bandpass', cutoff: 1500, reso: 1.8, envAmt: 12 },
      filtEnv: { a: 0.001, d: 0.055, s: 0.00 },
      ampEnv: { a: 0.002, d: 0.130, s: 0.00, r: 0.050 },
      lfo1: { depth: 0 }, lfo2: { depth: 0 },
      delay: { time: 0.022, feedback: 0.20, mix: 0.22 },
      reverb: { size: 1.4, mix: 0.20 }
    }],
    ['Kit: Tom', 'Drums', {
      osc1: { type: 'triangle', octave: 0, level: 1.00 },
      osc2: { level: 0.00 },
      sub: { level: 0.35 },
      noise: { level: 0.05 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'lowpass', cutoff: 900, reso: 2.0, envAmt: 58 },
      filtEnv: { a: 0.001, d: 0.200, s: 0.00 },
      ampEnv: { a: 0.001, d: 0.300, s: 0.00, r: 0.130 },
      lfo1: { depth: 0 }, lfo2: { depth: 0 },
      drive: { amount: 0.10, tone: 0.45 },
      delay: { mix: 0.00 }, reverb: { size: 1.6, mix: 0.20 }
    }],
    ['Kit: Rim', 'Drums', {
      osc1: { type: 'square', octave: 3, level: 0.22 },
      osc2: { level: 0.00 },
      sub: { level: 0.00 },
      noise: { level: 0.90 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'bandpass', cutoff: 2400, reso: 5.0, envAmt: 15 },
      filtEnv: { a: 0.001, d: 0.030, s: 0.00 },
      ampEnv: { a: 0.001, d: 0.055, s: 0.00, r: 0.030 },
      lfo1: { depth: 0 }, lfo2: { depth: 0 },
      delay: { mix: 0.00 }, reverb: { size: 1.0, mix: 0.14 }
    }],
    ['Kit: Cowbell', 'Drums', {
      osc1: { type: 'square', octave: 0, level: 0.60 },
      osc2: { type: 'square', octave: 0, semi: 7, level: 0.50 },
      sub: { level: 0.00 },
      noise: { level: 0.03 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'bandpass', cutoff: 2600, reso: 3.0, envAmt: 20 },
      filtEnv: { a: 0.001, d: 0.140, s: 0.00 },
      ampEnv: { a: 0.001, d: 0.260, s: 0.00, r: 0.080 },
      lfo1: { depth: 0 }, lfo2: { depth: 0 },
      delay: { mix: 0.00 }, reverb: { size: 1.2, mix: 0.16 }
    }],
    ['Kit: Shaker', 'Drums', {
      osc1: { level: 0.00 },
      osc2: { level: 0.00 },
      sub: { level: 0.00 },
      noise: { level: 0.80 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'highpass', cutoff: 5000, reso: 2.0, envAmt: 10 },
      filtEnv: { a: 0.004, d: 0.040, s: 0.00 },
      ampEnv: { a: 0.004, d: 0.070, s: 0.00, r: 0.040 },
      lfo1: { depth: 0 }, lfo2: { depth: 0 },
      delay: { mix: 0.00 }, reverb: { size: 0.8, mix: 0.10 }
    }],
    ['Kit: Cymbal', 'Drums', {
      osc1: { level: 0.00 },
      osc2: { level: 0.00 },
      sub: { level: 0.00 },
      noise: { level: 1.00 },
      unison: { voices: 1, detune: 0, width: 0 },
      filter: { type: 'highpass', cutoff: 6000, reso: 1.2, envAmt: 6 },
      filtEnv: { a: 0.001, d: 0.500, s: 0.30 },
      ampEnv: { a: 0.001, d: 1.300, s: 0.00, r: 0.900 },
      lfo1: { depth: 0 }, lfo2: { depth: 0 },
      delay: { mix: 0.00 }, reverb: { size: 3.0, mix: 0.35 }
    }]
  ];

  global.SynthLab.FACTORY_PRESETS = bank.map(function (entry) {
    const p = global.SynthLab.mergePatch(
      global.SynthLab.defaultPatch(),
      Object.assign({ name: entry[0], category: entry[1] }, entry[2])
    );
    p.name = entry[0];
    p.category = entry[1];
    return p;
  });

  global.SynthLab.PATCH_CATEGORIES = CATEGORIES;

  /* Look up a factory patch by name — used by the demo songs. */
  global.SynthLab.patchByName = function (name) {
    const exact = global.SynthLab.FACTORY_PRESETS.find(function (p) { return p.name === name; });
    if (exact) return global.SynthLab.clone(exact);
    const lower = String(name).toLowerCase();
    const fuzzy = global.SynthLab.FACTORY_PRESETS.find(function (p) { return p.name.toLowerCase() === lower; });
    return fuzzy ? global.SynthLab.clone(fuzzy) : global.SynthLab.defaultPatch();
  };
})(window);
