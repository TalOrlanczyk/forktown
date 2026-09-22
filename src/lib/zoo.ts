import { ZOO_SITE } from './town-config.ts';
import { BLOCK_SIZE, PLOTS, project, type Point } from './world.ts';

export const ZOO_VENUE = { id: 'zoo', plot: 'O6', name: 'The Faraway Zoo', kind: 'zoo' } as const;
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
export function zooAnimalsAt(minutes: number) {
  return ZOO_HABITATS.flatMap((h, habitat) =>
    h.animal
      ? Array.from({ length: h.animal === 'penguin' ? 5 : 3 }, (_, index) => {
          const phase = minutes / 35 + habitat * 2 + index * 2.1;
          return {
            id: `${h.animal}-${index}`,
            species: h.animal!,
            position: {
              x: h.left + h.width / 2 + Math.cos(phase) * 1.65,
              y: h.top + h.height / 2 + Math.sin(phase * 0.7) * 1.25,
            },
            facing: Math.cos(phase) >= 0 ? 1 : -1,
            step: Math.sin(phase * 8),
          };
        })
      : [],
  );
}
