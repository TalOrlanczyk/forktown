import type { CinemaFilm } from '../lib/cinema';
import { cinemaScore, type FilmEffect } from './cinema-score';
import { SAMPLE_RATE, voice, type Mix } from './render';

const tau = Math.PI * 2;
function effect(kind: FilmEffect, t: number, duration: number, noise: number, lowNoise: number) {
  const p = t / duration;
  switch (kind) {
    case 'pop':
      return (
        (Math.sin(tau * (130 * t + 3 * (1 - Math.exp(-t * 70)))) + noise * 0.6) * Math.exp(-t * 40)
      );
    case 'bounce':
      return Math.sin(tau * (260 * t - 240 * t * t)) * Math.exp(-t * 15);
    case 'rustle':
      return noise * (0.2 + 0.3 * Math.sin(t * 37) ** 2);
    case 'chime':
      return (Math.sin(tau * 880 * t) + Math.sin(tau * 1320 * t) * 0.45) * Math.exp(-t * 4);
    case 'meow':
      return (
        Math.sin(tau * (510 * t - 130 * t * t) + 1.7 * Math.sin(tau * (510 * t - 130 * t * t))) *
        Math.sin(Math.PI * p)
      );
    case 'quack':
      return (
        Math.sin(tau * (380 * t - 150 * t * t) + 2 * Math.sin(tau * 95 * t)) *
        Math.sin(Math.PI * p) *
        0.7
      );
    case 'flutter':
      return noise * Math.pow(Math.max(0, Math.sin(tau * 11 * t)), 5);
    case 'water':
      return lowNoise * 2 + Math.sin(tau * (690 * t + 0.5 * Math.sin(t * 5))) * 0.07;
    case 'engine':
      return (
        (Math.sin(tau * (65 * t + 8 * t * t)) * 0.4 +
          Math.sin(tau * (130 * t + 16 * t * t)) * 0.18 +
          lowNoise * 0.8) *
        (0.8 + 0.2 * Math.sin(t * 18))
      );
    case 'beep':
      return Math.sin(tau * (duration > 0.4 ? 1046 : 784) * t) * 0.6;
    case 'sweep':
      return (noise * 0.5 + lowNoise * 1.2) * (0.35 + 0.65 * Math.sin(Math.PI * p));
    case 'crowd':
      return (
        lowNoise * 1.8 +
        noise * Math.pow(Math.max(0, Math.sin(t * 29)), 16) * 0.5 +
        (Math.sin(t * 1470 + Math.sin(t * 7) * 8) + Math.sin(t * 1900 + Math.sin(t * 9) * 7)) * 0.09
      );
    case 'step':
      return (noise * 0.5 + Math.sin(tau * 120 * t)) * Math.exp(-t * 32);
    case 'swish':
      return (noise * 0.6 + lowNoise) * Math.sin(Math.PI * p) ** 2;
    case 'clash':
      return (
        (Math.sin(tau * 1480 * t) +
          Math.sin(tau * 2317 * t) * 0.65 +
          Math.sin(tau * 3419 * t) * 0.3) *
          Math.exp(-t * 8) *
          0.55 +
        noise * Math.exp(-t * 70) * 0.4
      );
    case 'wind':
      return lowNoise * (0.7 + 0.3 * Math.sin(t * 0.9));
    case 'hum':
      return (
        (Math.sin(tau * 73 * t) * 0.7 + Math.sin(tau * 110 * t + Math.sin(t * 3)) * 0.3) *
        (0.65 + Math.sin(t * 9) * 0.25)
      );
    case 'beam':
      return (
        Math.sin(tau * (220 * t + 34 * t * t) + Math.sin(tau * 43 * t) * 2) *
        (0.5 + 0.5 * Math.sin(t * 26) ** 2) *
        0.7
      );
    case 'gasp':
      return (noise * 0.4 + Math.sin(tau * (320 * t + 170 * t * t)) * 0.3) * Math.sin(Math.PI * p);
    case 'warp':
      return (Math.sin(tau * (100 * t + 70 * t * t)) * 0.7 + lowNoise) * Math.sin(Math.PI * p);
  }
}

/** A complete, non-looping stereo film mix; seeking never depends on earlier playback. */
export function renderCinemaPCM(film: CinemaFilm): Mix {
  const frames = Math.round(film.duration * SAMPLE_RATE);
  const left = new Float32Array(frames),
    right = new Float32Array(frames);
  for (const cue of cinemaScore(film)) {
    const start = Math.round(cue.at * SAMPLE_RATE);
    const count = Math.min(Math.ceil(cue.duration * SAMPLE_RATE), frames - start);
    const l = Math.cos(((cue.pan + 1) * Math.PI) / 4),
      r = Math.sin(((cue.pan + 1) * Math.PI) / 4);
    let seed = (start + 7193) >>> 0,
      low = 0;
    for (let i = 0; i < count; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = seed / 2147483648 - 1;
      low += (noise - low) * 0.06;
      const t = i / SAMPLE_RATE;
      const sample =
        cue.kind === 'note'
          ? voice(
              {
                beat: 0,
                length: cue.duration,
                pitch: cue.pitch,
                voice: cue.voice,
                gain: cue.gain,
                pan: cue.pan,
              },
              t,
              cue.duration,
              noise,
            )
          : effect(cue.kind, t, cue.duration, noise, low) *
            cue.gain *
            Math.min(1, t / 0.006, Math.max(0, (cue.duration - t) / 0.045));
      left[start + i] += sample * l;
      right[start + i] += sample * r;
    }
  }
  // Short stereo room reflections, with no wrap into the opening title.
  const dryL = left.slice(),
    dryR = right.slice();
  const delay = Math.round(0.087 * SAMPLE_RATE);
  for (let i = 0; i < frames; i++) {
    const fade = Math.min(1, i / (SAMPLE_RATE * 0.025), (frames - 1 - i) / (SAMPLE_RATE * 0.18));
    left[i] = Math.tanh((dryL[i] + (i >= delay ? dryR[i - delay] * 0.12 : 0)) * 1.7) * 0.88 * fade;
    right[i] = Math.tanh((dryR[i] + (i >= delay ? dryL[i - delay] * 0.12 : 0)) * 1.7) * 0.88 * fade;
  }
  return { left, right, sampleRate: SAMPLE_RATE };
}
