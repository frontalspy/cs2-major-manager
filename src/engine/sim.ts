// Simulation engine — a faithful TypeScript port of the logic in the
// shareable static build (index.html script). Same formulas, same
// randomness, same edge cases; only the DOM access was removed.
// The store (store.ts) owns the mutable tournament state and calls these.
import { MAPS, STRATS, TEAM_DATA } from "../data/teams";
import type { MapResult, MapStats, PlayerLine, PlayerState, Team, VetoStep } from "../types";
import { headToHead } from "./history";

export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

export function ensurePlayerState(t: Team): void {
  t.players.forEach((pl) => {
    if (pl.mental === undefined || pl.mental === 0) {
      pl.mental = 68 + Math.floor(Math.abs(Math.sin(t.id * 13 + pl.name.length * 7)) * 22);
      pl.hist = [];
      pl.boost = 0;
      pl.lastTalk = "";
      pl.tourneyMaps = 0;
    }
  });
}

export function teamMentalAvg(t: Team): number {
  ensurePlayerState(t);
  return t.players.reduce((a, pl) => a + pl.mental, 0) / t.players.length;
}

export function teamBoostAvg(t: Team): number {
  ensurePlayerState(t);
  return t.players.reduce((a, pl) => a + (pl.boost || 0), 0) / t.players.length;
}

export function playedCount(t: Team, m: string): number | null {
  // custom teams set their own rates, so they have no maps-played count
  return t.isCustom || !t.mapCounts ? null : t.mapCounts[m];
}

export function playedMaps(t: Team): string[] {
  return MAPS.filter((m) => playedCount(t, m) !== 0);
}

export function bestPlayedMap(t: Team): string {
  const pm = playedMaps(t);
  if (!pm.length) return MAPS[0];
  return pm.reduce((x, y) => (t.maps[y] > t.maps[x] ? y : x));
}

export function rateTxt(t: Team, m: string): string {
  const c = playedCount(t, m);
  if (c === 0) return "—";
  return t.maps[m] + "%";
}

export function rateTxtN(t: Team, m: string): string {
  const c = playedCount(t, m);
  if (c === 0) return "— · 0 maps";
  if (c === null || c === undefined) return t.maps[m] + "%";
  return t.maps[m] + "% · " + c + " maps";
}

// HLTV ratings are inflated for teams who mostly face weaker opposition, so
// for Major teams the rating only counts partly and is pulled toward the field
// average; VRS and recent results carry the rest. Custom teams use their raw
// rating, since that is all they have.
const FIELD_RATING =
  TEAM_DATA.reduce((sum, t) => sum + t.players.reduce((a, p) => a + p.rating, 0) / 5, 0) / TEAM_DATA.length;
const RATING_WEIGHT = 0.25;
const MAP_SAMPLE_PRIOR = 8;

// Stats from a weaker schedule overstate a team, so a Major team's rating and
// map win rates are trusted in proportion to its VRS (full weight from 1700).
function credibility(t: Team): number {
  return t.isCustom ? 1 : Math.max(0.25, Math.min(1, (t.vrs - 1000) / 700));
}

function ratingStrength(t: Team): number {
  if (t.isCustom) return 100 * t.avg;
  return 100 * (FIELD_RATING + (t.avg - FIELD_RATING) * RATING_WEIGHT * credibility(t));
}

// Map win rate, shrunk toward 50% when the team has played the map few times.
function mapEdge(t: Team, map: string): number {
  const played = t.isCustom ? Infinity : (t.mapCounts[map] ?? 0);
  return (t.maps[map] - 50) * 0.2 * credibility(t) * (played / (played + MAP_SAMPLE_PRIOR));
}

export function strength(
  t: Team,
  map: string | null,
  strat: { id: string; vs: string } | null | undefined,
  opp?: Team
): number {
  let s = ratingStrength(t) + (t.vrs - 1000) / 38 + (map ? mapEdge(t, map) : 0) + t.form * 0.9;
  s += (teamMentalAvg(t) - 72) * 0.12;
  s += teamBoostAvg(t) * 38;

  // Form / momentum weighting — especially for custom teams: win-rate and
  // wins vs tougher (higher VRS) teams compound.
  const played = t.wins + t.losses;
  if (played > 0) {
    const wr = t.wins / played;
    s += (wr - 0.5) * (t.isCustom ? 7 : 8);
    if (t.isCustom) {
      s += (wr - 0.5) * 9;
      s += (t.beatHigher || 0) * 2.4;
      if (opp && opp.vrs > t.vrs && (t.beatHigher || 0) > 0) s += Math.min(6, (t.beatHigher || 0) * 1.8);
      if (opp && opp.vrs > t.vrs + 250 && wr >= 0.5) s += 2.5;
    }
  }
  if (opp) s += headToHead(t, opp);
  if (strat && opp && strat.vs === opp.style) s += 6;
  if (strat && strat.id === "force") s += Math.random() * 10 - 5;
  return s;
}

export function winProb(
  a: Team,
  b: Team,
  mapA: string | null,
  strat: { id: string; vs: string } | null | undefined
): number {
  const pa = 1 / (1 + Math.pow(10, -(strength(a, mapA, strat, b) - strength(b, mapA, null, a)) / 36));
  return Math.max(0.18, Math.min(0.82, pa));
}

function rollPerformance(pl: PlayerState): number {
  const base = pl.rating + (pl.boost || 0) + ((pl.mental - 72) / 100) * 0.45;
  return Math.max(0.5, Math.min(1.9, base + (Math.random() - 0.5) * 0.42));
}

// Splits an exact integer total across weights (largest-remainder rounding).
function distribute(total: number, weights: number[]): number[] {
  const sum = weights.reduce((acc, w) => acc + w, 0);
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((acc, n) => acc + n, 0);
  raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((x, y) => y.frac - x.frac)
    .forEach(({ i }) => {
      if (left-- > 0) out[i]++;
    });
  return out;
}

// A team kills roughly 3.8 enemies in rounds it wins and 1.9 in rounds it loses.
function teamKills(roundsWon: number, roundsLost: number): number {
  return Math.max(5, Math.round(roundsWon * 3.8 + roundsLost * 1.9 + (Math.random() - 0.5) * 6));
}

// Player lines for one team. Team kill/death totals come from the scoreline; each
// player's share follows a rolled performance, and the final rating blends that
// performance with the K/D the player actually ended up with.
export function genTeamLines(
  team: Team,
  teamKillTotal: number,
  teamDeathTotal: number,
  rounds: number
): PlayerLine[] {
  ensurePlayerState(team);
  const perf = team.players.map(rollPerformance);
  const kills = distribute(
    teamKillTotal,
    perf.map((r) => r ** 1.5)
  );
  const deaths = distribute(
    teamDeathTotal,
    perf.map((r) => r ** -0.7)
  );
  return team.players.map((pl, i) => {
    const kpr = kills[i] / rounds;
    const dpr = deaths[i] / rounds;
    const fromKd = 1 + 1.2 * (kpr - 0.7) - (dpr - 0.7);
    const r = Math.max(0.42, Math.min(1.95, 0.4 * perf[i] + 0.6 * fromKd));
    return {
      name: pl.name,
      role: pl.role,
      rating: +r.toFixed(2),
      k: kills[i],
      d: deaths[i],
      diff: kills[i] - deaths[i],
      adr: Math.max(20, Math.round(25 + kpr * 80 + Math.random() * 10 - 5)),
      kast: Math.max(38, Math.min(96, Math.round(58 + (r - 0.8) * 38))),
      base: pl.rating,
      mental: pl.mental,
    };
  });
}

export function applyMapToHistory(team: Team, lines: PlayerLine[], won: boolean): void {
  ensurePlayerState(team);
  lines.forEach((ln) => {
    const pl = team.players.find((x) => x.name === ln.name);
    if (!pl) return;
    pl.hist.push(ln.rating);
    if (pl.hist.length > 14) pl.hist.shift();
    pl.tourneyMaps = (pl.tourneyMaps || 0) + 1;
    let delta = won ? 3 : -3;
    if (ln.rating >= 1.25) delta += 5;
    else if (ln.rating >= 1.1) delta += 2;
    else if (ln.rating < 0.8) delta -= 5;
    else if (ln.rating < 0.92) delta -= 2;
    pl.mental = Math.max(18, Math.min(99, pl.mental + delta + Math.floor(Math.random() * 3 - 1)));
  });
}

export function simMap(
  a: Team,
  b: Team,
  map: string,
  strat: { id: string; vs: string } | null | undefined
): MapResult {
  const p = winProb(a, b, map, strat);
  const aWin = Math.random() < p;
  const ot = Math.random() < 0.12;
  const winnerRounds = ot ? 16 : 13;
  const loserRounds = ot ? 12 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 10) + 1;
  const score = aWin ? `${winnerRounds}:${loserRounds}` : `${loserRounds}:${winnerRounds}`;
  const roundsA = aWin ? winnerRounds : loserRounds;
  const roundsB = aWin ? loserRounds : winnerRounds;
  const killsA = teamKills(roundsA, roundsB);
  const killsB = teamKills(roundsB, roundsA);
  const winner = aWin ? a : b;
  const loser = aWin ? b : a;
  const statsA = genTeamLines(a, killsA, killsB, roundsA + roundsB);
  const statsB = genTeamLines(b, killsB, killsA, roundsA + roundsB);
  statsA.sort((x, y) => y.rating - x.rating);
  statsB.sort((x, y) => y.rating - x.rating);
  const all = [
    ...statsA.map((s) => ({ ...s, team: a.name, teamId: a.id })),
    ...statsB.map((s) => ({ ...s, team: b.name, teamId: b.id })),
  ];
  const mvp = all.slice().sort((x, y) => y.rating - x.rating)[0];
  applyMapToHistory(a, statsA, aWin);
  applyMapToHistory(b, statsB, !aWin);
  return { winner, loser, score, map, p: Math.round(p * 100), statsA, statsB, mvp };
}

export function seriesTarget(format: string): number {
  return format === "Bo1" ? 1 : format === "Bo5" ? 3 : 2;
}

export function seriesMaxMaps(format: string): number {
  return format === "Bo1" ? 1 : format === "Bo5" ? 5 : 3;
}

export function worstMap(t: Team): string {
  return MAPS.reduce((x, y) => (t.maps[y] < t.maps[x] ? y : x));
}

export function bestMapOf(t: Team): string {
  return bestPlayedMap(t);
}

// Auto-veto for AI-vs-AI matches — runs the EXACT interactive veto sequence
// with the same AI logic the Match Centre uses: on a ban a team removes the
// OPPONENT's best remaining map, on a pick it takes its OWN best remaining map.
export function autoVetoMaps(a: Team, b: Team, format: string): { maps: string[]; vetoNote: string } {
  let pool = [...MAPS];
  const moves: { map: string; by: Team; type: "ban" | "pick" }[] = [];
  function aiBan(team: Team, opp: Team): string {
    const choice = [...pool].sort((x, y) => opp.maps[y] - opp.maps[x])[0];
    pool = pool.filter((m) => m !== choice);
    moves.push({ map: choice, by: team, type: "ban" });
    return choice;
  }
  function aiPick(team: Team): string {
    const choice = [...pool].sort(
      (x, y) =>
        (playedCount(team, y) === 0 ? -999 : team.maps[y]) -
        (playedCount(team, x) === 0 ? -999 : team.maps[x])
    )[0];
    pool = pool.filter((m) => m !== choice);
    moves.push({ map: choice, by: team, type: "pick" });
    return choice;
  }
  const steps =
    format === "Bo1"
      ? ["ban", "ban", "ban", "ban", "ban", "ban"]
      : format === "Bo5"
        ? ["ban", "ban"]
        : ["ban", "ban", "pick", "pick", "ban", "ban"];
  const actors = [a, b, a, b, a, b];
  const picks: string[] = [];
  steps.forEach((type, i) => {
    const team = actors[i];
    const opp = team === a ? b : a;
    if (type === "ban") aiBan(team, opp);
    else picks.push(aiPick(team));
  });
  const moveTxt = moves
    .map((m, i) => `${i + 1}. ${m.by.name} ${m.type === "ban" ? "banned" : "picked"} ${m.map}`)
    .join(" · ");
  if (format === "Bo1") {
    const played = pool[0];
    return {
      maps: [played],
      vetoNote: `Bo1 veto: ${moveTxt} → ${played} is played`,
    };
  }
  if (format === "Bo5") {
    const rest = [...pool].sort((x, y) => a.maps[y] + b.maps[y] - (a.maps[x] + b.maps[x]));
    return {
      maps: rest,
      vetoNote: `Bo5 veto: ${moveTxt} → ${rest.join(", ")}`,
    };
  }
  const decider = pool[0];
  return {
    maps: [picks[0], picks[1], decider],
    vetoNote: `Bo3 veto: ${moveTxt} → ${picks[0]} (${moves[2].by.name}), ${picks[1]} (${moves[3].by.name}), decider ${decider}`,
  };
}

// Keeps only what a scoreboard needs, so saved results don't carry whole Team objects.
export function toMapStats(maps: MapResult[]): MapStats[] {
  return maps.map(({ map, score, statsA, statsB, mvp }) => ({ map, score, statsA, statsB, mvp }));
}

export function aggregateSeries(
  maps: MapResult[],
  a: Team,
  b: Team
): { aggA: PlayerLine[]; aggB: PlayerLine[]; mvp: PlayerLine } {
  function agg(team: Team, isA: boolean): PlayerLine[] {
    const by: Record<string, PlayerLine & { ratingSum: number; adrSum: number; kastSum: number; n: number }> =
      {};
    maps.forEach((m) => {
      (isA ? m.statsA : m.statsB).forEach((s) => {
        if (!by[s.name])
          by[s.name] = {
            name: s.name,
            role: s.role,
            rating: 0,
            ratingSum: 0,
            k: 0,
            d: 0,
            diff: 0,
            adr: 0,
            adrSum: 0,
            kast: 0,
            kastSum: 0,
            n: 0,
            team: team.name,
            teamId: team.id,
            base: s.base,
            mental: s.mental,
          };
        const o = by[s.name];
        o.ratingSum += s.rating;
        o.k += s.k;
        o.d += s.d;
        o.adrSum += s.adr;
        o.kastSum += s.kast;
        o.n++;
      });
    });
    return Object.values(by)
      .map((o) => ({
        name: o.name,
        role: o.role,
        rating: +(o.ratingSum / o.n).toFixed(2),
        k: o.k,
        d: o.d,
        diff: o.k - o.d,
        adr: Math.round(o.adrSum / o.n),
        kast: Math.round(o.kastSum / o.n),
        team: o.team,
        teamId: o.teamId,
        base: o.base,
        mental: o.mental,
      }))
      .sort((x, y) => y.rating - x.rating);
  }
  const aggA = agg(a, true);
  const aggB = agg(b, false);
  const all = [...aggA, ...aggB];
  const mvp = all.slice().sort((x, y) => y.rating - x.rating)[0];
  return { aggA, aggB, mvp };
}

// Interactive veto sequences: Bo1 = six alternating bans leaving one map;
// Bo3 = ban, ban, pick, pick, ban, ban leaving a decider; Bo5 = one ban each.
export function vetoSteps(format: string): VetoStep[] {
  if (format === "Bo1")
    return [
      { actor: "you", type: "ban" },
      { actor: "opp", type: "ban" },
      { actor: "you", type: "ban" },
      { actor: "opp", type: "ban" },
      { actor: "you", type: "ban" },
      { actor: "opp", type: "ban" },
    ];
  if (format === "Bo5")
    return [
      { actor: "you", type: "ban" },
      { actor: "opp", type: "ban" },
    ];
  return [
    { actor: "you", type: "ban" },
    { actor: "opp", type: "ban" },
    { actor: "you", type: "pick" },
    { actor: "opp", type: "pick" },
    { actor: "you", type: "ban" },
    { actor: "opp", type: "ban" },
  ];
}

export function tourneyAvg(pl: PlayerState): number {
  if (!pl.hist || !pl.hist.length) return pl.rating;
  return +(pl.hist.reduce((a, b) => a + b, 0) / pl.hist.length).toFixed(2);
}

export function trendOf(pl: PlayerState): { cls: string; arrow: string; label: string } {
  if (!pl.hist || pl.hist.length < 2) return { cls: "flat", arrow: "→", label: "No trend yet" };
  const recent = pl.hist.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, pl.hist.length);
  const diff = recent - pl.rating;
  if (diff >= 0.05) return { cls: "up", arrow: "▲", label: "+" + diff.toFixed(2) + " vs base" };
  if (diff <= -0.05) return { cls: "down", arrow: "▼", label: diff.toFixed(2) + " vs base" };
  return { cls: "flat", arrow: "→", label: "Holding form" };
}

export function mentalLabel(m: number): string {
  return m >= 85
    ? "Locked in"
    : m >= 70
      ? "Confident"
      : m >= 55
        ? "Steady"
        : m >= 42
          ? "Shaky"
          : "Tilted / low";
}

export function mentalColor(m: number): string {
  return m >= 70 ? "var(--grn)" : m >= 50 ? "var(--gold)" : "var(--red)";
}

export function stratById(id: string | null | undefined) {
  return (
    (STRATS as readonly { id: string; n: string; d: string; vs: string; b: number }[]).find(
      (s) => s.id === id
    ) || STRATS[0]
  );
}
