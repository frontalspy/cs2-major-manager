import type { PlayerState, RecentResult, Team } from "../types";
import { recentMeetings } from "./history";
import { tourneyAvg, trendOf } from "./sim";

export interface ScoutPlayer {
  name: string;
  role: string;
  rating: number;
  estimated: boolean;
  // only once the player has Major maps to compare
  trend: ReturnType<typeof trendOf> | null;
}

export interface ScoutReport {
  best: ScoutPlayer;
  weakest: ScoutPlayer;
  formLabel: string;
  recent: RecentResult[];
}

// Pre-event rating is HLTV Rating 3.0; once the player has Major maps, it is
// blended 50/50 with their tournament average so hot and cold streaks count.
function currentRating(pl: PlayerState): number {
  return pl.hist.length ? (pl.rating + tourneyAvg(pl)) / 2 : pl.rating;
}

function scoutPlayer(pl: PlayerState): ScoutPlayer {
  return {
    name: pl.name,
    role: pl.role,
    rating: +currentRating(pl).toFixed(2),
    estimated: !!pl.est,
    trend: pl.hist.length >= 2 ? trendOf(pl) : null,
  };
}

function formLabel(recent: RecentResult[]): string {
  if (!recent.length) return "No recent results";
  const rate = recent.filter((r) => r.won).length / recent.length;
  if (rate >= 0.8) return "On a roll";
  if (rate >= 0.6) return "Good form";
  if (rate >= 0.4) return "Mixed";
  return "Struggling";
}

export function scoutTeam(team: Team): ScoutReport {
  const ranked = [...team.players].sort((x, y) => currentRating(y) - currentRating(x));
  const recent = team.recent.slice(0, 5);
  return {
    best: scoutPlayer(ranked[0]),
    weakest: scoutPlayer(ranked[ranked.length - 1]),
    formLabel: formLabel(recent),
    recent,
  };
}

// Results between the two teams inside the head-to-head window, from `team`'s side.
export function headToHeadLines(team: Team, opp: Team): RecentResult[] {
  return recentMeetings(team, opp);
}
