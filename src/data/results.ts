import type { RecentResult } from "../types";
import raw from "./results.json";

// Match results from 22 Aug 2026 up to the Major, from HLTV's results pages,
// newest first, keyed by team name. Rows are [date, opponent, maps won, maps
// lost, event]. Opponents outside the Major keep their HLTV name.
type Row = [string, string, number, number, string];

export const RECENT_RESULTS: Record<string, RecentResult[]> = Object.fromEntries(
  Object.entries(raw as unknown as Record<string, Row[]>).map(([team, rows]) => [
    team,
    rows.map(([date, opp, won, lost, event]) => ({
      date,
      opp,
      won: won > lost,
      score: `${won}–${lost}`,
      event,
    })),
  ])
);
