import { cinemaAt, CINEMA_FILMS, CINEMA_PLOTS } from '../lib/cinema';
import { timeLabel } from '../lib/simulation';

export default function CinemaInfo({ minutes, day }: { minutes: number; day: number }) {
  const state = cinemaAt(minutes, day);
  const movieSlots = state.program.slots.filter((slot) => slot.kind === 'film');
  return (
    <div className="venue-info">
      <span className="quiet-label">PUBLIC SPACE · {CINEMA_PLOTS.join(' / ')}</span>
      <div className="venue-program">
        <span className="eyebrow">
          {state.live ? 'ON THE SCREEN NOW' : 'TONIGHT UNDER THE STARS'}
        </span>
        <h3>
          {state.slot?.film?.title ??
            (state.slot?.kind === 'closing'
              ? 'That’s a wrap.'
              : state.live
                ? 'A little cinema break'
                : 'Three little films. One lovely night.')}
        </h3>
        <p>
          A seat on the lawn, a warm light, and three original stories. The program starts at{' '}
          {timeLabel(state.program.start)} and ends at {timeLabel(state.program.end)}.
        </p>
        <p className="muted-copy">Six seconds between films for a little breather.</p>
        <p className="muted-copy">
          Turn on town sound and zoom into the screen to hear each film’s music and sound effects.
        </p>
      </div>
      {movieSlots.map((slot, index) => (
        <div className="venue-program" key={slot.film!.id}>
          <span className="eyebrow">
            FILM {index + 1} · {slot.film!.duration} SECONDS · {timeLabel(slot.start)}
          </span>
          <h3>{slot.film!.title}</h3>
          <p>{slot.film!.description}</p>
        </div>
      ))}
      <p className="muted-copy">
        Three of {CINEMA_FILMS.length} original films each town night. Everyone shares the same
        program, even after a refresh. Night owls can take a seat; the screen plays even on quiet
        evenings.
      </p>
    </div>
  );
}
