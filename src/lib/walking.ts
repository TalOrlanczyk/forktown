import { isRoad, ROAD_MIN, ROAD_MAX_X, ROAD_MAX_Y, type Point } from './world';
import type { ResidentState } from './simulation';

export function facingAlong(from: Point, to: Point): ResidentState['facing'] {
  if (to.x !== from.x) return to.x > from.x ? 'se' : 'nw';
  return to.y >= from.y ? 'sw' : 'ne';
}
export const roadNodes: Point[] = [];
for (let x = ROAD_MIN; x <= ROAD_MAX_X; x++)
  for (let y = ROAD_MIN; y <= ROAD_MAX_Y; y++)
    if (isRoad(x, y)) roadNodes.push({ x: x + 0.5, y: y + 0.5 });
const key = (point: Point) => `${point.x},${point.y}`;
const graph = new Map(roadNodes.map((point) => [key(point), point]));
const paths = new Map<string, Point[]>();
export function roadPath(from: Point, to: Point): Point[] {
  const cacheKey = `${key(from)}:${key(to)}`;
  if (paths.has(cacheKey)) return paths.get(cacheKey)!;
  const queue = [from],
    previous = new Map<string, Point | null>([[key(from), null]]);
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (key(current) === key(to)) break;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next = graph.get(key({ x: current.x + dx, y: current.y + dy }));
      if (next && !previous.has(key(next))) {
        previous.set(key(next), current);
        queue.push(next);
      }
    }
  }
  if (!previous.has(key(to))) return [from];
  const path: Point[] = [];
  for (let current: Point | null = to; current; current = previous.get(key(current)) ?? null)
    path.unshift(current);
  // Bound the cache even when many custom neighbors are previewed.
  if (paths.size > 4096) paths.clear();
  paths.set(cacheKey, path);
  return path;
}
export function alongRoute(route: Point[], progress: number) {
  if (progress >= 1)
    return { position: route.at(-1)!, moving: false, facing: 'ne' as const, walkPhase: 0 };
  // Distance-based interpolation also handles the short, fractional audience spacing.
  const lengths = route
    .slice(1)
    .map((point, i) => Math.hypot(point.x - route[i].x, point.y - route[i].y));
  let remaining = Math.max(0, Math.min(1, progress)) * lengths.reduce((sum, n) => sum + n, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (remaining < lengths[i]) {
      const fraction = remaining / lengths[i];
      return {
        position: {
          x: route[i].x + (route[i + 1].x - route[i].x) * fraction,
          y: route[i].y + (route[i + 1].y - route[i].y) * fraction,
        },
        moving: true,
        facing: facingAlong(route[i], route[i + 1]),
        walkPhase: (remaining * 3) % 1,
      };
    }
    remaining -= lengths[i];
  }
  return { position: route.at(-1)!, moving: false, facing: 'ne' as const, walkPhase: 0 };
}

// Tiles per town minute. A distant home changes the journey time, never this speed.
export const WALK_SPEED = 0.32;
export const routeLength = (route: readonly Point[]) =>
  route
    .slice(1)
    .reduce(
      (sum, point, index) => sum + Math.hypot(point.x - route[index].x, point.y - route[index].y),
      0,
    );
export function planTravel(
  route: Point[],
  start: number,
  end: number,
  availableFrom: number,
  availableUntil: number,
  stagger = 0,
) {
  const duration = routeLength(route) / WALK_SPEED;
  const depart = Math.max(availableFrom, start - 5 - stagger - duration);
  const arrive = depart + duration;
  const leave = Math.min(end + stagger, availableUntil - duration);
  // No sprinting, teleporting, or trip with no time left to see the event.
  if (arrive >= end || leave <= Math.max(start, arrive)) return undefined;
  return { route, duration, depart, arrive, leave, homeBy: leave + duration };
}
export type TravelPlan = NonNullable<ReturnType<typeof planTravel>>;
