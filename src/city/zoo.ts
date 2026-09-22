import { ZOO_GROUND, ZOO_HABITATS, ZOO_CENTER, ZOO_ENTRANCE, zooAnimalsAt } from '../lib/zoo';
import { project, type Point } from '../lib/world';

type Ctx = CanvasRenderingContext2D;
type Object = { depth: number; paint: () => void };
export function zooSignHit(point: Point) {
  const gate = project(ZOO_ENTRANCE.x, ZOO_ENTRANCE.y);
  return (
    point.x >= gate.x - 110 &&
    point.x <= gate.x + 110 &&
    point.y >= gate.y - 48 &&
    point.y <= gate.y - 15
  );
}
function ground(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  const corners = [project(x, y), project(x + w, y), project(x + w, y + h), project(x, y + h)];
  ctx.fillStyle = color;
  ctx.beginPath();
  corners.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
}
function box(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}
function fence(ctx: Ctx, from: Point, to: Point, night: boolean) {
  const count = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / 0.65);
  const a = project(from.x, from.y),
    b = project(to.x, to.y);
  ctx.strokeStyle = night ? '#647C6D' : '#9A8864';
  ctx.lineWidth = 2;
  for (const rise of [7, 17]) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - rise);
    ctx.lineTo(b.x, b.y - rise);
    ctx.stroke();
  }
  for (let i = 0; i <= count; i++) {
    const p = project(
      from.x + ((to.x - from.x) * i) / count,
      from.y + ((to.y - from.y) * i) / count,
    );
    box(ctx, p.x - 2, p.y - 22, 4, 23, night ? '#70816C' : '#A8916D');
    box(ctx, p.x - 2, p.y - 23, 4, 3, night ? '#A3AF8A' : '#D0C09A');
  }
}
function tree(ctx: Ctx, point: Point, night: boolean, acacia = false) {
  const p = project(point.x, point.y);
  box(ctx, p.x - 3, p.y - 38, 6, 38, '#8B795C');
  const leaves = night ? '#4B7362' : '#6F965A';
  box(ctx, p.x - (acacia ? 29 : 17), p.y - 49, acacia ? 58 : 34, 16, leaves);
  box(ctx, p.x - (acacia ? 20 : 12), p.y - 58, acacia ? 42 : 24, 15, night ? '#63876B' : '#91AC68');
  box(ctx, p.x - 13, p.y - 57, 18, 5, night ? '#76936D' : '#B0BF7F');
}
function sign(ctx: Ctx, point: Point, text: string, night: boolean, small = false) {
  const p = project(point.x, point.y),
    width = small ? 108 : 220;
  box(ctx, p.x - width / 2 + 10, p.y - 25, 4, 25, '#887C61');
  box(ctx, p.x + width / 2 - 14, p.y - 25, 4, 25, '#887C61');
  box(ctx, p.x - width / 2, p.y - 48, width, small ? 26 : 33, '#3E6254');
  box(ctx, p.x - width / 2 + 3, p.y - 45, width - 6, 2, '#B7C68C');
  ctx.textAlign = 'center';
  ctx.font = `${small ? '9' : 'bold 15'}px "Space Mono", monospace`;
  ctx.fillStyle = night ? '#E9DFB9' : '#FBF0CE';
  ctx.fillText(text, p.x, p.y - (small ? 31 : 26));
}
function animal(ctx: Ctx, a: ReturnType<typeof zooAnimalsAt>[number], night: boolean) {
  const p = project(a.position.x, a.position.y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(a.facing, 1);
  ctx.fillStyle = '#253D3024';
  ctx.beginPath();
  ctx.ellipse(0, 2, a.species === 'elephant' ? 25 : 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const step = a.step * 2;
  if (a.species === 'giraffe') {
    const fur = night ? '#BFA66D' : '#D8B864';
    for (const x of [-12, -5, 7, 13]) box(ctx, x, -20, 4, 22 + (x % 2 ? step : -step), fur);
    box(ctx, -16, -34, 32, 17, fur);
    box(ctx, 9, -66, 7, 38, fur);
    box(ctx, 8, -74, 21, 11, fur);
    box(ctx, 12, -81, 3, 9, '#9A7650');
    box(ctx, 21, -81, 3, 9, '#9A7650');
    for (const [x, y] of [
      [-12, -31],
      [-2, -28],
      [9, -32],
      [11, -45],
      [11, -59],
    ])
      box(ctx, x, y, 4, 5, '#A27A43');
    box(ctx, 23, -72, 2, 2, '#344537');
    box(ctx, -21, -29, 6, 3, '#9A7650');
  } else if (a.species === 'elephant') {
    const skin = night ? '#7F9593' : '#9FAEAD';
    box(ctx, -24, -36, 43, 29, skin);
    box(ctx, -18, -10, 10, 13 + step, skin);
    box(ctx, 7, -10, 10, 13 - step, skin);
    box(ctx, 10, -42, 27, 29, skin);
    box(ctx, 29, -24, 8, 24, skin);
    box(ctx, 34, -4, 9, 5, skin);
    box(ctx, 9, -36, 14, 24, night ? '#708584' : '#899B9D');
    box(ctx, 12, -34, 8, 16, '#A8B5AD');
    box(ctx, 29, -33, 3, 3, '#344537');
    box(ctx, 27, -16, 10, 3, '#EEE4C8');
    box(ctx, -30, -26, 7, 3, skin);
  } else if (a.species === 'zebra') {
    const fur = night ? '#B7C2B5' : '#EAE9D5';
    for (const x of [-14, -7, 7, 14]) box(ctx, x, -14, 3, 16 + (x % 2 ? step : -step), '#485851');
    box(ctx, -18, -30, 35, 18, fur);
    box(ctx, 9, -43, 8, 24, fur);
    box(ctx, 10, -47, 20, 10, fur);
    for (const x of [-14, -5, 4, 12]) box(ctx, x, -29, 4, 16, '#46554C');
    box(ctx, 8, -47, 4, 21, '#46554C');
    box(ctx, 17, -53, 3, 8, '#46554C');
    box(ctx, 25, -45, 2, 2, '#253C31');
    box(ctx, -24, -26, 7, 2, '#46554C');
  } else {
    box(ctx, -8, -23, 16, 24, '#3A515B');
    box(ctx, -6, -30, 13, 12, '#3A515B');
    box(ctx, -4, -19, 9, 18, night ? '#C7D7CA' : '#F0EFDD');
    box(ctx, 6, -26, 8, 4, '#D8AB63');
    box(ctx, 3, -27, 2, 2, '#F8F3DD');
    box(ctx, -10, -17 + step, 3, 10, '#3A515B');
    box(ctx, 8, -17 - step, 3, 10, '#3A515B');
    box(ctx, -8, 0, 7, 3, '#D8AB63');
    box(ctx, 3, 0, 7, 3, '#D8AB63');
  }
  ctx.restore();
}

export function drawZoo(ctx: Ctx, minutes: number, night: boolean, selected = false): Object[] {
  const { left, right, top, bottom } = ZOO_GROUND;
  ground(ctx, left, top, right - left, bottom - top, night ? '#405F53' : '#A8C18C');
  // Broad, connected paths keep visitors outside the enclosures.
  ground(ctx, left + 0.05, top, 0.85, bottom - top, night ? '#7D8976' : '#DDD2AD');
  ground(ctx, left, ZOO_CENTER.y - 0.75, right - left, 1.5, night ? '#7D8976' : '#DDD2AD');
  ground(ctx, left, top, ZOO_ENTRANCE.x - left + 0.7, 0.7, night ? '#7D8976' : '#DDD2AD');
  const objects: Object[] = [];
  for (const [index, h] of ZOO_HABITATS.entries()) {
    ground(
      ctx,
      h.left,
      h.top,
      h.width,
      h.height,
      h.animal === 'penguin'
        ? night
          ? '#8AA5A3'
          : '#C5DADB'
        : h.animal
          ? night
            ? '#6D7959'
            : '#CBCA8D'
          : night
            ? '#4D715A'
            : '#9BB97D',
    );
    if (h.animal === 'penguin') {
      ground(ctx, h.left + 0.5, h.top + 0.6, 4, 2.3, night ? '#477A8B' : '#78B8C6');
      ground(ctx, h.left + 0.8, h.top + 0.8, 3, 0.15, '#BEDBDD');
      for (let i = 0; i < 4; i++)
        ground(ctx, h.left + 0.6 + i * 1.2, h.top + 4.2, 0.8, 0.5, '#DDE4D8');
    } else if (h.animal) {
      ground(ctx, h.left + 4.5, h.top + 3.7, 1.2, 0.8, night ? '#5C8E92' : '#8BBAC0');
      for (let i = 0; i < 9; i++)
        ground(
          ctx,
          h.left + 0.5 + (i % 3) * 1.8,
          h.top + 0.5 + Math.floor(i / 3) * 1.6,
          0.3,
          0.18,
          night ? '#7C8A5E' : '#B1B77B',
        );
      const point = { x: h.left + 0.8, y: h.top + 0.9 };
      objects.push({
        depth: point.x + point.y,
        paint: () => tree(ctx, point, night, h.animal === 'giraffe'),
      });
    } else {
      for (let i = 0; i < 4; i++) {
        const point = { x: h.left + 0.9 + i * 1.4, y: h.top + 1.1 };
        objects.push({ depth: point.x + point.y, paint: () => tree(ctx, point, night) });
      }
      const point = { x: h.left + h.width / 2, y: h.top + h.height / 2 };
      objects.push({
        depth: point.x + point.y,
        paint: () => {
          sign(ctx, point, 'FUTURE HABITAT', night, true);
          const p = project(point.x, point.y);
          ctx.font = '9px "Space Mono", monospace';
          ctx.fillStyle = night ? '#BDCEA4' : '#48674D';
          ctx.fillText('ROOM TO GROW', p.x, p.y + 16);
        },
      });
    }
    const a = { x: h.left, y: h.top },
      b = { x: h.left + h.width, y: h.top },
      c = { x: h.left + h.width, y: h.top + h.height },
      d = { x: h.left, y: h.top + h.height };
    for (const [from, to] of [
      [a, b],
      [b, c],
      [c, d],
      [d, a],
    ]) {
      // Segment the fences to share the painter's depth order with moving animals.
      const length = Math.ceil(Math.hypot(to.x - from.x, to.y - from.y));
      for (let i = 0; i < length; i++) {
        const p = {
          x: from.x + ((to.x - from.x) * i) / length,
          y: from.y + ((to.y - from.y) * i) / length,
        };
        const q = {
          x: from.x + ((to.x - from.x) * (i + 1)) / length,
          y: from.y + ((to.y - from.y) * (i + 1)) / length,
        };
        objects.push({ depth: (p.x + p.y + q.x + q.y) / 2, paint: () => fence(ctx, p, q, night) });
      }
    }
    if (h.animal) {
      const point = {
        x: h.left + h.width / 2,
        y: index < 3 ? h.top + h.height + 0.2 : h.top - 0.2,
      };
      objects.push({
        depth: point.x + point.y,
        paint: () => sign(ctx, point, h.name.toUpperCase(), night, true),
      });
    }
  }
  for (const a of zooAnimalsAt(minutes))
    objects.push({ depth: a.position.x + a.position.y, paint: () => animal(ctx, a, night) });
  objects.push({
    depth: ZOO_ENTRANCE.x + ZOO_ENTRANCE.y,
    paint: () => sign(ctx, ZOO_ENTRANCE, 'THE FARAWAY ZOO', night),
  });
  if (selected) {
    ctx.strokeStyle = '#F2E2A1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    [
      project(left, top),
      project(right, top),
      project(right, bottom),
      project(left, bottom),
    ].forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();
  }
  return objects;
}
