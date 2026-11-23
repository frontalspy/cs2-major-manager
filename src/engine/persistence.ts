import { RECENT_RESULTS } from "../data/results";
import { MAPS, TEAM_DATA } from "../data/teams";
import type {
  CurrentMatch,
  CustomPlayer,
  DetailedResult,
  MapResult,
  PlayerState,
  Playoffs,
  RunEntry,
  Stage,
  Team,
} from "../types";
import type { GameStore } from "./store";

// Saves the run to localStorage so a reload resumes the tournament. Object
// references inside the live state (champion, the current match's stage and
// playoff slot, map winners) are stored as ids and re-linked on restore.
// Anything that does not validate is discarded and a fresh game starts.

export const SAVE_KEY = "cs2-major-simulator:save";
const SAVE_VERSION = 5;
const SAVE_DELAY_MS = 300;

// Fingerprint of the bundled team data. A save embeds copies of every team
// (logo, ratings, results), so one made against older data is discarded rather
// than restored with stale fields.
function fingerprint(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (h * 33) ^ text.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export const DATA_FINGERPRINT = fingerprint(JSON.stringify([TEAM_DATA, RECENT_RESULTS]));

type PlayoffSlot = `matches:${number}` | `semis:${number}` | "final" | "third";

interface SavedMatch extends Omit<CurrentMatch, "stage" | "pMatch" | "maps"> {
  stageNum: number | null;
  slot: PlayoffSlot | null;
  maps: (Omit<MapResult, "winner" | "loser"> & { winnerId: number; loserId: number })[];
}

interface Snapshot {
  v: number;
  data: string;
  teams: Team[];
  myId: number | null;
  customPicks: (PlayerState | CustomPlayer)[];
  customPlayers: CustomPlayer[];
  stages: Stage[];
  stageIdx: number;
  playoffs: Playoffs | null;
  championId: number | null;
  thirdId: number | null;
  currentMatch: SavedMatch | null;
  logLines: string[];
  detailedResults: DetailedResult[];
  myRun: RunEntry[];
  customMapRates: Record<string, number>;
  customMapsTouched: boolean;
  customLogoIdx: number;
}

function slotOf(playoffs: Playoffs | null, m: CurrentMatch["pMatch"]): PlayoffSlot | null {
  if (!playoffs || !m) return null;
  const qf = playoffs.matches.indexOf(m);
  if (qf >= 0) return `matches:${qf}`;
  const sf = playoffs.semis?.indexOf(m) ?? -1;
  if (sf >= 0) return `semis:${sf}`;
  if (playoffs.final === m) return "final";
  if (playoffs.third === m) return "third";
  return null;
}

function matchAt(playoffs: Playoffs | null, slot: PlayoffSlot): CurrentMatch["pMatch"] {
  if (!playoffs) return null;
  if (slot === "final") return playoffs.final;
  if (slot === "third") return playoffs.third;
  const [group, index] = slot.split(":");
  const list = group === "matches" ? playoffs.matches : playoffs.semis;
  return list?.[Number(index)] ?? null;
}

export function serialize(g: GameStore): string {
  const cm = g.currentMatch;
  const snapshot: Snapshot = {
    v: SAVE_VERSION,
    data: DATA_FINGERPRINT,

    teams: g.teams,
    myId: g.myId,
    customPicks: g.customPicks,
    customPlayers: g.customPlayers,
    stages: g.stages,
    stageIdx: g.stageIdx,
    playoffs: g.playoffs,
    championId: g.champion?.id ?? null,
    thirdId: g.third?.id ?? null,
    currentMatch: cm && {
      ...cm,
      stageNum: cm.stage?.num ?? null,
      slot: slotOf(g.playoffs, cm.pMatch),
      maps: cm.maps.map(({ winner, loser, ...rest }) => ({
        ...rest,
        winnerId: winner.id,
        loserId: loser.id,
      })),
    },
    logLines: g.logLines,
    detailedResults: g.detailedResults,
    myRun: g.myRun,
    customMapRates: g.customMapRates,
    customMapsTouched: g.customMapsTouched,
    customLogoIdx: g.customLogoIdx,
  };
  return JSON.stringify(snapshot);
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isTeamList = (v: unknown): v is Team[] =>
  Array.isArray(v) &&
  v.length === 32 &&
  v.every(
    (t) =>
      isRecord(t) &&
      typeof t.id === "number" &&
      Array.isArray(t.players) &&
      t.players.length === 5 &&
      Array.isArray(t.recent) &&
      isRecord(t.maps) &&
      MAPS.every((m) => typeof (t.maps as Record<string, unknown>)[m] === "number")
  );

// Returns true when the save was valid and applied; leaves the store
// untouched otherwise.
export function restore(g: GameStore, raw: string): boolean {
  let s: Snapshot;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.v !== SAVE_VERSION ||
      parsed.data !== DATA_FINGERPRINT ||
      !isTeamList(parsed.teams)
    )
      return false;
    s = parsed as unknown as Snapshot;
    if (!Array.isArray(s.stages) || !Array.isArray(s.logLines) || !Array.isArray(s.myRun)) return false;
    if (!Array.isArray(s.detailedResults) || !Array.isArray(s.customPicks) || !Array.isArray(s.customPlayers))
      return false;
    if (!isRecord(s.customMapRates) || typeof s.stageIdx !== "number") return false;
  } catch {
    return false;
  }

  const team = (id: number | null): Team | null => s.teams.find((t) => t.id === id) ?? null;
  let currentMatch: CurrentMatch | null = null;
  if (s.currentMatch) {
    const { stageNum, slot, maps, ...rest } = s.currentMatch;
    const relinked: MapResult[] = [];
    for (const m of maps) {
      const { winnerId, loserId, ...mapRest } = m;
      const winner = team(winnerId);
      const loser = team(loserId);
      if (!winner || !loser) return false;
      relinked.push({ ...mapRest, winner, loser });
    }
    const stage = stageNum === null ? null : (s.stages.find((st) => st.num === stageNum) ?? null);
    const pMatch = slot ? matchAt(s.playoffs, slot) : null;
    if (!stage && !pMatch) return false;
    currentMatch = { ...rest, stage, pMatch, maps: relinked };
  }

  g.teams = s.teams;
  g.myId = s.myId;
  g.customPicks = s.customPicks;
  g.customPlayers = s.customPlayers;
  g.stages = s.stages;
  g.stageIdx = s.stageIdx;
  g.playoffs = s.playoffs;
  g.champion = team(s.championId);
  g.third = team(s.thirdId);
  g.currentMatch = currentMatch;
  g.logLines = s.logLines;
  g.detailedResults = s.detailedResults;
  g.myRun = s.myRun;
  g.customMapRates = s.customMapRates as Record<string, number>;
  g.customMapsTouched = !!s.customMapsTouched;
  g.customLogoIdx = s.customLogoIdx;
  return true;
}

// Restores any saved run, then saves (debounced) after every store update.
export function attachPersistence(g: GameStore, storage: Storage = window.localStorage): void {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (raw && restore(g, raw)) g.notify();
    else if (raw) storage.removeItem(SAVE_KEY);
  } catch {
    // storage unavailable (private mode, blocked): play without saving
    return;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  g.subscribe(() => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        storage.setItem(SAVE_KEY, serialize(g));
      } catch {
        // quota or blocked storage: skip this save
      }
    }, SAVE_DELAY_MS);
  });
}
