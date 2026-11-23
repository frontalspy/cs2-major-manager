import { Score, seriesScoreText } from "../../components/MapScoreboard";
import { LogoBadge } from "../../components/shared";
import type { CurrentMatch, Team } from "../../types";
import { ScoutReport } from "./ScoutReport";

export function MatchHeader({ match: cm, a, b }: { match: CurrentMatch; a: Team; b: Team }) {
  const recordOf = (t: Team): string => {
    const rec = cm.stage?.rec[t.id];
    return rec ? ` · ${rec.w}–${rec.l}` : "";
  };

  return (
    <div className="card">
      <div className="kick">
        {cm.label || ""} · {cm.format}
      </div>
      <div className="row between" style={{ marginTop: 8 }}>
        <div className="row">
          <LogoBadge team={a} />
          <div>
            <b>{a.name}</b>
            <div className="small mut">
              Rating {a.avg.toFixed(2)} · VRS {a.vrs} · {a.style}
              {recordOf(a)}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div className="score" style={{ fontSize: 28 }}>
            VS
          </div>
          {cm.done ? (
            <div className="score" style={{ fontSize: 44 }}>
              <Score
                value={seriesScoreText(
                  cm.format,
                  cm.finalScore ?? "",
                  cm.maps.map((r) => ({ map: r.map, score: r.score }))
                )}
              />
            </div>
          ) : null}
        </div>
        <div className="row">
          <div style={{ textAlign: "right" }}>
            <b>{b.name}</b>
            <div className="small mut">
              Rating {b.avg.toFixed(2)} · VRS {b.vrs} · {b.style}
              {recordOf(b)}
            </div>
          </div>
          <LogoBadge team={b} />
        </div>
      </div>
      {cm.done && cm.resultText ? <p style={{ textAlign: "center" }}>{cm.resultText}</p> : null}
      <ScoutReport you={a} opponent={b} />
    </div>
  );
}
