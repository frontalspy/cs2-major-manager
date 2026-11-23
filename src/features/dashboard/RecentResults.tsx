import { MapScoreboard, Score, seriesScoreText, toMapScores } from "../../components/MapScoreboard";
import { SeriesScopeTables } from "../../components/shared";
import { FormatPill } from "../../components/Tags";
import { store } from "../../engine/store";

export function RecentResults() {
  return (
    <div style={{ marginTop: 14 }}>
      {store.detailedResults.length ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent results — HLTV style</h3>
          {store.detailedResults.slice(0, 3).map((d) => (
            <div key={d.when + d.a + d.b} style={{ borderTop: "1px solid var(--line)", padding: "10px 0" }}>
              <div className="row between" style={{ flexWrap: "wrap" }}>
                <b>
                  {d.a} vs {d.b}
                </b>
                <span>
                  <FormatPill format={d.format} /> {d.winner} won{" "}
                  <Score value={seriesScoreText(d.format, d.score, toMapScores(d.maps))} />
                </span>
              </div>
              {d.mapStats ? null : (
                <MapScoreboard compact maps={toMapScores(d.maps)} aName={d.a} bName={d.b} />
              )}
              <SeriesScopeTables
                compact
                aggA={d.aggA}
                aggB={d.aggB}
                mvp={d.mvp}
                mapStats={d.mapStats}
                seriesScore={d.score}
                aName={d.a}
                bName={d.b}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <p className="mut small">
            No detailed results yet — play a round to see HLTV-style player ratings and MVP.
          </p>
        </div>
      )}
    </div>
  );
}
