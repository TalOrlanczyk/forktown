import { ZOO_HABITATS } from '../lib/zoo';

export default function ZooInfo({ minutes, watching }: { minutes: number; watching: number }) {
  return (
    <div className="venue-info">
      <span className="quiet-label">PUBLIC SPACE · O4–R9 · 24 PLOTS</span>
      <div className="venue-program">
        <span className="eyebrow">
          {minutes >= 840 && minutes < 1020
            ? 'AN AFTERNOON WITH THE ANIMALS'
            : 'A LITTLE FURTHER, A LITTLE WILDER'}
        </span>
        <h3>Welcome to the Faraway Zoo.</h3>
        <p>
          Four animal habitats, shady paths, and room to grow. Meet the animals each town day from
          14:00–17:00.
        </p>
        <p className="muted-copy">
          {watching} neighbors watching. Visitors plan their walk from home; those further away set
          out earlier when their routine allows.
        </p>
      </div>
      {ZOO_HABITATS.map((habitat, index) => (
        <div className="venue-program" key={habitat.id}>
          <span className="eyebrow">
            HABITAT {index + 1} ·{' '}
            {habitat.animal ? 'MEET THE NEIGHBORS' : 'RESERVED FOR THE FUTURE'}
          </span>
          <h3>{habitat.name}</h3>
          <p>
            {habitat.animal
              ? {
                  giraffe: 'Tall friends strolling beneath the acacia trees.',
                  elephant: 'A gentle herd with a meadow and a watering hole.',
                  zebra: 'Stripes, sunshine, and room to wander.',
                  penguin: 'A little colony beside a cool blue pool.',
                }[habitat.animal]
              : 'A planted, empty enclosure, ready for a new animal species one day.'}
          </p>
        </div>
      ))}
    </div>
  );
}
