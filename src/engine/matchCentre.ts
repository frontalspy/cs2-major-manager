import { addEventResult } from "./history";
import { aggregateSeries, playedCount, seriesTarget, simMap, stratById } from "./sim";
import type { GameStore } from "./store";

// Interactive Match Centre actions for the user's own series: veto, strat,
// economy, prep talk and map-by-map play.

function vetoApply(game: GameStore, by: "you" | "opp", type: "ban" | "pick", map: string): void {
  const cm = game.currentMatch;
  if (!cm) return;
  const seq = cm.banned.length + cm.picked.length;
  if (type === "ban") cm.banned.push({ map, by, type, seq });
  else cm.picked.push({ map, by, type, seq });
  cm.pool = cm.pool.filter((x) => x !== map);
  cm.step++;
}

function aiVetoMoves(game: GameStore): void {
  const cm = game.currentMatch;
  if (!cm) return;
  const me = game.teamById(game.myId)!;
  const opp = game.teamById(cm.bId)!;
  while (cm.step < cm.steps.length) {
    const s = cm.steps[cm.step];
    if (s.actor !== "opp") break;
    let choice: string;
    if (s.type === "ban") choice = [...cm.pool].sort((x, y) => me.maps[y] - me.maps[x])[0];
    else
      choice = [...cm.pool].sort(
        (x, y) =>
          (playedCount(opp, y) === 0 ? -999 : opp.maps[y]) - (playedCount(opp, x) === 0 ? -999 : opp.maps[x])
      )[0];
    vetoApply(game, "opp", s.type, choice);
  }
  if (cm.step >= cm.steps.length && !cm.mapList) finishVeto(game);
}

function finishVeto(game: GameStore): void {
  const cm = game.currentMatch;
  if (!cm) return;
  const me = game.teamById(game.myId)!;
  const opp = game.teamById(cm.bId)!;
  if (cm.format === "Bo1") {
    cm.mapList = [cm.pool[0]];
  } else if (cm.format === "Bo5") {
    cm.mapList = [...cm.pool].sort((x, y) => me.maps[y] + opp.maps[y] - (me.maps[x] + opp.maps[x]));
  } else {
    const youPick = cm.picked.find((p) => p.by === "you")!.map;
    const oppPick = cm.picked.find((p) => p.by === "opp")!.map;
    const decider = cm.pool[0];
    cm.mapList = cm.aId === game.myId ? [oppPick, youPick, decider] : [youPick, oppPick, decider];
  }
  game.logLines.push(
    `Veto · ${cm.format} · ${me.name} vs ${opp.name}: ${[...cm.banned, ...cm.picked]
      .sort((x, y) => x.seq - y.seq)
      .map((x) => `${x.by === "you" ? me.tag : opp.tag} ${x.type === "ban" ? "banned" : "picked"} ${x.map}`)
      .join(" · ")} → Maps: ${cm.mapList.join(", ")}`
  );
}

export function veto(game: GameStore, m: string): void {
  const cm = game.currentMatch;
  if (!cm || cm.mapList) return;
  const s = cm.steps[cm.step];
  if (!s || s.actor !== "you") return;
  if (!cm.pool.includes(m)) return;
  vetoApply(game, "you", s.type, m);
  aiVetoMoves(game);
  game.notify();
}

export function pickStrat(game: GameStore, id: string): void {
  if (!game.currentMatch) return;
  game.currentMatch.strat = id;
  game.notify();
}

export function setEco(game: GameStore, v: string): void {
  if (game.currentMatch) {
    game.currentMatch.eco = v;
    game.notify();
  }
}

export function setTalk(game: GameStore, v: string): void {
  if (game.currentMatch) {
    game.currentMatch.talk = v;
    game.notify();
  }
}

export function playMap(game: GameStore): void {
  const cm = game.currentMatch;
  if (!cm || !cm.mapList || cm.done) return;
  const a = game.teamById(cm.aId)!;
  const b = game.teamById(cm.bId)!;
  const map = cm.mapList[cm.maps.length];
  const strat = stratById(cm.strat);
  const r = simMap(a, b, map, strat);
  if (cm.eco === "Force buy") r.p = Math.min(85, r.p + 3);
  if (cm.talk === "Fire them up" && Math.random() < 0.3) r.p += 4;
  cm.maps.push(r);

  const aw = cm.maps.filter((x) => x.winner.id === a.id).length;
  const bw = cm.maps.length - aw;
  const need = seriesTarget(cm.format);

  if (aw === need || bw === need || cm.maps.length >= cm.mapList.length) {
    const winner = aw > bw ? a : b;
    const loser = aw > bw ? b : a;
    const aggRes = aggregateSeries(cm.maps, a, b);
    cm.aggA = aggRes.aggA;
    cm.aggB = aggRes.aggB;
    cm.mvp = aggRes.mvp;
    const resultId = game.addDetailedResult({
      label: cm.label || cm.format,
      a: a.name,
      b: b.name,
      winner: winner.name,
      score: aw + "–" + bw,
      format: cm.format,
      mvp: aggRes.mvp,
      aggA: aggRes.aggA,
      aggB: aggRes.aggB,
      maps: cm.maps.map((m) => m.map + " " + m.score),
      when: Date.now(),
    });
    [a, b].forEach((t) => t.players.forEach((pl) => (pl.boost = 0)));
    addEventResult(a, b, aw, bw, cm.label || cm.format);
    cm.done = true;
    cm.finalScore = `${aw} — ${bw}`;
    cm.resultText =
      winner.id === a.id
        ? `Won the ${cm.format}, ${aw}–${bw}.`
        : `Lost the ${cm.format}, ${aw}–${bw}. Review the veto before the next round.`;
    game.logLines.push(
      `Your match · ${cm.format} · ${winner.name} ${Math.max(aw, bw)}–${Math.min(aw, bw)} ${loser.name} (${cm.maps.map((x) => x.map + " " + x.score).join(", ")})`
    );

    const vetoText = `${cm.format} veto — ${[...cm.banned, ...cm.picked]
      .sort((x, y) => x.seq - y.seq)
      .map((x) => `${x.by === "you" ? a.name : b.name} ${x.type === "ban" ? "banned" : "picked"} ${x.map}`)
      .join(
        " · "
      )} → Maps played: ${cm.mapList.join(", ")}${cm.format === "Bo3" ? " (decider only if 1–1)" : cm.format === "Bo1" ? " (last map left after 6 bans)" : ""}`;
    game.captureMyRun(
      a,
      b,
      winner,
      aw + "–" + bw,
      cm.format,
      cm.label || cm.format,
      vetoText,
      cm.maps,
      aggRes.aggA,
      aggRes.aggB,
      aggRes.mvp
    );

    if (cm.stage) {
      const st = cm.stage;
      game.recordResult(st, a, b, winner, cm.format, `${aw}–${bw}`, resultId);
      if (st.qual.length + st.elim.length >= 16 || st.round >= 5) game.finishStage(st);
    } else if (cm.pMatch) {
      const m = cm.pMatch;
      m.resultId = resultId;
      m.winner = winner.id;
      m.loser = loser.id;
      m.score = `${aw}–${bw}`;
      m.mapsInfo = cm.maps.map((x) => x.map + " " + x.score).join(", ");
      m.vetoNote = vetoText;
      m.done = true;
      game.settlePlayoffProgress();
    }
  }
  game.notify();
}
