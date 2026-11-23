export interface PlayerData {
  name: string;
  rating: number;
  role: string;
  est?: boolean;
}

export interface TeamData {
  name: string;
  tag: string;
  region: string;
  vrs: number;
  coach: string;
  players: PlayerData[];
  style: string;
  maps: Record<string, number>;
  mapCounts: Record<string, number>;
  logo: string | null;
}

export interface RecentResult {
  date: string; // ISO yyyy-mm-dd
  opp: string;
  won: boolean;
  score: string;
  event: string;
}

export interface PlayerState extends PlayerData {
  isCustomPlayer?: boolean;
  mental: number;
  hist: number[];
  boost: number;
  lastTalk: string;
  tourneyMaps: number;
}

export interface Team {
  id: number;
  name: string;
  tag: string;
  region: string;
  vrs: number;
  coach: string;
  players: PlayerState[];
  style: string;
  avg: number;
  maps: Record<string, number>;
  mapCounts: Record<string, number>;
  defaultMaps: Record<string, number>;
  form: number;
  wins: number;
  losses: number;
  logo: string | null;
  recent: RecentResult[];
  isCustom?: boolean;
  beatHigher?: number;
}

export interface PlayerLine {
  name: string;
  role: string;
  rating: number;
  k: number;
  d: number;
  diff: number;
  adr: number;
  kast: number;
  base: number;
  mental: number;
  team?: string;
  teamId?: number;
}

export interface MapResult {
  winner: Team;
  loser: Team;
  score: string;
  map: string;
  p: number;
  statsA: PlayerLine[];
  statsB: PlayerLine[];
  mvp: PlayerLine;
}

export interface SeriesResult {
  winner: Team;
  loser: Team;
  aw: number;
  bw: number;
  maps: MapResult[];
  vetoNote: string;
  aggA: PlayerLine[];
  aggB: PlayerLine[];
  mvp: PlayerLine;
}

export interface DetailedResult {
  id: number;
  label: string;
  a: string;
  b: string;
  winner: string;
  score: string;
  format: string;
  mvp: PlayerLine | null;
  aggA: PlayerLine[];
  aggB: PlayerLine[];
  maps: string[];
  when: number;
}

export interface StageRec {
  w: number;
  l: number;
  opp: number[];
}

export interface StageHistory {
  resultId: number;
  a: string;
  b: string;
  w: string;
  format: string;
  score: string;
}

export interface Stage {
  num: number;
  ids: number[];
  rec: Record<number, StageRec>;
  round: number;
  done: boolean;
  qual: number[];
  elim: number[];
  history: StageHistory[];
}

export interface PlayoffMatch {
  resultId?: number;
  a: number;
  b: number;
  done: boolean;
  format: string;
  label: string;
  winner?: number;
  loser?: number;
  score?: string;
  mapsInfo?: string;
  vetoNote?: string;
  mvp?: PlayerLine | null;
}

export interface Playoffs {
  round: string;
  matches: PlayoffMatch[];
  semis: PlayoffMatch[] | null;
  final: PlayoffMatch | null;
  third: PlayoffMatch | null;
}

export interface VetoMove {
  map: string;
  by: "you" | "opp";
  type: "ban" | "pick";
  seq: number;
}

export interface VetoStep {
  actor: "you" | "opp";
  type: "ban" | "pick";
}

export interface CurrentMatch {
  stage: Stage | null;
  pMatch: PlayoffMatch | null;
  aId: number;
  bId: number;
  format: string;
  label: string;
  step: number;
  steps: VetoStep[];
  pool: string[];
  banned: VetoMove[];
  picked: VetoMove[];
  mapList: string[] | null;
  maps: MapResult[];
  strat: string | null;
  eco: string;
  talk: string;
  done: boolean;
  finalScore?: string;
  resultText?: string;
  aggA?: PlayerLine[];
  aggB?: PlayerLine[];
  mvp?: PlayerLine | null;
}

export interface RunMapDetail {
  map: string;
  score: string;
  winnerName: string;
  mvp: { name: string; rating: number; team: string } | null;
}

export interface RunEntry {
  label: string;
  format: string;
  aId: number;
  bId: number;
  aName: string;
  bName: string;
  oppId: number;
  oppName: string;
  won: boolean;
  score: string;
  vetoNote: string;
  maps: string[];
  mapDetails: RunMapDetail[];
  aggMine: PlayerLine[];
  aggOpp: PlayerLine[];
  aggA: PlayerLine[];
  aggB: PlayerLine[];
  mvp: { name: string; rating: number; team: string; k: number; d: number; adr: number } | null;
  when: number;
}

export interface CustomPlayer {
  name: string;
  rating: number;
  role: string;
  team?: string;
  tag?: string;
  isCustomPlayer: boolean;
  mental: number;
  hist: number[];
  boost: number;
  lastTalk: string;
  tourneyMaps: number;
}

export type PoolPlayer = (PlayerState | CustomPlayer) & { team: string; tag?: string };

export interface Emblem {
  src: string;
  name: string;
}

export type ViewId = "dash" | "teams" | "builder" | "bracket" | "match" | "squad" | "recap";
