import type { Place } from './schema';
import type { ResidentState } from './simulation';
import { getPlot, hash, plotEntrance, type Point } from './world';
import { EVENT_SPOTS, eventSpot, eventsForDay, type TownEvent, type Venue } from './events';
import { cinemaGuests, CINEMA_ENTRANCE } from './cinema';
import { FOOTBALL_ENTRANCE, FOOTBALL_VENUE, spectatorSpot, footballAt } from './football';
import { zooRoute } from './zoo';
import { alongRoute, planTravel, roadPath, type TravelPlan } from './walking';

type VisitEvent = Omit<TownEvent, 'venue' | 'period'> & {
  venue: Venue | typeof FOOTBALL_VENUE;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
};
export type ResidentTrip = TravelPlan & {
  event: VisitEvent;
  seat: number;
  facing: ResidentState['facing'];
  availableFrom: number;
  availableUntil: number;
};
const periods = ['morning', 'afternoon', 'evening', 'night'] as const;
const boundaries = [360, 720, 1080, 1320, 1800];
const plans = new WeakMap<Place[], Map<number, Map<string, ResidentTrip[]>>>();

function availableWindow(home: Place, period: (typeof periods)[number]) {
  let first = periods.indexOf(period),
    last = first;
  while (first > 0 && home.resident.routine[periods[first - 1]] === 'stroll') first--;
  while (last < 3 && home.resident.routine[periods[last + 1]] === 'stroll') last++;
  return { availableFrom: boundaries[first], availableUntil: boundaries[last + 1] };
}

export function eventRoute(home: Place, event: VisitEvent, seat: number): Point[] {
  const doorstep = plotEntrance(getPlot(home.plot)!);
  if (event.venue.kind === 'football') {
    const spot = spectatorSpot(seat);
    return [...roadPath(doorstep, FOOTBALL_ENTRANCE), { x: spot.x, y: FOOTBALL_ENTRANCE.y }, spot];
  }
  const audience = eventSpot(event.venue, seat).position;
  if (event.venue.kind === 'zoo') {
    const path = zooRoute(audience);
    return [...roadPath(doorstep, path[0]), ...path.slice(1)];
  }
  const entrance =
    event.venue.kind === 'cinema' ? CINEMA_ENTRANCE : plotEntrance(getPlot(event.venue.plot)!);
  const laneX =
    event.venue.kind === 'cinema'
      ? 28.5
      : event.venue.kind === 'green'
        ? entrance.x - 1.35
        : audience.x;
  return [
    ...roadPath(doorstep, entrance),
    { x: laneX, y: entrance.y },
    { x: laneX, y: audience.y },
    audience,
  ];
}

/** Derive a full day's commitments together so early departures and return walks survive period changes. */
export function residentTrips(places: Place[], day: number): Map<string, ResidentTrip[]> {
  const cached = plans.get(places)?.get(day);
  if (cached) return cached;
  const candidates = new Map<
    string,
    { event: VisitEvent; seat: number; period: (typeof periods)[number] }[]
  >();
  const program = eventsForDay(day);
  const movieGuests = cinemaGuests(places, day);
  const sorted = (period: (typeof periods)[number], key: string, excluded: string[] = []) =>
    places
      .filter((home) => home.resident.routine[period] === 'stroll' && !excluded.includes(home.id))
      .sort((a, b) => hash(`${key}:${a.id}`) - hash(`${key}:${b.id}`) || a.id.localeCompare(b.id));
  const add = (
    event: VisitEvent,
    ids: string[],
    period: (typeof periods)[number] = event.period,
  ) => {
    ids.forEach((id, seat) => {
      const list = candidates.get(id) ?? [];
      list.push({ event, seat, period });
      candidates.set(id, list);
    });
  };
  const picnic = program[0],
    concert = program[1],
    party = program.find((e) => e.id === 'night-party')!;
  const picnicIds = sorted('afternoon', `${day}:${picnic.id}`)
    .slice(0, EVENT_SPOTS.green.length)
    .map((h) => h.id);
  add(picnic, picnicIds);
  add(
    concert,
    sorted('evening', `${day}:${concert.id}`, movieGuests)
      .slice(0, EVENT_SPOTS.stage.length)
      .map((h) => h.id),
  );
  add(
    party,
    sorted('night', `${day}:${party.id}`, movieGuests)
      .slice(0, EVENT_SPOTS.stage.length)
      .map((h) => h.id),
  );
  add(
    program.find((e) => e.id === 'cinema')!,
    movieGuests,
    'evening',
  );
  const zooCandidates = sorted('afternoon', `zoo:${day}`, picnicIds);
  const zooIds = zooCandidates
    .slice(0, Math.min(EVENT_SPOTS.zoo.length, Math.ceil(zooCandidates.length / 2)))
    .map((h) => h.id);
  add(
    program.find((e) => e.id === 'zoo')!,
    zooIds,
  );
  for (const period of ['morning', 'afternoon'] as const) {
    const fans = sorted(
      period,
      `fans:${day}:${period}`,
      period === 'afternoon' ? [...picnicIds, ...zooIds] : [],
    );
    const start = period === 'morning' ? 360 : 720;
    // Football uses the same physical travel rules, with a morning or afternoon visit.
    const football: VisitEvent = {
      id: 'football',
      name: 'The Meadow Ground',
      description: 'Watching the football',
      venue: FOOTBALL_VENUE,
      period,
      depart: start,
      start: start + 70,
      end: start + 285,
      homeBy: start + 350,
    };
    add(
      football,
      fans.slice(0, Math.min(6, Math.ceil(fans.length / 2))).map((h) => h.id),
      period,
    );
  }
  const result = new Map<string, ResidentTrip[]>();
  for (const home of places) {
    if (!getPlot(home.plot)) continue;
    const trips: ResidentTrip[] = [];
    for (const { event, seat, period } of (candidates.get(home.id) ?? []).sort(
      (a, b) => a.event.start - b.event.start,
    )) {
      const window = availableWindow(home, period);
      const previousReturn = trips.at(-1)?.homeBy ?? window.availableFrom;
      const travel = planTravel(
        eventRoute(home, event, seat),
        event.start,
        event.end,
        Math.max(window.availableFrom, previousReturn),
        window.availableUntil,
        seat * 1.3,
      );
      if (!travel) continue;
      trips.push({
        ...travel,
        ...window,
        event,
        seat,
        facing: event.venue.kind === 'football' ? 'ne' : eventSpot(event.venue, seat).facing,
      });
    }
    result.set(home.id, trips);
  }
  let byDay = plans.get(places);
  if (!byDay) {
    byDay = new Map();
    plans.set(places, byDay);
  }
  if (byDay.size >= 3) byDay.clear();
  byDay.set(day, result);
  return result;
}

export function tripState(
  home: Place,
  trip: ResidentTrip,
  time: number,
  day: number,
): Partial<ResidentState> {
  const { event, seat, route, duration, depart, arrive, leave, facing } = trip;
  const phase =
    time < Math.max(arrive, event.start) ? 'going' : time < leave ? 'attending' : 'returning';
  const movement =
    phase === 'going'
      ? alongRoute(route, (time - depart) / duration)
      : phase === 'returning'
        ? alongRoute([...route].reverse(), (time - leave) / duration)
        : { position: route.at(-1)!, moving: false, facing, walkPhase: 0 };
  const beat = Math.floor((time + (hash(home.id) % 19)) / 12);
  const pose =
    event.venue.kind === 'football'
      ? footballAt(time, day).goal
        ? 'cheer'
        : undefined
      : event.venue.kind === 'zoo'
        ? undefined
        : event.venue.kind === 'cinema'
          ? 'sit'
          : event.id === 'night-party'
            ? 'dance'
            : event.venue.kind === 'stage'
              ? (event.id === 'rock' ? beat % 3 !== 0 : beat % 4 === 0)
                ? 'cheer'
                : 'sway'
              : event.id === 'books'
                ? beat % 4 === 0
                  ? 'sip'
                  : 'read'
                : event.id === 'games' && seat % 2 === 0
                  ? 'play'
                  : (['sit', 'sip', 'chat', 'sit'] as const)[(beat + seat) % 4];
  return {
    ...movement,
    activity: 'stroll',
    event: { id: event.id, name: event.name, phase },
    ...(phase === 'attending' ? { pose, walkPhase: (time / 5 + seat / 10) % 1 } : {}),
  };
}
