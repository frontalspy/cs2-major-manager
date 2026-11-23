import { Icon } from "../../components/Icon";
import { MapScoreboard, Score, seriesScoreText, toMapScores } from "../../components/MapScoreboard";
import { SeriesStats } from "../../components/shared";
import { FormatPill } from "../../components/Tags";
import { store } from "../../engine/store";
import type { DetailedResult, StageHistory } from "../../types";

function findResult(id: number | undefined): DetailedResult | undefined {
  return id === undefined ? undefined : store.detailedResults.find((d) => d.id === id);
}

function ResultBody({ result }: { result: DetailedResult }) {
  return (
    <div>
      {result.mapStats ? null : (
        <MapScoreboard maps={toMapScores(result.maps)} aName={result.a} bName={result.b} />
      )}
      <SeriesStats
        aggA={result.aggA}
        aggB={result.aggB}
        mvp={result.mvp}
        mapStats={result.mapStats}
        seriesScore={result.score}
        aName={result.a}
        bName={result.b}
      />
    </div>
  );
}

// Expandable scoreboard (maps, player ratings, MVP) for a simulated series.
export function MatchDetails({ resultId }: { resultId: number | undefined }) {
  const result = findResult(resultId);
  if (!result) return null;
  return (
    <details className="mdetail">
      <summary className="small">Scoreboard</summary>
      <ResultBody result={result} />
    </details>
  );
}

// Every series of a stage, in the order played, each opening to its scoreboard.
export function StageResults({ history }: { history: StageHistory[] }) {
  return (
    <ul className="matchlist">
      {history.map((h) => {
        const result = findResult(h.resultId);
        return (
          <li key={h.resultId}>
            <details>
              <summary>
                <span className="mut small">{result?.label.replace(/^Stage \d · /, "")}</span>{" "}
                <b className={h.w === h.a ? "win" : undefined}>{h.a}</b>{" "}
                <Score value={seriesScoreText(h.format, h.score, toMapScores(result?.maps ?? []))} />{" "}
                <b className={h.w === h.b ? "win" : undefined}>{h.b}</b> <FormatPill format={h.format} />
                {result?.mvp ? (
                  <span className="small mut">
                    {" "}
                    · <Icon name="star" /> {result.mvp.name} {result.mvp.rating.toFixed(2)}
                  </span>
                ) : null}
              </summary>
              {result ? <ResultBody result={result} /> : null}
            </details>
          </li>
        );
      })}
    </ul>
  );
}
