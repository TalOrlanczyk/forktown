# The Starlight Cinema

Four public plots, **D6, D7, E6, E7**, form a single outdoor cinema near the Lunch Green. The internal streets and lamps are removed, while the perimeter roads remain connected. Existing homes stay at their original addresses. These four plots are excluded from the builder and contribution validation.

The venue has a large isometric screen, twelve picnic rugs, soft string lights, a projector and a popcorn stand. At 20:00 the screen rises smoothly from its ground cassette over six real seconds, displaying the Forktown cinema ident before the show. After the closing card, it rolls back down over six seconds and stays tucked away during the day. It is always stowed by sunrise. Open the events menu or `#venue=cinema` to visit it and read tonight's bill.

## First three films

| Film                | Length     | Story                                                                                                                    |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| The Runaway Popcorn | 42 seconds | A kernel escapes a rattling pot, bounces across the counter, and finds its place in a popcorn bucket.                    |
| Miso and the Moon   | 54 seconds | Miso climbs toward a playful moon on a little cloud staircase, receives a shower of stars, and settles down on the roof. |
| The Last Duckling   | 60 seconds | A butterfly distracts a duckling; a surprised hop and a hurried chase reunite the family.                                |

These are original canvas animations, rendered locally with their own title cards and endings. No video downloads, external embeds, accounts, or remote services are needed. They are silent shorts accompanied by the town's existing soundtrack.

## Each night's program

The show starts at **20:30 town time**. One town minute equals one real second. The first library runs for three real minutes, finishing at **23:30**: 156 seconds of films, a six-second opening, two six-second intermissions, and a six-second closing. The cards display the Forktown logo and next title.

Each town day chooses exactly three distinct films in a seeded order. The selection is independent of the order of the library, and everyone sees the same movie at the same moment. Adding more titles changes the pool; it does not increase the number of films per night. Every film retains its own duration. The program's end and audience departure are calculated from the selected films, without truncating or stretching them. A bill must leave 45 town minutes to get home before 06:00.

Half the residents who chose both an evening stroll and a night out can attend, up to twelve. They walk in along the perimeter and side aisle and sit facing the screen. Afterward, selected disco guests can walk straight to the Little Stage if they can still dance for at least fifteen town minutes and get home before their own bedtime. Otherwise they walk home. Free time before bedtime can include moonlit walks and doorstep breaks. Residents with earlier bedtimes may leave the screening early to allow a full walk home; film playback is unchanged. Sleeping residents are never woken. The show runs even with no audience.

Cinema joins the live director's pool of possible daily highlights. When selected, the camera covers the complete program, including intermissions, before moving on. It does not count as an extra fourth highlight.

## Add another film

1. Add a unique entry to `CINEMA_FILMS` in `src/lib/cinema.ts`, with a title, description, duration in real seconds, and artwork key. Allow room for the renderer's three-second title and ending cards.
2. Add its artwork key to `FilmArtwork` and implement the corresponding drawing function in `src/city/cinema-films.ts`. Add it to the artwork dispatch map. Render from the supplied elapsed time rather than wall-clock state or unseeded randomness, so pausing, reloads, and late arrivals stay in sync.
3. Keep all art inside the 320 × 180 screen. Use the canvas save/restore boundary and local primitives; avoid remote assets and flashing effects.
4. Run `npm run check` and review the complete story in `tests/manual/cinema.html`, including its first frame, ending, and the next film's start.

The preview offers the full nightly bill, individual film starts, intermissions, screen raising and lowering, a daytime view, a screen close-up, and an optional simulated audience. Its controls never change the live town clock or saved resident routines.
