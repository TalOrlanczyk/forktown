import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { placeSchema, type Place } from '../src/lib/schema';
import { HOUSE_PLOTS, eventsForDay, insideVenue, venueAt } from '../src/lib/events';
import { getPlot, isRoad, plotEntrance, project, STREETLIGHTS } from '../src/lib/world';
import {
  ZOO_GROUND,
  ZOO_HABITATS,
  ZOO_PLOTS,
  ZOO_SPOTS,
  ZOO_ENTRANCE,
  insideZoo,
  insideZooHabitat,
  zooAnimalsAt,
} from '../src/lib/zoo';
import { cityHit } from '../src/city/render';
import { planTravel, roadPath, WALK_SPEED } from '../src/lib/walking';
import { residentTrips } from '../src/lib/resident-trips';
import { residentActivityLabel, simulateResidents } from '../src/lib/simulation';

const sample = placeSchema.parse(JSON.parse(readFileSync('places/my-little-place.json', 'utf8')));
const homes: Place[] = HOUSE_PLOTS.slice(0, 36).map((plot, index) => ({
  ...sample,
  id: `zoo-neighbor-${index}`,
  plot: plot.id,
  resident: {
    ...sample.resident,
    routine: { morning: 'stroll', afternoon: 'stroll', evening: 'stroll', night: 'stroll' },
  },
}));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const at = (time: number, places = homes, day = 7) =>
  simulateResidents(places, time % 1440, day + Math.floor(time / 1440));

describe('Faraway Zoo and physical journey times', () => {
  it('reserves 24 plots starting at O, with four animal species and two empty habitats', () => {
    expect(ZOO_PLOTS).toHaveLength(24);
    expect(ZOO_PLOTS[0]).toBe('O4');
    expect(ZOO_PLOTS.at(-1)).toBe('R9');
    expect(ZOO_HABITATS.filter((h) => h.animal === null)).toHaveLength(2);
    expect(new Set(zooAnimalsAt(840).map((a) => a.species))).toEqual(
      new Set(['giraffe', 'elephant', 'zebra', 'penguin']),
    );
    for (const plot of ZOO_PLOTS) {
      expect(venueAt(plot)?.id).toBe('zoo');
      expect(HOUSE_PLOTS.some((p) => p.id === plot)).toBe(false);
      expect(placeSchema.safeParse({ ...sample, plot }).success).toBe(false);
    }
    const { left, right, top, bottom } = ZOO_GROUND;
    for (let x = left; x < right; x++)
      for (let y = top; y < bottom; y++) expect(isRoad(x, y)).toBe(false);
    expect(STREETLIGHTS.some((p) => insideZoo({ x: p.x + 0.5, y: p.y + 0.5 }))).toBe(false);
    for (const plot of HOUSE_PLOTS)
      expect(roadPath(plotEntrance(plot), ZOO_ENTRANCE).at(-1)).toEqual(ZOO_ENTRANCE);
    expect(cityHit(project(left + 0.2, top + 0.2), [], [])).toEqual({ kind: 'place', id: 'O6' });
    expect(cityHit(project(right - 0.2, bottom - 0.2), [], [])).toEqual({
      kind: 'place',
      id: 'O6',
    });
    const gate = project(ZOO_ENTRANCE.x, ZOO_ENTRANCE.y);
    expect(cityHit({ x: gate.x, y: gate.y - 30 }, [], [])).toEqual({ kind: 'place', id: 'O6' });
  });

  it('keeps animated animals inside their habitats and every visitor spot outside', () => {
    for (let time = 0; time < 1440; time += 7.3)
      for (const animal of zooAnimalsAt(time)) {
        const h = ZOO_HABITATS.find((h) => h.animal === animal.species)!;
        expect(animal.position.x).toBeGreaterThan(h.left);
        expect(animal.position.x).toBeLessThan(h.left + h.width);
        expect(animal.position.y).toBeGreaterThan(h.top);
        expect(animal.position.y).toBeLessThan(h.top + h.height);
      }
    for (const spot of ZOO_SPOTS) {
      expect(insideZoo(spot)).toBe(true);
      expect(insideZooHabitat(spot)).toBe(false);
    }
    expect(zooAnimalsAt(900)).toEqual(zooAnimalsAt(900));
    expect(zooAnimalsAt(900)).not.toEqual(zooAnimalsAt(910));
  });

  it('leaves earlier for a longer route, arrives late when busy, and skips an impossible visit', () => {
    const short = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    const long = [
      { x: 0, y: 0 },
      { x: 80, y: 0 },
    ];
    const near = planTravel(short, 840, 1020, 360, 1320)!;
    const far = planTravel(long, 840, 1020, 360, 1320)!;
    expect(far.depart).toBeLessThan(720);
    expect(near.arrive).toBe(835);
    expect(far.arrive).toBe(835);
    expect(near.depart - far.depart).toBeCloseTo(70 / WALK_SPEED);
    const late = planTravel(long, 840, 1020, 720, 1320)!;
    expect(late.depart).toBe(720);
    expect(late.arrive).toBe(970);
    expect(late.homeBy - late.leave).toBe(late.duration);
    expect(planTravel(long, 840, 1020, 780, 1320)).toBeUndefined();
    expect(planTravel(long, 840, 1020, 720, 1080)).toBeUndefined();
  });

  it('walks from the far side of town to the zoo and home at a constant speed without shortcuts', () => {
    const plans = residentTrips(homes, 7);
    const visits = homes.flatMap((home) =>
      (plans.get(home.id) ?? [])
        .filter((p) => p.event.id === 'zoo')
        .map((trip) => ({ home, trip })),
    );
    expect(visits.length).toBeGreaterThan(0);
    expect(visits.some(({ trip }) => trip.depart < 720 && trip.duration > 180)).toBe(true);
    for (const { home, trip } of visits) {
      const stateAt = (time: number) => at(time).find((r) => r.id === home.id)!;
      expect(
        distance(stateAt(trip.depart).position, plotEntrance(getPlot(home.plot)!)),
      ).toBeLessThan(1e-8);
      expect(stateAt(Math.max(trip.arrive, trip.event.start) + 0.01).event).toMatchObject({
        id: 'zoo',
        phase: 'attending',
      });
      expect(residentActivityLabel(stateAt(900))).toContain('Zoo');
      for (let time = trip.depart; time < trip.homeBy; time += 1.71) {
        const now = stateAt(time),
          next = stateAt(time + 0.001);
        expect(
          isRoad(Math.floor(now.position.x), Math.floor(now.position.y)) || insideZoo(now.position),
        ).toBe(true);
        expect(insideZooHabitat(now.position)).toBe(false);
        expect(distance(now.position, next.position)).toBeLessThanOrEqual(
          WALK_SPEED * 0.001 + 1e-8,
        );
        if (now.moving && next.moving && now.facing === next.facing)
          expect(distance(now.position, next.position) / 0.001).toBeCloseTo(WALK_SPEED, 6);
      }
      expect(
        distance(stateAt(trip.homeBy).position, plotEntrance(getPlot(home.plot)!)),
      ).toBeLessThan(1e-8);
      expect(stateAt(trip.homeBy).event?.id).not.toBe('zoo');
      for (const boundary of [
        trip.depart,
        trip.arrive,
        trip.event.start,
        trip.leave,
        trip.homeBy,
        720,
        1080,
        1320,
      ])
        expect(
          distance(stateAt(boundary - 0.001).position, stateAt(boundary + 0.001).position),
        ).toBeLessThan(0.002);
    }
  });

  it('respects work commitments and cannot double-book a resident or teleport at midnight', () => {
    const workers = homes.map((h) => ({
      ...h,
      resident: {
        ...h.resident,
        routine: {
          morning: 'work',
          afternoon: 'stroll',
          evening: 'stroll',
          night: 'sleep',
        } as const,
      },
    }));
    const visits = [...residentTrips(workers, 7).values()]
      .flat()
      .filter((p) => p.event.id === 'zoo');
    expect(visits.length).toBeGreaterThan(0);
    expect(
      visits.every((p) => p.depart >= 720 && p.arrive > p.event.start && p.arrive < p.event.end),
    ).toBe(true);
    expect(at(650, workers).every((r) => r.activity === 'work' && !r.event && !r.moving)).toBe(
      true,
    );
    for (const trips of residentTrips(homes, 7).values())
      trips.forEach((trip, index) => {
        expect(trip.arrive).toBeLessThan(trip.event.end);
        expect(trip.homeBy).toBeLessThanOrEqual(trip.availableUntil);
        if (index) expect(trip.depart).toBeGreaterThanOrEqual(trips[index - 1].homeBy);
      });
    for (const boundary of [360, 720, 1080, 1320, 1440, 1800]) {
      const before = at(boundary - 0.001),
        after = at(boundary + 0.001);
      before.forEach((r, index) =>
        expect(distance(r.position, after[index].position)).toBeLessThan(0.002),
      );
    }
    expect(at(900, [...homes].reverse()).reverse()).toEqual(at(900));
    at(1400);
    expect(at(900)).toEqual(at(900, [...homes]));
    const fullTown = HOUSE_PLOTS.map((plot, i) => ({
      ...homes[i % homes.length],
      id: `full-${i}`,
      plot: plot.id,
    }));
    for (let time = 370; time < 1800; time += 31.7)
      for (const state of at(time, fullTown)) {
        if (!state.event || state.event.id === 'football') continue;
        const event = eventsForDay(7).find((e) => e.id === state.event!.id)!;
        expect(
          isRoad(Math.floor(state.position.x), Math.floor(state.position.y)) ||
            insideVenue(event.venue, state.position),
        ).toBe(true);
      }
  });
});
