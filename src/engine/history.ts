import { RECENT_RESULTS } from "../data/results";
import { TEAM_DATA } from "../data/teams";
import type { RecentResult, Team } from "../types";

// Head-to-head: a recent meeting nudges the next match towards whoever won
// it, fading linearly over the window. Custom teams have no history, so they
// are exempt on both sides.

// Reference date for "how recent": the day the Major's first stage starts.
export const EVENT_START = "2026-11-24";
export const H2H_WINDOW_DAYS = 90;
const PER_MEETING = 2; // strength points per fresh meeting
const SIDE_CAP = 4; // each side, so a swing of at most 8 between the teams
const DAY_MS = 86_400_000;

export function initialRecent(teamName: string): RecentResult[] {
  return [...(RECENT_RESULTS[teamName] ?? [])];
}

// Starting form: how far the last six results against Major teams beat what
// VRS predicted, capped at ±3. Wins over weak or unknown opposition (most of
// a lower-ranked team's schedule) therefore count for little.
const VRS_BY_TEAM = new Map(TEAM_DATA.map((t) => [t.name, t.vrs]));
const VRS_SCALE = 600;

export function initialForm(ownVrs: number, recent: RecentResult[]): number {
  let surprise = 0;
  for (const r of recent.slice(0, 6)) {
    const oppVrs = VRS_BY_TEAM.get(r.opp);
    if (oppVrs === undefined) continue;
    const expected = 1 / (1 + 10 ** (-(ownVrs - oppVrs) / VRS_SCALE));
    surprise += (r.won ? 1 : 0) - expected;
  }
  return Math.max(-3, Math.min(3, Math.round(surprise * 2)));
}

export function daysBeforeEvent(date: string): number {
  return Math.max(0, Math.round((Date.parse(EVENT_START) - Date.parse(date)) / DAY_MS));
}

export function recentMeetings(team: Team, opp: Team): RecentResult[] {
  return team.recent.filter((r) => r.opp === opp.name && daysBeforeEvent(r.date) <= H2H_WINDOW_DAYS);
}

// Strength adjustment for `team` against `opp`; the mirror value applies to `opp`.
export function headToHead(team: Team, opp: Team): number {
  if (team.isCustom || opp.isCustom) return 0;
  const net = recentMeetings(team, opp).reduce(
    (sum, r) => sum + (r.won ? 1 : -1) * (1 - daysBeforeEvent(r.date) / (H2H_WINDOW_DAYS + 1)),
    0
  );
  return Math.max(-SIDE_CAP, Math.min(SIDE_CAP, net * PER_MEETING));
}

// Series played inside the Major join both teams' history, dated at the event start.
export function addEventResult(a: Team, b: Team, aMaps: number, bMaps: number, event: string): void {
  const entry = (opp: Team, won: number, lost: number): RecentResult => ({
    date: EVENT_START,
    opp: opp.name,
    won: won > lost,
    score: `${won}–${lost}`,
    event,
  });
  a.recent.unshift(entry(b, aMaps, bMaps));
  b.recent.unshift(entry(a, bMaps, aMaps));
}
