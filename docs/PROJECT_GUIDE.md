# Forktown project guide

[← Start with the visual quick start](../README.md)

Features, project structure, and development commands. For your first house, follow the README; for the JSON contract and contribution rules, read [Contributing](../CONTRIBUTING.md).

Starter places use `creator: "forktown"` as a project credit, not a real community contribution or a GitHub account endorsement.

## What works

- An original isometric city renderer, with trees, roads, a river, little residents, and six building styles.
- Wildflower patches on open plots, small daytime flocks, and chimney smoke and evening window silhouettes when neighbors are home. Ambient movement pauses with the town.
- A daily 08:00–12:30 duck walk: a mother and five ducklings leave the river, follow the street beside the Lunch Green to the first houses, turn around, and return to the water. The last duckling briefly dawdles and catches up. Nearby wandering residents stop for four seconds, turn toward the ducks, and show a heart bubble before resuming their walk. The family appears in both town and live views, without needing resident participation.
- Mouse and touch panning, zoom buttons, scroll zoom, and keyboard map controls.
- Custom floors, roof shapes, wall and trim colors, window styles, gardens, porches, and balconies.
- Residents with male and female figures, names, outfits, accessories, greetings, and simple day and night routines. Existing JSON files keep the original figure when `resident.figure` is omitted.
- Road-following strolls with four directional walking views, distance-based footsteps, occasional neighbor greetings, bedtime, and a camera that follows a resident.
- Shared daily events: picnics, books, and lawn games at the Lunch Green; rock, acoustic, and jazz evenings at the Little Stage. Strolling neighbors can join a small audience and walk home afterward. Both venues are reserved public plots.
- A nightly 23:30–02:30 disco at the Little Stage, with a DJ, dancing night owls, steady pastel lights, and an original dance track. Guests walk home by 04:30; sleeping neighbors stay indoors.
- The four-plot Starlight Cinema on D6, D7, E6, and E7: three original animated shorts every night from 20:30, with six-second Forktown intermissions, a twelve-seat picnic lawn, projector, string lights, and popcorn stand. Film lengths stay independent; each day selects three distinct titles from the library. Night owls can attend instead of the disco. See [the cinema and film library guide](CINEMA.md).
- The six-plot Meadow Ground: four-a-side football all day, a live scoreboard, passing, shots, saves, goal celebrations, spectators, and short breaks between halves. Zoom close with Town sound enabled for kicks, whistles, and cheers. See [Football at the Meadow Ground](FOOTBALL.md).
- A shared UTC-based 24-minute town day, automatic day/night lighting, pause/resume-live, and reduced-motion support.
- Optional original music: day and night themes, three concert arrangements, and a midnight dance track, with a volume control, soft transitions, and automatic pause when the tab is hidden. See [Forktown FM](MUSIC.md) for the listening preview and score guide.
- Exterior signs: simple text or a restricted HTML/CSS artwork language, drawn as noninteractive canvas textures.
- A full-screen town with compact controls. Explore opens searchable places and open plots; the neighbor and music buttons reveal residents and events. All directories work with a keyboard.
- Place stories, contributor credit, and shareable `#place=id` links without server routing.
- A live building editor, local preview, direct saves to your local checkout, JSON export, and browser-based contribution instructions.
- A shared schema used by the editor, build, and contribution validator.
- Friendly errors for occupied plots, duplicate ids, invalid names, unsupported fields, and malformed JSON.
- Automated checks on pull requests and optional GitHub Pages deployment.
- All fonts, art, and place data are served locally. The hosted city needs no backend and includes no analytics; development saves use only the local server.

## Project map

```text
places/                    One JSON file per place — start here!
examples/                  A copyable contribution example
src/lib/schema.ts          The contribution contract and friendly validator
src/lib/world.ts           Stable plot coordinates and projection math
src/city/render.ts         Terrain and depth-sorted world renderer
src/city/houses.ts         Customizable homes and exterior sign textures
src/city/residents.ts      Pixel resident artwork
src/lib/simulation.ts      Deterministic road routes and daily routines
src/lib/sign.ts            Restricted HTML/CSS-to-artwork compiler
src/components/City.tsx    Map interaction and accessible controls
src/components/Contribute.tsx  Building editor and JSON export
src/App.tsx                The town, directory, and onboarding
scripts/validate-places.ts Command-line contribution checks
scripts/local-places.ts    Development-only saves to the local places folder
tests/                    Contribution rules and world behavior
docs/                     Architecture and publishing guides
.github/                  Pull request checks, templates, and deployment
```

## Useful commands

| Command             | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Start the local city                                     |
| `npm run validate`  | Check every place with beginner-friendly errors          |
| `npm test`          | Test contribution rules and map behavior                 |
| `npm run typecheck` | Check the app’s TypeScript                               |
| `npm run build`     | Validate and build the production site                   |
| `npm run preview`   | Serve the production build locally                       |
| `npm run check`     | Run tests, validation, type checks, and production build |

## Put your town online

The app is ready to publish as a static site. Set `VITE_GITHUB_REPOSITORY=your-name/your-repository` to connect GitHub links. The included GitHub Pages workflow is opt-in and knows how to set the repository base path.

See [publishing](PUBLISHING.md). Creating this local project does not create a GitHub repository or publish anything.

## A foundation for more

The living edition keeps the first contribution small. Morning, afternoon, and evening each use one choice: stroll, work at home, or relax at home. At night, choose sleep or a night out. Up to eight night owls join the midnight party and walk home by 04:30. Others take one three-hour walk near home, with departures spread between 22:00 and 02:00, then sleep indoors until morning. Omitted night choices default to sleep. The clock follows UTC: one real minute is one town hour, with a new town day every 24 real minutes. Visitors at the same moment see the same daily phase when their device clocks agree. There are no accounts, leaderboards, real-time multiplayer, or automatic merges. Every place has a bounded plot and reviewed data. New districts, original sprites, more building types, and richer interactions can follow the community’s needs.

See [architecture and extension points](ARCHITECTURE.md) and [the roadmap](ROADMAP.md).

Be kind, stay curious, and help the next person find their way in. [Code of conduct](../CODE_OF_CONDUCT.md) · [MIT license](../LICENSE)

## Growing the town

Change the row and column counts in `src/lib/town-config.ts` to add plots without moving existing homes. Roads, validation, the builder, and camera framing follow automatically. See [Expanding the town](EXPANDING_THE_TOWN.md) for examples and compatibility rules.
