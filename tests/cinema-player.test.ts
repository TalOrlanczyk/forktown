import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CinemaPlayer } from '../src/music/cinema-player';
import { CINEMA_FILMS } from '../src/lib/cinema';
import { renderCinemaTrack } from '../src/music/synth';
vi.mock('../src/music/synth', () => ({ renderCinemaTrack: vi.fn() }));

const param = () => ({
  value: 0,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  setTargetAtTime: vi.fn(),
  cancelAndHoldAtTime: vi.fn(),
});
function harness() {
  const sources: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }[] = [];
  const context = {
    currentTime: 10,
    state: 'running',
    createGain: () => ({ gain: param(), connect: vi.fn().mockReturnThis(), disconnect: vi.fn() }),
    createStereoPanner: () => ({
      pan: param(),
      connect: vi.fn().mockReturnThis(),
      disconnect: vi.fn(),
    }),
    createBufferSource: () => {
      const source = {
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
        connect: vi.fn().mockReturnThis(),
      };
      sources.push(source);
      return source;
    },
  };
  const duck = vi.fn();
  return {
    context,
    sources,
    duck,
    player: new CinemaPlayer(context as unknown as AudioContext, {} as AudioNode, duck),
  };
}
const frame = (elapsed = 12, key = 'night:popcorn') => ({
  film: CINEMA_FILMS[0],
  elapsed,
  key,
  gain: 0.8,
  pan: 0.2,
});
const flushed = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(renderCinemaTrack).mockResolvedValue({} as AudioBuffer);
});

describe('Cinema playback follows the screen', () => {
  it('starts at the current frame, keeps playing through ordinary ticks, and seeks on a jump', async () => {
    const { context, sources, player, duck } = harness();
    player.sync(frame());
    await flushed();
    expect(sources[0].start).toHaveBeenCalledWith(10, 12);
    expect(duck).toHaveBeenLastCalledWith(0.8);
    context.currentTime += 0.1;
    player.sync(frame(12.1));
    await flushed();
    expect(sources).toHaveLength(1);
    player.sync(frame(25));
    await flushed();
    expect(sources[0].stop).toHaveBeenCalled();
    expect(sources[1].start).toHaveBeenCalledWith(10.1, 25);
    expect(renderCinemaTrack).toHaveBeenCalledTimes(1);
    player.dispose();
  });
  it('compensates for rendering time instead of restarting the film', async () => {
    let finish!: (buffer: AudioBuffer) => void;
    vi.mocked(renderCinemaTrack).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { context, sources, player } = harness();
    player.sync(frame(12));
    context.currentTime = 11;
    player.sync(frame(13));
    context.currentTime = 11.5;
    finish({} as AudioBuffer);
    await flushed();
    expect(sources[0].start).toHaveBeenCalledWith(11.5, 13.5);
    player.dispose();
  });
  it.each(['mute', 'leave', 'dispose', 'suspend', 'end'] as const)(
    'never starts a pending render after %s',
    async (action) => {
      let finish!: (buffer: AudioBuffer) => void;
      vi.mocked(renderCinemaTrack).mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const { context, sources, player, duck } = harness();
      player.sync(frame());
      if (action === 'dispose') player.dispose();
      else if (action === 'suspend') {
        context.state = 'suspended';
        player.sync(frame());
      } else if (action === 'leave') player.sync({ ...frame(), gain: 0 });
      else if (action === 'end') player.sync(frame(CINEMA_FILMS[0].duration));
      else player.stop();
      finish({} as AudioBuffer);
      await flushed();
      expect(sources).toHaveLength(0);
      expect(duck).toHaveBeenLastCalledWith(0);
      player.dispose();
    },
  );
  it('stops during an interval, then resumes from the new position and handles a new night', async () => {
    const { sources, player } = harness();
    player.sync(frame());
    await flushed();
    player.sync();
    expect(sources[0].stop).toHaveBeenCalled();
    player.sync(frame(22));
    await flushed();
    expect(sources[1].start).toHaveBeenCalledWith(10, 22);
    player.sync(frame(0, 'next-night:popcorn'));
    await flushed();
    expect(sources[2].start).toHaveBeenCalledWith(10, 0);
    player.dispose();
  });
  it('ignores a superseded film render and does not retry failed audio every frame', async () => {
    let finish!: (buffer: AudioBuffer) => void;
    vi.mocked(renderCinemaTrack).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { sources, player } = harness();
    player.sync(frame());
    player.sync({ ...frame(), film: CINEMA_FILMS[1], key: 'moon' });
    await flushed();
    finish({} as AudioBuffer);
    await flushed();
    expect(sources).toHaveLength(1);
    vi.mocked(renderCinemaTrack).mockRejectedValueOnce(new Error('worker failed'));
    const next = { ...frame(), film: CINEMA_FILMS[2], key: 'duckling' };
    player.sync(next);
    await flushed();
    expect(player.status).toBe('error');
    for (let i = 0; i < 30; i++) player.sync(next);
    expect(renderCinemaTrack).toHaveBeenCalledTimes(3);
    player.stop();
    player.sync(next);
    await flushed();
    expect(player.status).toBe('playing');
    player.dispose();
  });
});
