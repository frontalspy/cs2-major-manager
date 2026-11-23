import { MAPS, TEAM_DATA } from "../data/teams";
import type { Team } from "../types";
import { initialForm, initialRecent } from "./history";
import { ensurePlayerState } from "./sim";

export function clampRate(v: number | string): number {
  const n = parseInt(String(v), 10);
  if (isNaN(n)) return 50;
  return Math.max(0, Math.min(100, n));
}

export function freshTeams(): Team[] {
  return TEAM_DATA.map((r, i) => {
    const avg = r.players.reduce((a, p) => a + p.rating, 0) / 5;
    const maps: Record<string, number> = {};
    const counts: Record<string, number> = {};
    MAPS.forEach((m) => {
      maps[m] = r.maps[m];
      counts[m] = r.mapCounts[m];
    });
    const recent = initialRecent(r.name);
    const t: Team = {
      id: i,
      name: r.name,
      tag: r.tag,
      region: r.region,
      vrs: r.vrs,
      coach: r.coach,
      players: r.players.map((p) => ({
        ...p,
        // same initial-mental formula as ensurePlayerState() in the original
        mental: 68 + Math.floor(Math.abs(Math.sin(i * 13 + p.name.length * 7)) * 22),
        hist: [],
        boost: 0,
        lastTalk: "",
        tourneyMaps: 0,
      })),
      style: r.style,
      avg: +avg.toFixed(3),
      maps,
      mapCounts: counts,
      defaultMaps: { ...maps },
      form: initialForm(r.vrs, recent),
      wins: 0,
      losses: 0,
      logo: r.logo,
      recent,
    };
    ensurePlayerState(t);
    return t;
  });
}
