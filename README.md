# LODESTONE — a little hackathon story

*Made at SBUHacks 2026 (theme: Steel & Steam) by Nick.*

A cozy pixel-art RPG about a duck in a top hat who learns how real projects get made.

Steamhaven has gone dim. The Lodestone in the clock tower only glows when someone **finishes something and shares it**, and nobody has in a long time. Pip shows up for the Grand Steam Hackathon, asks the town's AI machine for an entire website at once, and blows it up. From there, Pip learns to build a project the real way, one step at a time, from six mentors who are each quietly stuck on the same things real developers get stuck on.

| Gear | Mentor | Teaches | Stuck on |
|---|---|---|---|
| idea | Cogsworth | Scoping: one real problem, one sentence | 41 unfinished inventions |
| plan | Quill | Must / should / could, planning backwards, notes | Planned 300 projects, started zero |
| build | Ember | Tools, templates, smallest working version, git, AI as a helper | Hasn't slept since Tuesday |
| debug | Sprocket | Read the error, reproduce it, one change at a time, ask for help | A failed demo five years ago |
| deploy | Gale | GitHub, hosting, testing on other devices, keeping keys in `.env` | An airship "almost ready" for 3 years |
| submit | Mayor Brassbell | Devpost, demo video, submitting early, the 2-minute pitch | Guarding the cold Lodestone |

Each mentor ends with a quick quiz. Your gears and lessons are saved in **Pip's journal** (press `J`).

There are also **13 optional workshop notes** from townsfolk, based on what was actually taught at the hackathon: GitHub Copilot, Google AI Studio, prompting, REST APIs, cybersecurity, full stack, Arduino, industry mixers, game feel, pivoting, setup errors, taking notes, and prompting the Brass Brain in small steps.

## Controls

| Key | Action |
|---|---|
| Arrows / WASD | Walk (tap to turn) |
| Shift | Run |
| Space / Enter / E | Talk, read, advance |
| J or Tab | Journal |
| Q | Quack |
| M | Mute |
| Esc | Skip intro cutscene / close journal |

## Run it

```bash
npm install
npm run dev      # opens on http://localhost:5173
npm run build    # production build in /dist (deploy to GitHub Pages / Vercel)
```

No backend and no API keys. Everything runs in the browser.

## Make it yours

- **Dialogue and story:** `src/data.js`. Lines can start with an emote tag: `{heart} {note} {sweat} {dots} {spark} {zzz} {bang} {q}`.
- **Sprites:** `src/sprites.js`. Every character is a 16-wide text grid, and each letter maps to a palette color.
- **Music:** drop `town.mp3` and `finale.mp3` into `public/music/`. They're picked up automatically (see the readme in that folder).
- **Demo shortcuts** (browser console): `LODESTONE.skipTo(5)` jumps to chapter 5. `LODESTONE.goTo('gale')` teleports next to a character.

## Built with

Vanilla JavaScript, HTML5 Canvas, Vite, and the Press Start 2P font (OFL). All art is drawn in code. The mood is inspired by OneShot, EarthBound and OMORI, but every character, sprite and line of dialogue is original.
