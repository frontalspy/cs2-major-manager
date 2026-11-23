import { Icon } from "../../components/Icon";
import { MapScoreboard, Score, seriesScoreText, toMapScores } from "../../components/MapScoreboard";
import { HltvTable, LogoBadge, Spark } from "../../components/shared";
import { RoleTag } from "../../components/Tags";
import { aggregateRunPlayers, myPlacement } from "../../engine/recap";
import { mentalLabel, store, tourneyAvg, trendOf } from "../../engine/store";

// Tournament recap — port of renderRecap() / myPlacement() /
// aggregateRunPlayers() in the static build.
export default function Recap() {
  if (store.myId === null || !store.teamById(store.myId)) {
    return (
      <div className="card">
        <p className="mut">No team yet. Pick one to start a run.</p>
        <button className="btn" onClick={() => store.show("teams")}>
          Teams
        </button>{" "}
        <button className="btn sec" onClick={() => store.show("builder")}>
          Custom team
        </button>
      </div>
    );
  }
  const t = store.teamById(store.myId)!;
  const finished = !!store.champion;
  const myStageRows = store.stages.filter((st) => st.ids.includes(store.myId!));

  let mapW = 0;
  let mapL = 0;
  store.myRun.forEach((run) => {
    const parts = run.score.split("–").map(Number);
    if (parts.length === 2) {
      const mine = run.won ? Math.max(parts[0], parts[1]) : Math.min(parts[0], parts[1]);
      const theirs = run.won ? Math.min(parts[0], parts[1]) : Math.max(parts[0], parts[1]);
      mapW += mine;
      mapL += theirs;
    }
  });
  const seriesW = store.myRun.filter((r) => r.won).length;
  const seriesL = store.myRun.length - seriesW;
  const agg = aggregateRunPlayers(store);

  const playerRows = t.players
    .map((pl) => {
      const o = agg[pl.name];
      const tr = trendOf(pl);
      const runRating = o && o.maps ? +(o.ratingWeighted / o.maps).toFixed(2) : tourneyAvg(pl);
      return {
        name: pl.name,
        role: pl.role,
        base: pl.rating,
        runRating,
        tourney: tourneyAvg(pl),
        maps: pl.tourneyMaps || (o ? o.maps : 0),
        k: o ? o.k : 0,
        d: o ? o.d : 0,
        diff: o ? o.k - o.d : 0,
        adr: o && o.maps ? Math.round(o.adrSum / o.maps) : 0,
        kast: o && o.maps ? Math.round(o.kastSum / o.maps) : 0,
        seriesMVPs: o ? o.seriesMVPs : 0,
        mapMVPs: o ? o.mapMVPs : 0,
        mental: pl.mental,
        tr,
        hist: pl.hist || [],
      };
    })
    .sort((x, y) => y.tourney - x.tourney);
  const best = playerRows[0];
  const upset = store.myRun
    .filter((r) => r.won)
    .map((r) => store.teamById(r.oppId))
    .filter(Boolean)
    .sort((x, y) => (y?.vrs ?? 0) - (x?.vrs ?? 0))[0];

  const narrative = store.myRun.length
    ? `${t.name} entered the Major in ${store.myId! < 8 ? "Stage 3 (direct invite)" : store.myId! < 16 ? "Stage 2" : "Stage 1"}. ${store.myRun.length} series played: ${seriesW}W–${seriesL}L, maps ${mapW}–${mapL}.${
        upset ? ` Best win: ${upset.name} (VRS ${upset.vrs}).` : ""
      }${best ? ` ${best.name} led the way: ${best.tourney.toFixed(2)} rating over ${best.maps} maps.` : ""} Result: ${myPlacement(store)}.`
    : "No series played yet.";

  return (
    <>
      <div className="card">
        <div className="row" style={{ flexWrap: "wrap" }}>
          <LogoBadge team={t} />
          <div style={{ minWidth: 200 }}>
            <b style={{ fontSize: 22 }}>{t.name}</b>
            <div className="small mut">
              Seed {t.id + 1} · Avg rating {t.avg} · VRS {t.vrs} · Coach: {t.coach}
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div className="placement">{myPlacement(store)}</div>
            <div className="small mut">
              {finished
                ? "Tournament complete"
                : store.champion
                  ? "Tournament complete"
                  : "Run " +
                    (seriesL && store.stages.some((s) => s.elim.includes(store.myId!))
                      ? "ended"
                      : "in progress")}
            </div>
          </div>
        </div>
        <p className="small" style={{ marginTop: 12 }}>
          {narrative}
        </p>
        <div className="grid" style={{ marginTop: 10 }}>
          {[
            [seriesW + "–" + seriesL, "Series W–L", "green"],
            [mapW + "–" + mapL, "Map W–L", "blue"],
            [
              store.myRun.length ? Math.round((seriesW / store.myRun.length) * 100) + "%" : "—",
              "Series win rate",
              "teal",
            ],
            [best ? best.name + " · " + best.tourney.toFixed(2) : "—", "Top-rated player", "gold"],
          ].map(([v, l, tone]) => (
            <div
              key={l}
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--line)",
                padding: 10,
                textAlign: "center",
              }}
            >
              <div className={`statnum tone-${tone}`} style={{ fontSize: 22 }}>
                {v}
              </div>
              <div className="small mut">{l}</div>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn sec" onClick={() => store.show("bracket")}>
            Full bracket
          </button>
          <button className="btn sec" onClick={() => store.show("squad")}>
            Squad &amp; Mental
          </button>
          <button className="btn ghost" onClick={() => store.show("dash")}>
            Dashboard
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Stage by stage</h3>
        {myStageRows.length ? (
          <table>
            <tbody>
              <tr>
                <th>Stage</th>
                <th>Your record</th>
                <th>Outcome</th>
              </tr>
              {myStageRows.map((st) => {
                const r = st.rec[store.myId!] || { w: 0, l: 0 };
                return (
                  <tr key={st.num}>
                    <td>
                      <b>Stage {st.num}</b>
                    </td>
                    <td>
                      {r.w}–{r.l}
                    </td>
                    <td>
                      {st.qual.includes(store.myId!) ? (
                        <span className="win">
                          Advanced <Icon name="check" />
                        </span>
                      ) : st.elim.includes(store.myId!) ? (
                        <span style={{ color: "var(--red)" }}>Eliminated</span>
                      ) : st.done ? (
                        "Done"
                      ) : (
                        "In progress"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="small mut">No stage played yet.</p>
        )}
        {store.playoffs && store.playoffs.matches.some((m) => m.a === store.myId || m.b === store.myId) ? (
          <p className="small mut" style={{ marginTop: 8 }}>
            Playoffs: see the series list below.
          </p>
        ) : null}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Player ratings</h3>
        <p className="small mut">
          Average Rating 2.0 across every map played. K–D, ADR and KAST are totals across your series.
        </p>
        {playerRows.map((p) => (
          <div
            key={p.name}
            style={{
              borderTop: "1px solid var(--line)",
              padding: "10px 0",
              ...(best && p.name === best.name
                ? { background: "var(--gold-bg)", paddingLeft: 8, paddingRight: 8 }
                : {}),
            }}
          >
            <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
              <span className="avatar">{p.name.slice(0, 2).toUpperCase()}</span>
              <div style={{ minWidth: 140 }}>
                <b>{p.name}</b>
                {best && p.name === best.name ? (
                  <>
                    {" "}
                    <Icon name="star" /> Top rated
                  </>
                ) : null}
                <div className="small mut">
                  <RoleTag role={p.role} /> · Base {p.base.toFixed(2)}
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 26, color: "var(--accent)" }}>
                  {p.tourney.toFixed(2)}
                </div>
                <div className="small mut">Tourney rating · {p.maps} maps</div>
              </div>
            </div>
            <div className="small" style={{ marginTop: 6 }}>
              {p.maps ? `K–D ` : "No maps played yet · "}
              {p.maps ? (
                <>
                  <b>
                    {p.k}–{p.d}
                  </b>{" "}
                  ({p.diff > 0 ? "+" : ""}
                  {p.diff}) · ADR <b>{p.adr}</b> · KAST <b>{p.kast}%</b> · MVPs:{" "}
                  <b>
                    {p.seriesMVPs} series / {p.mapMVPs} map
                  </b>{" "}
                  •{" "}
                </>
              ) : null}
              Trend{" "}
              <span className={`trend ${p.tr.cls}`}>
                {p.tr.arrow} {p.tr.label}
              </span>{" "}
              · Mental {p.mental} ({mentalLabel(p.mental)})
            </div>
            <div style={{ marginTop: 4 }}>
              <Spark hist={t.players.find((x) => x.name === p.name)?.hist || []} />
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Series</h3>
        {store.myRun.length ? (
          store.myRun.map((run, i) => (
            <div className={`recapmatch ${run.won ? "won" : "lost"}`} key={run.when + "-" + i}>
              <div className="row between" style={{ flexWrap: "wrap", gap: 8 }}>
                <b>
                  #{i + 1} · {run.label} · {run.format} — vs {run.oppName}
                </b>
                <span className={`pill ${run.won ? "g" : "red"}`}>
                  {run.won ? "WON" : "LOST"}{" "}
                  <Score value={seriesScoreText(run.format, run.score, toMapScores(run.maps))} />
                </span>
              </div>
              <MapScoreboard compact maps={toMapScores(run.maps)} aName={run.aName} bName={run.bName} />
              {run.vetoNote ? (
                <div className="small mut" style={{ marginTop: 4 }}>
                  <Icon name="map" /> {run.vetoNote}
                </div>
              ) : null}
              {run.mvp ? (
                <div className="small" style={{ marginTop: 4 }}>
                  <Icon name="star" /> Series MVP: <b>{run.mvp.name}</b> ({run.mvp.team}) —{" "}
                  {run.mvp.rating.toFixed(2)} rating
                </div>
              ) : null}
              {run.mapDetails && run.mapDetails.length ? (
                <div className="small mut" style={{ marginTop: 2 }}>
                  Map MVPs:{" "}
                  {run.mapDetails
                    .map(
                      (md) => md.map + ": " + (md.mvp ? md.mvp.name + " " + md.mvp.rating.toFixed(2) : "—")
                    )
                    .join(" · ")}
                </div>
              ) : null}
              {run.aggMine ? (
                <HltvTable title={t.name + " — this series"} rows={run.aggMine} mvpName={run.mvp?.name} />
              ) : null}
            </div>
          ))
        ) : (
          <p className="small mut">No matches yet. Play a round from the Dashboard.</p>
        )}
      </div>
    </>
  );
}
