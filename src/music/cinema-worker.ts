import type { CinemaFilm } from '../lib/cinema';
import { renderCinemaPCM } from './cinema-render';
self.onmessage = (event: MessageEvent<CinemaFilm>) => {
  try {
    const mix = renderCinemaPCM(event.data);
    self.postMessage(mix, { transfer: [mix.left.buffer, mix.right.buffer] });
  } catch {
    self.postMessage({ error: 'Could not render the film soundtrack.' });
  }
};
