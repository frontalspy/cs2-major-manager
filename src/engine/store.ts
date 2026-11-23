// Game store: mutable tournament state plus every action, notifying React
// subscribers (useSyncExternalStore) after each one. Pure rules live in
// swiss.ts, teams.ts and recap.ts; save/restore lives in persistence.ts.
// Quirk kept from the original: resetAll() keeps a created custom team in
// place instead of restoring Lynn Vision.

import { CUSTOM_EMBLEMS, TALK_DEFS, type TalkKind } from "../data/maps";
import { MAPS } from "../data/teams";
import type {
  CurrentMatch,
  CustomPlayer,
  DetailedResult,
  PlayerState,
  PlayoffMatch,
  Playoffs,
  RunEntry,
  Stage,
  Team,
  ViewId,
} from "../types";
import { addEventResult, initialForm, initialRecent } from "./history";
import { currentView, navigate } from "./route";
import {
  aggregateSeries,
  autoVetoMaps,
  bestPlayedMap,
  ensurePlayerState,
  mentalColor,
  mentalLabel,
  playedCount,
  playedMaps,
  rateTxt,
  rateTxtN,
  seriesMaxMaps,
  seriesTarget,
  simMap,
  teamBoostAvg,
  teamMentalAvg,
  tourneyAvg,
  trendOf,
  vetoSteps,
} from "./sim";
import { makeStage, matchFormat, pairings } from "./swiss";
import { clampRate, freshTeams } from "./teams";

export {
  bestPlayedMap,
  clampRate,
  freshTeams,
  mentalColor,
  mentalLabel,
  playedCount,
  playedMaps,
  rateTxt,
  rateTxtN,
  teamBoostAvg,
  teamMentalAvg,
  tourneyAvg,
  trendOf,
};

export class GameStore {
  version = 0;
  private listeners = new Set<() => void>();

  teams: Team[] = freshTeams();
  myId: number | null = null;
  customPicks: (PlayerState | CustomPlayer)[] = [];
  customPlayers: CustomPlayer[] = [];
  stages: Stage[] = [];
  stageIdx = 0;
  playoffs: Playoffs | null = null;
  champion: Team | null = null;
  third: Team | null = null;
  currentMatch: CurrentMatch | null = null;
  logLines: string[] = [];
  detailedResults: DetailedResult[] = [];
  myRun: RunEntry[] = [];
  menuOpen = false;

  customMapRates: Record<string, number> = {};
  customMapsTouched = false;
  customLogoIdx = Math.floor(Math.random() * CUSTOM_EMBLEMS.length);

  constructor() {
    MAPS.forEach((m) => (this.customMapRates[m] = 50));
    this.initTourney();
    if (typeof window !== "undefined") window.addEventListener("hashchange", this.onHashChange);
  }

  get view(): ViewId {
    return currentView();
  }

  private onHashChange = (): void => {
    this.menuOpen = false;
    window.scrollTo({ top: 0 });
    this.notify();
  };

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getVersion = (): number => this.version;
  notify(): void {
    this.version++;
    this.listeners.forEach((fn) => fn());
  }

  teamById(id: number | null | undefined): Team | undefined {
    return this.teams.find((t) => t.id === id);
  }

  show(v: ViewId): void {
    if (currentView() === v) this.notify();
    else navigate(v);
  }

  toggleMenu(force?: boolean): void {
    this.menuOpen = typeof force === "boolean" ? force : !this.menuOpen;
    this.notify();
  }

  alertBox(m: string): void {
    this.logLines.push(m);
    this.notify();
  }

  get started(): boolean {
    return (
      this.logLines.length > 0 ||
      this.teams.some((t) => t.wins + t.losses > 0) ||
      (this.stages[0] && this.stages[0].round > 0) ||
      !!this.playoffs
    );
  }

  currentRoundKey(): string {
    if (this.playoffs) return "PO-" + (this.playoffs.round || "");
    const st = this.stages[this.stageIdx];
    return st ? "S" + st.num + "R" + st.round : "pre";
  }

  initTourney(): void {
    this.stages = [];
    this.stageIdx = 0;
    this.playoffs = null;
    this.champion = null;
    this.third = null;
    this.myRun = [];
    const s1 = this.teams.slice(16).map((t) => t.id);
    this.stages.push(makeStage(1, s1));
  }

  ensureStage(n: number, adv: number[]): void {
    if (this.stages.find((s) => s.num === n)) return;
    const base = n === 2 ? this.teams.slice(8, 16).map((t) => t.id) : this.teams.slice(0, 8).map((t) => t.id);
    const seeded = [...base, ...adv].sort(
      (x, y) => (this.teamById(y)?.vrs ?? 0) - (this.teamById(x)?.vrs ?? 0)
    );
    this.stages.push(makeStage(n, seeded));
  }

  // Every simulated series is kept (newest first) so any match can be opened later.
  addDetailedResult(entry: Omit<DetailedResult, "id">): number {
    const id = this.detailedResults.length;
    this.detailedResults.unshift({ ...entry, id });
    return id;
  }

  recordResult(
    st: Stage,
    a: Team,
    b: Team,
    winner: Team,
    format: string,
    score: string,
    resultId: number
  ): void {
    const loser = winner.id === a.id ? b : a;
    st.rec[a.id].opp.push(b.id);
    st.rec[b.id].opp.push(a.id);
    st.rec[winner.id].w++;
    st.rec[loser.id].l++;
    winner.wins++;
    loser.losses++;
    winner.form = Math.min(3, winner.form + 1);
    loser.form = Math.max(-3, loser.form - 1);
    if (loser.vrs > winner.vrs) winner.beatHigher = (winner.beatHigher || 0) + 1;
    if (st.rec[winner.id].w >= 3 && !st.qual.includes(winner.id)) st.qual.push(winner.id);
    if (st.rec[loser.id].l >= 3 && !st.elim.includes(loser.id)) st.elim.push(loser.id);
    st.history.push({
      a: a.name,
      b: b.name,
      w: winner.name,
      format: format || "",
      score: score || "",
      resultId,
    });
  }

  captureMyRun(
    a: Team,
    b: Team,
    winner: Team,
    scoreStr: string,
    format: string,
    label: string,
    vetoNote: string,
    mapsArr: import("../types").MapResult[],
    aggA: import("../types").PlayerLine[],
    aggB: import("../types").PlayerLine[],
    mvp: import("../types").PlayerLine | null
  ): void {
    if (this.myId === null || (a.id !== this.myId && b.id !== this.myId)) return;
    const mineIsA = a.id === this.myId;
    const opp = mineIsA ? b : a;
    this.myRun.push({
      label: label || format,
      format,
      aId: a.id,
      bId: b.id,
      aName: a.name,
      bName: b.name,
      oppId: opp.id,
      oppName: opp.name,
      won: winner.id === this.myId,
      score: scoreStr,
      vetoNote: vetoNote || "",
      maps: (mapsArr || []).map((m) => m.map + " " + m.score),
      mapDetails: (mapsArr || []).map((m) => ({
        map: m.map,
        score: m.score,
        winnerName: m.winner ? m.winner.name : "",
        mvp: m.mvp ? { name: m.mvp.name, rating: m.mvp.rating, team: m.mvp.team ?? "" } : null,
      })),
      aggMine: mineIsA ? (aggA as import("../types").PlayerLine[]) : aggB,
      aggOpp: mineIsA ? aggB : (aggA as import("../types").PlayerLine[]),
      aggA: aggA as import("../types").PlayerLine[],
      aggB,
      mvp: mvp
        ? { name: mvp.name, rating: mvp.rating, team: mvp.team ?? "", k: mvp.k, d: mvp.d, adr: mvp.adr }
        : null,
      when: Date.now(),
    });
  }

  simSeries(a: Team, b: Team, format: string, stratMap: { id: string; vs: string } | null, runLabel: string) {
    const need = seriesTarget(format);
    const maxMaps = seriesMaxMaps(format);
    let aw = 0;
    let bw = 0;
    const maps: import("../types").MapResult[] = [];
    const av = autoVetoMaps(a, b, format);
    for (let i = 0; i < maxMaps && aw < need && bw < need; i++) {
      const r = simMap(a, b, av.maps[i % av.maps.length], stratMap);
      maps.push(r);
      if (r.winner.id === a.id) aw++;
      else bw++;
    }
    const winner = aw > bw ? a : b;
    const loser = aw > bw ? b : a;
    const agg = aggregateSeries(maps, a, b);
    const res = {
      winner,
      loser,
      aw,
      bw,
      maps,
      vetoNote: av.vetoNote,
      aggA: agg.aggA,
      aggB: agg.aggB,
      mvp: agg.mvp,
    };
    addEventResult(a, b, aw, bw, runLabel || format);
    // decay boosts after series
    [a, b].forEach((t) => {
      ensurePlayerState(t);
      t.players.forEach((pl) => (pl.boost = 0));
    });
    const id = this.addDetailedResult({
      label: runLabel || format,
      a: a.name,
      b: b.name,
      winner: winner.name,
      score: aw + "–" + bw,
      format,
      mvp: agg.mvp,
      aggA: agg.aggA,
      aggB: agg.aggB,
      maps: maps.map((m) => m.map + " " + m.score),
      when: Date.now(),
    });
    this.captureMyRun(
      a,
      b,
      winner,
      aw + "–" + bw,
      format,
      runLabel || format,
      av.vetoNote,
      maps,
      agg.aggA,
      agg.aggB,
      agg.mvp
    );
    return { ...res, id };
  }

  private simPair(st: Stage, x: number, y: number, roundNum: number): void {
    const f = matchFormat(st, x, y);
    const r = this.simSeries(
      this.teamById(x)!,
      this.teamById(y)!,
      f,
      null,
      `Stage ${st.num} · Round ${roundNum}`
    );
    this.recordResult(st, this.teamById(x)!, this.teamById(y)!, r.winner, f, `${r.aw}–${r.bw}`, r.id);
    this.logLines.push(
      `Stage ${st.num} R${roundNum} · ${f} · ${r.winner.name} ${r.aw}–${r.bw} ${r.loser.name} (${r.maps.map((m) => m.map + " " + m.score).join(", ")}) · MVP ${r.mvp ? r.mvp.name + " " + r.mvp.rating.toFixed(2) : "—"}`
    );
  }

  newUserMatch(fields: Partial<CurrentMatch> & { aId: number; bId: number; format: string }): CurrentMatch {
    return Object.assign(
      {
        step: 0,
        steps: vetoSteps(fields.format),
        pool: [...MAPS],
        banned: [],
        picked: [],
        mapList: null,
        maps: [],
        strat: null,
        eco: "Full buy",
        talk: "Trust the game plan",
        done: false,
        stage: null,
        pMatch: null,
        label: "",
      },
      fields
    ) as CurrentMatch;
  }

  playNext(): void {
    if (this.champion) {
      this.alertBox("Tournament complete — champion: " + this.champion.name);
      return;
    }
    if (this.playoffs) {
      this.playPlayoffRound();
      this.notify();
      return;
    }
    if (!this.stages.length) this.initTourney();
    const st = this.stages[this.stageIdx];
    if (!st) {
      this.notify();
      return;
    }
    const pairs = pairings(st);
    if (!pairs.length) {
      this.finishStage(st);
      this.notify();
      return;
    }
    const roundNum = st.round + 1;
    // if user in a pair, go interactive
    if (this.myId !== null) {
      const mp = pairs.find((p) => p.includes(this.myId!));
      if (mp) {
        const oppId = mp[0] === this.myId ? mp[1] : mp[0];
        const fmt = matchFormat(st, mp[0], mp[1]);
        this.currentMatch = this.newUserMatch({
          stage: st,
          pMatch: null,
          aId: this.myId,
          bId: oppId,
          format: fmt,
          label: `Stage ${st.num} · Round ${roundNum}`,
        });
        // sim other pairs first
        pairs.filter((p) => !p.includes(this.myId!)).forEach(([x, y]) => this.simPair(st, x, y, roundNum));
        st.round++;
        this.show("match");
        return;
      }
    }
    pairs.forEach(([x, y]) => this.simPair(st, x, y, roundNum));
    st.round++;
    if (st.qual.length + st.elim.length >= 16 || st.round >= 5) this.finishStage(st);
    this.notify();
  }

  finishStage(st: Stage): void {
    st.done = true;
    // fill qualifiers by record if needed
    const rest = st.ids
      .filter((id) => !st.qual.includes(id) && !st.elim.includes(id))
      .sort((a, b) => st.rec[b].w - st.rec[b].l - (st.rec[a].w - st.rec[a].l));
    while (st.qual.length < 8 && rest.length) st.qual.push(rest.shift()!);
    this.logLines.push(
      `Stage ${st.num} complete. Advancing: ${st.qual.map((id) => this.teamById(id)?.name).join(", ")}`
    );
    if (this.myId !== null && st.ids.includes(this.myId) && !st.qual.includes(this.myId)) {
      this.logLines.push(`Your run ends in Stage ${st.num}. Keep playing to see who wins, or reset.`);
    }
    if (st.num < 3) {
      this.ensureStage(st.num + 1, st.qual);
      this.stageIdx++;
    } else {
      this.makePlayoffs(st.qual);
    }
  }

  makePlayoffs(qual: number[]): void {
    const st3 = this.stages.find((s) => s.num === 3);
    const seeded = [...qual].sort((a, b) => {
      const ra = st3 ? st3.rec[a] : null;
      const rb = st3 ? st3.rec[b] : null;
      if (ra && rb) {
        if (rb.w !== ra.w) return rb.w - ra.w;
        if (ra.l !== rb.l) return ra.l - rb.l;
      }
      return (this.teamById(b)?.vrs ?? 0) - (this.teamById(a)?.vrs ?? 0);
    });
    this.playoffs = {
      round: "Quarter-finals",
      matches: [
        { a: seeded[0], b: seeded[7], done: false, format: "Bo3", label: "Quarter-final 1" },
        { a: seeded[3], b: seeded[4], done: false, format: "Bo3", label: "Quarter-final 2" },
        { a: seeded[1], b: seeded[6], done: false, format: "Bo3", label: "Quarter-final 3" },
        { a: seeded[2], b: seeded[5], done: false, format: "Bo3", label: "Quarter-final 4" },
      ],
      semis: null,
      final: null,
      third: null,
    };
  }

  pendingPlayoffMatches(): PlayoffMatch[] {
    if (!this.playoffs) return [];
    const qf = this.playoffs.matches.filter((m) => !m.done);
    if (qf.length) return qf;
    if (this.playoffs.semis) {
      const sf = this.playoffs.semis.filter((m) => !m.done);
      if (sf.length) return sf;
    }
    const rest: PlayoffMatch[] = [];
    if (this.playoffs.third && !this.playoffs.third.done) rest.push(this.playoffs.third);
    if (this.playoffs.final && !this.playoffs.final.done) rest.push(this.playoffs.final);
    return rest;
  }

  simPlayoffMatch(m: PlayoffMatch): void {
    const r = this.simSeries(
      this.teamById(m.a)!,
      this.teamById(m.b)!,
      m.format,
      null,
      (m.label || "Playoff") + " · Playoffs"
    );
    m.resultId = r.id;
    m.winner = r.winner.id;
    m.loser = r.loser.id;
    m.score = `${r.aw}–${r.bw}`;
    m.mapsInfo = r.maps.map((x) => x.map + " " + x.score).join(", ");
    m.vetoNote = r.vetoNote;
    m.done = true;
    m.mvp = r.mvp;
    this.logLines.push(
      `${m.label} · ${m.format} · ${r.winner.name} ${m.score} ${r.loser.name} · MVP ${r.mvp ? r.mvp.name + " " + r.mvp.rating.toFixed(2) : "—"}`
    );
    this.settlePlayoffProgress();
  }

  settlePlayoffProgress(): void {
    if (!this.playoffs) return;
    if (this.playoffs.matches.every((m) => m.done) && !this.playoffs.semis) {
      const w = this.playoffs.matches.map((m) => m.winner!);
      this.playoffs.semis = [
        { a: w[0], b: w[1], done: false, format: "Bo3", label: "Semi-final 1" },
        { a: w[2], b: w[3], done: false, format: "Bo3", label: "Semi-final 2" },
      ];
      this.playoffs.round = "Semi-finals";
      return;
    }
    if (this.playoffs.semis && this.playoffs.semis.every((m) => m.done) && !this.playoffs.final) {
      const w = this.playoffs.semis.map((m) => m.winner!);
      const l = this.playoffs.semis.map((m) => m.loser!);
      this.playoffs.final = { a: w[0], b: w[1], done: false, format: "Bo5", label: "Grand Final" };
      this.playoffs.third = { a: l[0], b: l[1], done: false, format: "Bo3", label: "3rd-place Decider" };
      this.playoffs.round = "Grand Final";
      return;
    }
    if (this.playoffs.final && this.playoffs.final.done && !this.champion) {
      this.champion = this.teamById(this.playoffs.final.winner) ?? null;
      this.logLines.push(
        `Grand Final: ${this.champion?.name} beat ${this.teamById(this.playoffs.final.loser)?.name} ${this.playoffs.final.score}. Major champions!`
      );
    }
    if (this.playoffs.third && this.playoffs.third.done && !this.third) {
      this.third = this.teamById(this.playoffs.third.winner) ?? null;
      this.logLines.push(
        `3rd place: ${this.third?.name} beat ${this.teamById(this.playoffs.third.loser)?.name} ${this.playoffs.third.score}`
      );
    }
    if (this.playoffs.final && this.playoffs.final.done && this.playoffs.third && this.playoffs.third.done)
      this.playoffs.round = "Complete";
  }

  playPlayoffRound(): void {
    if (!this.playoffs) return;
    const pending = this.pendingPlayoffMatches();
    if (!pending.length) {
      this.settlePlayoffProgress();
      return;
    }
    if (this.myId !== null) {
      const um = pending.find((m) => m.a === this.myId || m.b === this.myId);
      if (um) {
        pending.filter((m) => m !== um).forEach((m) => this.simPlayoffMatch(m));
        this.currentMatch = this.newUserMatch({
          stage: null,
          pMatch: um,
          aId: this.myId,
          bId: um.a === this.myId ? um.b : um.a,
          format: um.format,
          label: um.label + " · Playoffs",
        });
        this.show("match");
        return;
      }
    }
    pending.forEach((m) => this.simPlayoffMatch(m));
  }

  quickSim(): void {
    this.myId = null;
    this.initTourney();
    let guard = 0;
    while (!this.champion && guard++ < 80) this.playNext();
    this.notify();
    this.show("bracket");
  }

  resetAll(): void {
    this.teams.forEach((t) => {
      t.recent = initialRecent(t.name);
      t.form = initialForm(t.vrs, t.recent);
      t.wins = 0;
      t.losses = 0;
      t.beatHigher = 0;
      ensurePlayerState(t);
      t.players.forEach((pl) => {
        pl.hist = [];
        pl.tourneyMaps = 0;
        pl.boost = 0;
        pl.lastTalk = "";
        pl.mental = 68 + Math.floor(Math.abs(Math.sin(t.id * 13 + pl.name.length * 7)) * 22);
      });
    });
    this.detailedResults = [];
    this.logLines = [];
    this.initTourney();
    this.notify();
  }

  // ---- team selection / custom teams ----
  pickTeam(id: number): void {
    this.myId = id;
    if (!this.stages.length) this.initTourney();
    this.notify();
    this.show("dash");
  }

  // ---- Squad & Mental / prep talks ----
  doTalk(playerName: string, kind: TalkKind): void {
    const t = this.teamById(this.myId);
    if (!t) return;
    ensurePlayerState(t);
    const pl = t.players.find((x) => x.name === playerName);
    if (!pl) return;
    const key = this.currentRoundKey();
    if (pl.lastTalk === key) {
      this.logLines.push(`Prep talk: ${pl.name} was already spoken to this round.`);
      this.notify();
      return;
    }
    const cfg = TALK_DEFS[kind] || TALK_DEFS.confidence;
    pl.lastTalk = key;
    const success = Math.random() < cfg.chance;
    if (success) {
      const gain = cfg.up[0] + Math.floor(Math.random() * (cfg.up[1] - cfg.up[0] + 1));
      pl.mental = Math.min(99, pl.mental + gain);
      pl.boost = (pl.boost || 0) + cfg.boost;
      this.logLines.push(
        `Prep talk · ${cfg.label} · ${pl.name}: landed. Mental +${gain} to ${pl.mental}, +${cfg.boost.toFixed(2)} rating next series.`
      );
    } else {
      pl.mental = Math.max(18, pl.mental - cfg.down);
      pl.boost = (pl.boost || 0) - cfg.bdown;
      this.logLines.push(
        `Prep talk · ${cfg.label} · ${pl.name}: backfired. Mental −${cfg.down} to ${pl.mental}${cfg.bdown ? `, rating −${cfg.bdown.toFixed(2)} next series` : ""}.`
      );
    }
    this.notify();
  }
}

export const store = new GameStore();
