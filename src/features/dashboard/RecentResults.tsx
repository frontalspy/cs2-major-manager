import { Icon } from "../../components/Icon";
import { MapScoreboard, Score, seriesScoreText, toMapScores } from "../../components/MapScoreboard";
import { HltvTable } from "../../components/shared";
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
              <MapScoreboard compact maps={toMapScores(d.maps)} aName={d.a} bName={d.b} />
              {d.mvp ? (
                <div className="small" style={{ margin: "6px 0" }}>
                  <Icon name="star" /> <b>MVP: {d.mvp.name}</b> ({d.mvp.team}) — {d.mvp.rating.toFixed(2)}{" "}
                  rating, {d.mvp.k}–{d.mvp.d}, ADR {d.mvp.adr}
                </div>
              ) : null}
              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <HltvTable title={d.a} rows={d.aggA} mvpName={d.mvp?.name} />
                <HltvTable title={d.b} rows={d.aggB} mvpName={d.mvp?.name} />
              </div>
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
