# CS2 Major Simulator

A coach simulator for the **PGL Major Singapore 2026**, a React 19 + Vite + TypeScript single-page app that builds to a fully static site (no backend).

You pick one of the 32 invited teams — or build a custom team from any five of
the 160 players — then call the veto, set strats, manage economy and team
mental through three Swiss stages into an eight-team playoff.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
npm test           # Vitest (engine rules, persistence, app smoke test)
npm run check      # Biome lint + format check (CI command)
npm run format     # Biome auto-format
```

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` checks, tests, builds and deploys `dist/` on every push to `main`.
One-time setup: push the repo to GitHub, then **Settings → Pages → Source: GitHub Actions**.
The build uses a relative `base` and hash routes (`#/match`), so it works from any repository sub-path
with no 404 fallback.

## Layout

```
src/
  engine/       framework-agnostic game logic: sim.ts (match maths), swiss.ts (pairing/format rules),
                teams.ts, customTeam.ts, matchCentre.ts, recap.ts, store.ts (state + tournament
                actions), route.ts (hash routing), persistence.ts (localStorage save/restore)
  data/         teams.ts (32 teams, 160 players, HLTV data), maps.ts (emblems, roles, prep talks)
  features/     dashboard, teams, builder, bracket, match, squad, recap (one slice each)
  components/   UI shared by several features (logo badge, HLTV tables, map pool)
  pages/        route-level shells; hooks/ app-wide hooks; test/ shared test setup
public/assets/  bundled team logos and custom-team emblems
```

Player ratings are HLTV Rating 3.0 (22 Aug – 22 Nov 2026); a rating marked `*` had no HLTV line in that
window (squad-based estimate). Map pool: Cache, Dust2, Mirage, Inferno, Nuke, Ancient, Anubis.

## Behaviour preserved from the static build

- 32 teams, three 16-team Swiss stages into an 8-team single-elimination
  playoff; Stage 1 & 2 are Bo1 except advancement/elimination matches (Bo3),
  all Stage 3 matches are Bo3, Grand Final Bo5, plus a Bo3 3rd-place decider.
- Attributed veto: Bo1 six alternating bans, Bo3 ban/ban/pick/pick/ban/ban
  with a decider, Bo5 one ban each. AI-vs-AI vetoes run the same sequence.
- Custom teams: pick any 5 of 160 players, create custom players (name,
  rating 0.70–1.60, role), pick one of 3 emblems, set per-map win rates
  0–100% — locked once the team is created. Custom teams enter as seed 32 in
  Stage 1; match weighting includes form, win rate and upset wins vs
  higher-VRS teams.
- Squad & Mental: per-player tournament rating trends, mental bars, and four
  coach prep talks (once per player per round) that can lift a player or
  backfire.
- HLTV-style per-match player ratings (K–D, +/-, ADR, KAST, Rating 2.0) and
  MVP, plus a tournament recap page for the managed team's whole run.
- Anonymous placeholders only (no personal names/locations); mobile menu
  hidden behind a hamburger; CS2 Panorama styling.
- Navigation is URL-based (`#/teams`, `#/match`, …): back/forward and deep links work, and
  the reset button asks before clearing a run in progress.

## Notes / known quirks (kept from the original)

- This is a static, client-only app with **no backend**. The run autosaves to this browser's
  `localStorage` (key `cs2-major-simulator:save`) and resumes after a reload, including mid-veto.
  Nothing is shared between visitors or devices; an unreadable or outdated save is discarded.
- `Reset tournament` keeps a created custom team in place (it does not
  restore Lynn Vision at seed 32), exactly as the static build did.
- The Major had not been played yet at the time of the data snapshot
  (22 Nov 2026), so every result is simulated from the real pre-event
  HLTV data. A map a team played 0 times in the window is shown as
  "— · 0 maps (permaban)" — HLTV has no win rate for it.
