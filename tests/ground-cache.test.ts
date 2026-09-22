import { afterEach, describe, expect, it, vi } from 'vitest';
import { paintGroundLayer } from '../src/city/ground-cache';

function surface() {
  const canvas = { width: 1280, height: 720 };
  const transform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const ctx = {
    canvas,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    getTransform: () => transform,
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, canvas, transform };
}
function browser() {
  const font = { status: 'loaded', check: vi.fn(() => true) };
  const createElement = vi.fn(() => {
    const layer = surface();
    return Object.assign(layer.canvas, { getContext: () => layer.ctx });
  });
  vi.stubGlobal('document', { createElement, fonts: font });
  return { createElement, font };
}
afterEach(() => vi.unstubAllGlobals());

describe('Viewport ground caching', () => {
  it('reuses terrain across animation frames without growing the number of surfaces', () => {
    const { createElement } = browser();
    const { ctx } = surface();
    const paint = vi.fn();
    for (let frame = 0; frame < 100; frame++) paintGroundLayer(ctx, 'day:A1', paint);
    expect(paint).toHaveBeenCalledTimes(1);
    expect(createElement).toHaveBeenCalledTimes(1);
    expect(ctx.drawImage).toHaveBeenCalledTimes(100);
  });

  it('refreshes pixels after pan, zoom, resize, scene changes and font loading', () => {
    const { createElement, font } = browser();
    const { ctx, transform, canvas } = surface();
    const paint = vi.fn();
    paintGroundLayer(ctx, 'day:A1', paint);
    transform.e = 45;
    paintGroundLayer(ctx, 'day:A1', paint);
    transform.a = transform.d = 2;
    paintGroundLayer(ctx, 'day:A1', paint);
    canvas.width = 780;
    canvas.height = 1688;
    paintGroundLayer(ctx, 'day:A1', paint);
    paintGroundLayer(ctx, 'night:A1', paint);
    paintGroundLayer(ctx, 'night:A1,A2', paint);
    font.status = 'loading';
    paintGroundLayer(ctx, 'night:A1,A2', paint);
    font.status = 'loaded';
    paintGroundLayer(ctx, 'night:A1,A2', paint);
    expect(paint).toHaveBeenCalledTimes(8);
    expect(createElement).toHaveBeenCalledTimes(1);
    const cached = createElement.mock.results[0].value;
    expect([cached.width, cached.height]).toEqual([780, 1688]);
    paintGroundLayer(ctx, 'night:A1,A2', paint);
    expect(paint).toHaveBeenCalledTimes(8);
  });

  it('isolates maps and draws oversized or translucent views directly', () => {
    const { createElement } = browser();
    const a = surface(),
      b = surface();
    const paint = vi.fn();
    paintGroundLayer(a.ctx, 'day', paint);
    paintGroundLayer(b.ctx, 'day', paint);
    expect(createElement).toHaveBeenCalledTimes(2);
    a.canvas.width = a.canvas.height = 8192;
    paintGroundLayer(a.ctx, 'day', paint);
    expect(paint).toHaveBeenLastCalledWith(a.ctx);
    b.ctx.globalAlpha = 0.5;
    paintGroundLayer(b.ctx, 'day', paint);
    expect(paint).toHaveBeenLastCalledWith(b.ctx);
    expect(createElement).toHaveBeenCalledTimes(2);
  });
});
