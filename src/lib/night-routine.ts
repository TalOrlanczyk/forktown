import type { Place } from './schema';
import type { ResidentTrip } from './resident-trips';
import { getPlot, hash, plotEntrance, type Point } from './world';
import { alongRoute, roadNodes, roadPath, routeLength, WALK_SPEED } from './walking';

/** Bedtimes belong to the evening: 1440 is midnight, 1740 is 05:00. */
export function nightBedtime(home: Place): number {
  return 1440 + (hash(home.id) % 3) * 120 + (hash(`bedtime-offset:${home.id}`) % 61);
}

const routes = new WeakMap<Place, Point[]>();
function localRoute(home: Place) {
  let route = routes.get(home);
  if (route) return route;
  const doorstep = plotEntrance(getPlot(home.plot)!);
  const nearby = roadNodes.filter((point) => {
    const distance = Math.abs(point.x - doorstep.x) + Math.abs(point.y - doorstep.y);
    return distance >= 4 && distance <= 8;
  });
  const destination = nearby[hash(`moon:${home.id}`) % nearby.length] ?? doorstep;
  route = roadPath(doorstep, destination);
  routes.set(home, route);
  return route;
}

/** Fill a free gap with complete road loops and visible rests at the doorstep. */
export function nightLeisure(home: Place, time: number, trips: ResidentTrip[]) {
  const start = Math.max(
    1320,
    ...trips.filter((trip) => trip.homeBy <= time).map((trip) => trip.homeBy),
  );
  const end = Math.min(
    nightBedtime(home),
    ...trips.filter((trip) => trip.depart > time).map((trip) => trip.depart),
  );
  const rest = 6 + (hash(`night-rest:${home.id}`) % 13);
  const maxSteps = Math.max(0, Math.floor(((end - start - rest) * WALK_SPEED) / 2));
  const outward = localRoute(home).slice(0, maxSteps + 1);
  const route = [...outward, ...outward.slice(0, -1).reverse()];
  const duration = routeLength(route) / WALK_SPEED;
  const cycle = rest + duration;
  const elapsed = time - start;
  const lap = Math.floor(elapsed / cycle);
  const phase = elapsed - lap * cycle;
  const walking = duration > 0 && lap < Math.floor((end - start) / cycle) && phase >= rest;
  return {
    ...alongRoute(route, walking ? (phase - rest) / duration : 0),
    moving: walking,
    nightWalk: walking,
    nightPorch: !walking,
    ...(!walking ? { pose: home.building === 'cafe' ? ('sip' as const) : ('sit' as const) } : {}),
  };
}
