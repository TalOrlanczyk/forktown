import { ZOO_SITE } from './town-config.ts';
import { BLOCK_SIZE, PLOTS, project, hash, type Point } from './world.ts';

export const ZOO_VENUE = { id: 'zoo', plot: 'O6', name: 'Willow Grove Zoo', kind: 'zoo' } as const;
export const ZOO_PLOTS = PLOTS.filter(
  (plot) =>
    plot.row >= ZOO_SITE.row &&
    plot.row < ZOO_SITE.row + ZOO_SITE.rows &&
    plot.col >= ZOO_SITE.col &&
    plot.col < ZOO_SITE.col + ZOO_SITE.columns,
).map((plot) => plot.id);
export const isZooPlot = (id: string) => ZOO_PLOTS.includes(id);
export const ZOO_GROUND = {
  left: 2 + ZOO_SITE.col * BLOCK_SIZE,
  right: 1 + (ZOO_SITE.col + ZOO_SITE.columns) * BLOCK_SIZE,
  top: 2 + ZOO_SITE.row * BLOCK_SIZE,
  bottom: 1 + (ZOO_SITE.row + ZOO_SITE.rows) * BLOCK_SIZE,
};
export const ZOO_CENTER = {
  x: (ZOO_GROUND.left + ZOO_GROUND.right) / 2,
  y: (ZOO_GROUND.top + ZOO_GROUND.bottom) / 2,
};
// The north gate connects to a retained street; the central promenade reaches every habitat.
export const ZOO_ENTRANCE = { x: ZOO_CENTER.x, y: ZOO_GROUND.top - 0.5 };
export const ZOO_FRAME = {
  center: { ...project(ZOO_CENTER.x, ZOO_CENTER.y), y: project(ZOO_CENTER.x, ZOO_CENTER.y).y - 35 },
  width: (ZOO_GROUND.right - ZOO_GROUND.left + ZOO_GROUND.bottom - ZOO_GROUND.top) * 38 + 90,
  height: (ZOO_GROUND.right - ZOO_GROUND.left + ZOO_GROUND.bottom - ZOO_GROUND.top) * 19 + 150,
};
export type ZooAnimal = 'giraffe' | 'elephant' | 'zebra' | 'penguin';
const species: readonly (ZooAnimal | null)[] = [
  'giraffe',
  'elephant',
  null,
  'zebra',
  'penguin',
  null,
];
export const ZOO_HABITATS = species.map((animal, index) => ({
  id: `habitat-${index + 1}`,
  animal,
  name: [
    'Giraffe Grove',
    'Elephant Meadow',
    'Future habitat',
    'Zebra Plains',
    'Penguin Cove',
    'Future habitat',
  ][index],
  left: ZOO_GROUND.left + 1 + (index % 3) * 7.3,
  top: ZOO_GROUND.top + 1 + Math.floor(index / 3) * 7.6,
  width: 6.2,
  height: 5.4,
}));
export const ZOO_SPOTS = Array.from({ length: 12 }, (_, index) => ({
  x: ZOO_GROUND.left + 2 + index * 1.7,
  y: ZOO_CENTER.y,
}));
export const insideZoo = (point: Point) =>
  point.x >= ZOO_GROUND.left &&
  point.x <= ZOO_GROUND.right &&
  point.y >= ZOO_GROUND.top &&
  point.y <= ZOO_GROUND.bottom;
export const insideZooHabitat = (point: Point) =>
  ZOO_HABITATS.some(
    (h) =>
      point.x >= h.left &&
      point.x <= h.left + h.width &&
      point.y >= h.top &&
      point.y <= h.top + h.height,
  );
export function zooRoute(spot: Point): Point[] {
  // A side path beside the enclosures joins the central promenade.
  return [
    ZOO_ENTRANCE,
    { x: ZOO_GROUND.left + 0.4, y: ZOO_ENTRANCE.y },
    { x: ZOO_GROUND.left + 0.4, y: ZOO_CENTER.y },
    spot,
  ];
}
export type ZooHabitat = (typeof ZOO_HABITATS)[number];
export const zooPond = (h: ZooHabitat) =>
  h.animal === 'penguin'
    ? { left: h.left + 0.5, top: h.top + 0.6, width: 4, height: 2.3 }
    : { left: h.left + 4.5, top: h.top + 3.7, width: 1.2, height: 0.8 };
export const zooTree = (h: ZooHabitat) => ({ x: h.left + 0.8, y: h.top + 0.9 });
// One town minute is one real second. One actor per habitat; the others keep wandering.
export const ZOO_QUIRKS = {
  elephant: { interval: 137, offset: 19, duration: 30, label: 'The elephant shower' },
  penguin: { interval: 113, offset: 61, duration: 30, label: 'Penguin splash landing' },
  zebra: { interval: 157, offset: 97, duration: 30, label: 'A case of the zoomies' },
  giraffe: { interval: 173, offset: 139, duration: 30, label: 'The very stretchy snack' },
} as const;
export function zooMomentAt(species: ZooAnimal, minutes: number, day = 0) {
  const config = ZOO_QUIRKS[species];
  const absolute = day * 1440 + minutes;
  const cycle = Math.floor((absolute + config.offset) / config.interval);
  const start = cycle * config.interval - config.offset;
  const elapsed = absolute - start;
  return {
    ...config,
    start,
    elapsed,
    actor:
      (((cycle + hash(`zoo:${species}`)) % (species === 'penguin' ? 5 : 3)) +
        (species === 'penguin' ? 5 : 3)) %
      (species === 'penguin' ? 5 : 3),
    active: elapsed < config.duration,
  };
}
export type ZooAction =
  | 'approach'
  | 'drink'
  | 'raise-trunk'
  | 'spray'
  | 'lower-trunk'
  | 'crouch'
  | 'dive'
  | 'splash'
  | 'swim'
  | 'hop-out'
  | 'run'
  | 'skid'
  | 'stretch'
  | 'nibble'
  | 'return';
export type ZooAnimalState = {
  id: string;
  species: ZooAnimal;
  position: Point;
  facing: number;
  step: number;
  lift: number;
  tilt: number;
  stretch: number;
  submerged: number;
  action?: { phase: ZooAction; elapsed: number; progress: number };
};
const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const between = (from: Point, to: Point, progress: number): Point => ({
  x: from.x + (to.x - from.x) * progress,
  y: from.y + (to.y - from.y) * progress,
});
function wander(h: ZooHabitat, index: number, time: number): Point {
  const phase = ((time % 220) / 220) * Math.PI * 2 + index * 2.1;
  const sway = ((time % 310) / 310) * Math.PI * 2 + index * 1.7;
  // Penguins stay on the dry bank until their turn to dive.
  return h.animal === 'penguin'
    ? { x: h.left + 5.15 + Math.cos(phase) * 0.35, y: h.top + 2.7 + Math.sin(sway) * 1.25 }
    : {
        x: h.left + h.width / 2 + Math.cos(phase) * 1.65,
        y: h.top + h.height / 2 + Math.sin(sway) * 1.25,
      };
}
function animalAt(h: ZooHabitat, index: number, time: number): ZooAnimalState {
  const species = h.animal!;
  const moment = zooMomentAt(species, time);
  const base = wander(h, index, time);
  const next = wander(h, index, time + 0.01);
  const state: ZooAnimalState = {
    id: `${species}-${index}`,
    species,
    position: base,
    facing: next.x - base.x - (next.y - base.y) >= 0 ? 1 : -1,
    step: Math.sin(time * 0.23 + index),
    lift: 0,
    tilt: 0,
    stretch: 0,
    submerged: 0,
  };
  if (!moment.active || moment.actor !== index) return state;
  const t = moment.elapsed;
  const pond = zooPond(h),
    tree = zooTree(h);
  const anchor =
    species === 'elephant'
      ? { x: pond.left - 0.45, y: pond.top + 0.3 }
      : species === 'penguin'
        ? { x: pond.left + pond.width + 0.2, y: pond.top + 1.5 }
        : species === 'giraffe'
          ? { x: tree.x + 0.5, y: tree.y + 0.5 }
          : { x: h.left + h.width / 2 + 1.8, y: h.top + h.height / 2 };
  const action = (phase: ZooAction, from: number, until: number) => {
    state.action = { phase, elapsed: t - from, progress: (t - from) / (until - from) };
  };
  state.position = anchor;
  state.facing = 1;
  state.step = 0;
  if (t < 8) {
    const from = wander(h, index, moment.start);
    state.position = between(from, anchor, ease(t / 8));
    state.facing = anchor.x - from.x - (anchor.y - from.y) >= 0 ? 1 : -1;
    state.step = Math.sin(t * 5);
    action('approach', 0, 8);
  } else if (t >= 22) {
    const to = wander(h, index, moment.start + moment.duration);
    state.position = between(anchor, to, ease((t - 22) / 8));
    state.facing = to.x - anchor.x - (to.y - anchor.y) >= 0 ? 1 : -1;
    state.step = Math.sin(t * 5);
    action('return', 22, 30);
  } else if (species === 'elephant') {
    if (t < 12) action('drink', 8, 12);
    else if (t < 15) action('raise-trunk', 12, 15);
    else if (t < 20) action('spray', 15, 20);
    else action('lower-trunk', 20, 22);
  } else if (species === 'penguin') {
    const landing = { x: pond.left + 2.7, y: pond.top + 1.15 };
    state.facing = -1;
    if (t < 10) {
      action('crouch', 8, 10);
      state.stretch = -4 * Math.sin(((t - 8) / 2) * Math.PI);
    } else if (t < 12) {
      const q = (t - 10) / 2;
      action('dive', 10, 12);
      state.position = between(anchor, landing, ease(q));
      state.lift = Math.sin(q * Math.PI) * 42;
      state.tilt = Math.sin(q * Math.PI) * 0.9;
    } else if (t < 14) {
      action('splash', 12, 14);
      state.position = landing;
      state.submerged = Math.sin(((t - 12) / 2) * Math.PI) * 0.85;
    } else if (t < 20) {
      const q = (t - 14) / 6;
      action('swim', 14, 20);
      state.position = {
        x: landing.x + 0.65 * (Math.cos(q * Math.PI * 2) - 1),
        y: landing.y + Math.sin(q * Math.PI * 2) * 0.45,
      };
      state.submerged = 0.4 * Math.sin(q * Math.PI);
      state.facing = q < 0.5 ? -1 : 1;
    } else {
      const q = (t - 20) / 2;
      action('hop-out', 20, 22);
      state.position = between(landing, anchor, ease(q));
      state.lift = Math.sin(q * Math.PI) * 22;
      state.facing = 1;
    }
  } else if (species === 'zebra') {
    if (t < 20) {
      const q = (t - 8) / 12,
        angle = ease(q) * Math.PI * 4;
      action('run', 8, 20);
      state.position = {
        x: h.left + h.width / 2 + Math.cos(angle) * 1.8,
        y: anchor.y + Math.sin(angle) * 1.45,
      };
      state.facing = -1.8 * Math.sin(angle) - 1.45 * Math.cos(angle) >= 0 ? 1 : -1;
      state.step = Math.sin((t - 8) * 16);
      state.lift = Math.abs(Math.sin((t - 8) * Math.PI * 2)) * 5 * Math.sin(q * Math.PI);
    } else {
      action('skid', 20, 22);
      state.tilt = Math.sin(((t - 20) / 2) * Math.PI) * -0.12;
    }
  } else {
    if (t < 12) {
      action('stretch', 8, 12);
      state.stretch = ease((t - 8) / 4) * 23;
    } else if (t < 18) {
      action('nibble', 12, 18);
      state.stretch = 23 + Math.sin((t - 12) * Math.PI) * 2;
    } else {
      action('stretch', 18, 22);
      state.stretch = (1 - ease((t - 18) / 4)) * 23;
    }
  }
  return state;
}
export function zooAnimalsAt(minutes: number, day = 0): ZooAnimalState[] {
  return ZOO_HABITATS.flatMap((h) =>
    h.animal
      ? Array.from({ length: h.animal === 'penguin' ? 5 : 3 }, (_, index) =>
          animalAt(h, index, day * 1440 + minutes),
        )
      : [],
  );
}
