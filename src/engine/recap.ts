import type { GameStore } from "./store";

export function myPlacement(game: GameStore): string {
  if (game.myId === null) return "No team selected";
  const t = game.teamById(game.myId);
  if (!t) return "—";
  if (game.champion && game.champion.id === game.myId) return "Major Champions — 1st place";
  if (
    game.playoffs &&
    game.playoffs.final &&
    game.playoffs.final.done &&
    game.playoffs.final.loser === game.myId
  )
    return "Runners-up — 2nd place";
  if (game.third && game.third.id === game.myId) return "3rd place";
  if (
    game.playoffs &&
    game.playoffs.third &&
    game.playoffs.third.done &&
    game.playoffs.third.loser === game.myId
  )
    return "4th place";
  if (game.playoffs) {
    const inQF = game.playoffs.matches.some((m) => m.a === game.myId || m.b === game.myId);
    const inSF =
      game.playoffs.semis && game.playoffs.semis.some((m) => m.a === game.myId || m.b === game.myId);
    const inF =
      game.playoffs.final && (game.playoffs.final.a === game.myId || game.playoffs.final.b === game.myId);
    if (inF) return "In the Grand Final";
    if (inSF) {
      const sf = game.playoffs.semis!.find((m) => m.a === game.myId || m.b === game.myId);
      if (sf && sf.done)
        return "Semi-finalists — 3rd–4th (3rd-place decider " + (game.playoffs.third ? "pending" : "") + ")";
      return "In the Semi-finals";
    }
    if (inQF) {
      const qf = game.playoffs.matches.find((m) => m.a === game.myId || m.b === game.myId);
      if (qf && qf.done) return "Quarter-finalists — 5th–8th";
      return "In the Quarter-finals";
    }
    return "Eliminated before the playoffs";
  }
  for (let i = game.stages.length - 1; i >= 0; i--) {
    const st = game.stages[i];
    if (!st.ids.includes(game.myId)) continue;
    const r = st.rec[game.myId] || { w: 0, l: 0 };
    if (st.qual.includes(game.myId))
      return st.num === 3
        ? "Qualified for the Playoffs"
        : "Advanced from Stage " + st.num + " (" + r.w + "–" + r.l + ")";
    if (st.elim.includes(game.myId)) return "Eliminated in Stage " + st.num + " (" + r.w + "–" + r.l + ")";
    return "Stage " + st.num + " — in progress (" + r.w + "–" + r.l + ")";
  }
  return "Not started yet";
}

export interface RunPlayerAgg {
  name: string;
  role: string;
  k: number;
  d: number;
  adrSum: number;
  kastSum: number;
  ratingWeighted: number;
  maps: number;
  series: number;
  seriesMVPs: number;
  mapMVPs: number;
}

export function aggregateRunPlayers(game: GameStore): Record<string, RunPlayerAgg> {
  const by: Record<string, RunPlayerAgg> = {};
  game.myRun.forEach((run) => {
    const nMaps = run.maps ? run.maps.length : 1;
    (run.aggMine || []).forEach((s) => {
      if (!by[s.name])
        by[s.name] = {
          name: s.name,
          role: s.role,
          k: 0,
          d: 0,
          adrSum: 0,
          kastSum: 0,
          ratingWeighted: 0,
          maps: 0,
          series: 0,
          seriesMVPs: 0,
          mapMVPs: 0,
        };
      const o = by[s.name];
      o.k += s.k;
      o.d += s.d;
      o.adrSum += s.adr * nMaps;
      o.kastSum += s.kast * nMaps;
      o.ratingWeighted += s.rating * nMaps;
      o.maps += nMaps;
      o.series++;
    });
    if (run.mvp && run.aggMine && run.aggMine.some((s) => s.name === run.mvp!.name))
      by[run.mvp.name].seriesMVPs++;
    (run.mapDetails || []).forEach((md) => {
      if (md.mvp && by[md.mvp.name]) by[md.mvp.name].mapMVPs++;
    });
  });
  return by;
}
