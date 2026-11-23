// Round scores (13:7) are the headline of a CS2 map, so they are shown large
// wherever maps are listed. Scores are written from the first team's side.

import { MAP_TONE } from "./Tags";

export interface MapScore {
  map: string;
  score: string;
}

// "Inferno 13:10" -> { map: "Inferno", score: "13:10" }
export function toMapScores(lines: string[]): MapScore[] {
  return lines.map((line) => {
    const at = line.lastIndexOf(" ");
    return { map: line.slice(0, at), score: line.slice(at + 1) };
  });
}

// A Bo1 is one map, so its result is the round score rather than 1–0.
export function seriesScoreText(format: string, seriesScore: string, maps: MapScore[]): string {
  return format === "Bo1" && maps[0] ? maps[0].score : seriesScore;
}

// Winner's number green, loser's red; works for 13:7 map scores and 2–1 series scores.
export function Score({ value }: { value: string }) {
  const m = /^(\d+)\s*([:–—-])\s*(\d+)$/.exec(value.trim());
  if (!m) return <>{value}</>;
  const x = Number(m[1]);
  const y = Number(m[3]);
  return (
    <span className="sc">
      <span className={x > y ? "win" : x < y ? "down" : undefined}>{m[1]}</span>
      {m[2]}
      <span className={y > x ? "win" : y < x ? "down" : undefined}>{m[3]}</span>
    </span>
  );
}

function winnerName(score: string, aName: string, bName: string): string {
  const [a, b] = score.split(/[:–]/).map(Number);
  return a > b ? aName : bName;
}

function Tile({
  name,
  tone,
  score,
  winner,
  selected,
  onSelect,
}: {
  name: string;
  tone: string;
  score: string;
  winner: string;
  selected: boolean;
  onSelect?: () => void;
}) {
  const body = (
    <>
      <span className={`mapname tone-${tone}`}>{name}</span>
      <span className="mapscore">
        <Score value={score} />
      </span>
      <span className="mapwin">{winner}</span>
    </>
  );
  return (
    <li className={selected ? "on" : undefined}>
      {onSelect ? (
        <button type="button" className="tilebtn" aria-pressed={selected} onClick={onSelect}>
          {body}
        </button>
      ) : (
        body
      )}
    </li>
  );
}

// With `onSelect` the tiles become a toggle: an optional leading series tile (index null)
// followed by one tile per map (index = position in `maps`).
export function MapScoreboard({
  maps,
  aName,
  bName,
  compact = false,
  series,
  selected,
  onSelect,
}: {
  maps: MapScore[];
  aName: string;
  bName: string;
  compact?: boolean;
  series?: string;
  selected?: number | null;
  onSelect?: (index: number | null) => void;
}) {
  if (!maps.length) return null;
  return (
    <ul className={`mapscores ${compact ? "compact" : ""}`}>
      {series ? (
        <Tile
          name="Series"
          tone="mut"
          score={series}
          winner={winnerName(series, aName, bName)}
          selected={selected === null}
          onSelect={onSelect && (() => onSelect(null))}
        />
      ) : null}
      {maps.map((m, i) => (
        // the same map cannot repeat in a series, so the name is unique
        <Tile
          key={`${m.map}-${i}`}
          name={m.map}
          tone={MAP_TONE[m.map] ?? "mut"}
          score={m.score}
          winner={winnerName(m.score, aName, bName)}
          selected={selected === i}
          onSelect={onSelect && (() => onSelect(i))}
        />
      ))}
    </ul>
  );
}
