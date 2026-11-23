import { Icon } from "../../components/Icon";
import { MapScoreboard, Score, seriesScoreText } from "../../components/MapScoreboard";
import { SeriesStats } from "../../components/shared";
import { MAP_TONE } from "../../components/Tags";
import { MAPS, STRATS } from "../../data/teams";
import { pickStrat, playMap, setEco, setTalk, veto } from "../../engine/matchCentre";
import { aggregateSeries, rateTxtN, vetoSteps } from "../../engine/sim";
import { store } from "../../engine/store";
import { MatchHeader } from "./MatchHeader";
import { VetoGuide, VetoSummary } from "./VetoNotes";

// Match Centre — port of renderMatch() / veto() / playMap() in the static build.
export default function MatchCentre() {
  const cm = store.currentMatch;
  if (!cm) {
    return (
      <div className="card">
        <p className="mut">
          No live match.{" "}
          {store.myId === null
            ? "Pick a team, then Play / Sim next round on the Dashboard."
            : "Play / Sim next round on the Dashboard."}
        </p>
        <button className="btn" onClick={() => store.show("dash")}>
          Dashboard
        </button>
      </div>
    );
  }
  const a = store.teamById(cm.aId)!;
  const b = store.teamById(cm.bId)!;
  const vetoDone = !!cm.mapList;
  const stepDef = cm.steps[cm.step];
  const turnTxt = vetoDone
    ? "Veto complete."
    : stepDef
      ? `Your turn: ${stepDef.type === "ban" ? "ban" : "pick"} a map (step ${cm.step + 1} of ${cm.steps.length}).`
      : "";
  const vetoLog = [...cm.banned, ...cm.picked].sort((x, y) => x.seq - y.seq);
  const nextMap = cm.mapList ? cm.mapList[cm.maps.length] : null;
  const liveAgg = cm.maps.length ? aggregateSeries(cm.maps, a, b) : null;

  if (cm.done) {
    return (
      <>
        <MatchHeader match={cm} a={a} b={b} />
        <SeriesStats
          aggA={cm.aggA!}
          aggB={cm.aggB!}
          mvp={cm.mvp}
          maps={cm.maps}
          aName={a.name}
          bName={b.name}
        />
        <div className="card" style={{ marginTop: 12 }}>
          <div className="score">
            <Score
              value={seriesScoreText(
                cm.format,
                cm.finalScore ?? "",
                cm.maps.map((r) => ({ map: r.map, score: r.score }))
              )}
            />
          </div>
          <p style={{ textAlign: "center" }}>{cm.resultText}</p>
          <MapScoreboard maps={cm.maps} aName={a.name} bName={b.name} />
          <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn"
              onClick={() => {
                store.currentMatch = null;
                store.show("dash");
              }}
            >
              Dashboard
            </button>
            <button
              className="btn sec"
              onClick={() => {
                store.currentMatch = null;
                store.show("recap");
              }}
            >
              <Icon name="book" /> View recap
            </button>
          </div>
        </div>
      </>
    );
  }

  const steps = vetoSteps(cm.format);
  return (
    <>
      <MatchHeader match={cm} a={a} b={b} />
      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Map veto · {cm.format}</h3>
        <VetoGuide format={cm.format} />
        <div className="vetosteps">
          {steps.map((s, i) => (
            <div key={i} className={`vstep ${vetoDone || i < cm.step ? "done" : i === cm.step ? "now" : ""}`}>
              <span className="mut">
                Step {i + 1} · {s.actor === "you" ? "You" : "Opponent"}
              </span>
              <b>
                {s.type === "ban" ? (
                  <>
                    <Icon name="ban" /> Ban
                  </>
                ) : (
                  <>
                    <Icon name="check-circle" /> Pick
                  </>
                )}
              </b>
            </div>
          ))}
          <div className={`vstep decider ${vetoDone ? "now" : ""}`}>
            <span className="mut">
              {cm.format === "Bo1" ? "After 6 bans" : cm.format === "Bo5" ? "After 2 bans" : "After step 6"}
            </span>
            <b>
              {cm.format === "Bo1"
                ? "1 map left = played"
                : cm.format === "Bo5"
                  ? "Other 5 maps played"
                  : "1 map left = decider"}
            </b>
          </div>
        </div>
        <p className="small" style={{ marginBottom: 6 }}>
          <b>{turnTxt}</b>
        </p>
        <div className="maps">
          {MAPS.map((m) => {
            const ban = cm.banned.find((x) => x.map === m);
            const pick = cm.picked.find((x) => x.map === m);
            const inSeries = vetoDone && cm.mapList!.includes(m);
            const isDecider =
              vetoDone && cm.format !== "Bo5" && cm.mapList![cm.mapList!.length - 1] === m && !pick;
            const status = ban ? (
              <span style={{ color: "var(--red)", fontWeight: 700 }}>
                <Icon name="ban" /> Banned by {ban.by === "you" ? "you" : b.name}
              </span>
            ) : pick ? (
              <span style={{ color: "var(--grn)", fontWeight: 700 }}>
                <Icon name="check-circle" /> Picked by {pick.by === "you" ? "you" : b.name}
              </span>
            ) : inSeries ? (
              <span style={{ color: "var(--accent-2)", fontWeight: 700 }}>
                {isDecider ? (
                  <>
                    <Icon name="flag" /> Decider
                  </>
                ) : (
                  "Series map"
                )}
              </span>
            ) : null;
            return (
              <div
                key={m}
                className={`map maptone-${MAP_TONE[m]} ${pick || inSeries ? "on" : ""} ${ban ? "banned" : ""}`}
                onClick={() => {
                  if (!vetoDone && !ban && !pick) veto(store, m);
                }}
              >
                <b>{m}</b>
                <div className="small mut">
                  <div>
                    {a.tag} {rateTxtN(a, m)}
                  </div>
                  <div>
                    {b.tag} {rateTxtN(b, m)}
                  </div>
                </div>
                <div className="small">{status}</div>
              </div>
            );
          })}
        </div>
        {vetoLog.length ? (
          <div className="log" style={{ marginTop: 10, maxHeight: 170 }}>
            {vetoLog
              .map(
                (x, i) =>
                  `${i + 1}. ${x.by === "you" ? "You" : b.name} ${x.type === "ban" ? "banned" : "picked"} ${x.map}`
              )
              .join("\n")}
          </div>
        ) : (
          <p className="small mut" style={{ marginTop: 10 }}>
            No bans or picks yet.
          </p>
        )}
        {vetoDone ? (
          <>
            <p className="small" style={{ marginTop: 10 }}>
              Maps in order: <b>{cm.mapList!.join(" → ")}</b>
            </p>
            <VetoSummary match={cm} />
          </>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>
          Tactics for Map {cm.maps.length + 1}
          {nextMap ? " — " + nextMap : ""}
        </h3>
        <div className="strats">
          {STRATS.map((s) => (
            <div
              key={s.id}
              className={`strat ${cm.strat === s.id ? "on" : ""}`}
              onClick={() => pickStrat(store, s.id)}
            >
              <b>{s.n}</b>
              <p className="small mut">{s.d}</p>
              {s.vs === b.style ? (
                <span className="pill g">
                  Counters their style <Icon name="check" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <label className="small">
            Economy call{" "}
            <select style={{ width: "auto" }} value={cm.eco} onChange={(e) => setEco(store, e.target.value)}>
              <option>Full buy</option>
              <option>Force buy</option>
              <option>Eco / save</option>
              <option>Bonus round discipline</option>
            </select>
          </label>
          <label className="small">
            Team talk{" "}
            <select
              style={{ width: "auto" }}
              value={cm.talk}
              onChange={(e) => setTalk(store, e.target.value)}
            >
              <option>Trust the game plan</option>
              <option>Fire them up</option>
              <option>Calm &amp; reset</option>
              <option>Target their AWPer</option>
            </select>
          </label>
        </div>
        <button className="btn" style={{ marginTop: 12 }} onClick={() => playMap(store)} disabled={!vetoDone}>
          <Icon name="play" /> Play map {cm.maps.length + 1}
        </button>{" "}
        {vetoDone ? null : <span className="small mut"> Complete the veto first.</span>}
      </div>

      <MapScoreboard maps={cm.maps} aName={a.name} bName={b.name} />
      <div className="log" style={{ marginTop: 12 }}>
        {cm.maps.length
          ? cm.maps
              .map(
                (r, i) =>
                  `Map ${i + 1} · ${r.map} · ${r.winner.name} won (win chance ${r.p}%) · MVP ${r.mvp ? r.mvp.name + " " + r.mvp.rating.toFixed(2) : "—"}`
              )
              .join("\n")
          : "No maps played yet."}
      </div>
      {liveAgg ? (
        <SeriesStats
          aggA={liveAgg.aggA}
          aggB={liveAgg.aggB}
          mvp={liveAgg.mvp}
          maps={cm.maps}
          aName={a.name}
          bName={b.name}
        />
      ) : null}
    </>
  );
}
