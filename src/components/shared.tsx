import { useState } from "react";
import { asset } from "../engine/sim";
import type { MapStats, PlayerLine, Team } from "../types";
import { Icon } from "./Icon";
import { MapScoreboard } from "./MapScoreboard";
import { RoleTag } from "./Tags";

export function LogoBadge({ team }: { team: Team }) {
  return team.logo ? (
    <span className="badge">
      <img src={asset(team.logo)} alt={`${team.name} logo`} loading="lazy" />
    </span>
  ) : (
    <span className="badge">{team.tag.slice(0, 4)}</span>
  );
}

export function LogoSm({ team }: { team: Team }) {
  return team.logo ? <img className="logosm" src={asset(team.logo)} alt="" loading="lazy" /> : null;
}

export function Spark({ hist }: { hist: number[] }) {
  if (!hist || !hist.length) return <span className="small mut">No maps yet</span>;
  const max = 1.6;
  const min = 0.4;
  return (
    <>
      <span className="spark">
        {hist.slice(-7).map((v, i) => {
          const h = Math.max(3, Math.round(((v - min) / (max - min)) * 20));
          return <i key={i} style={{ height: h }} title={v.toFixed(2)} />;
        })}
      </span>{" "}
      <span className="small">
        {hist
          .slice(-5)
          .map((v) => v.toFixed(2))
          .join(" · ")}
      </span>
    </>
  );
}

export function HltvTable({ title, rows, mvpName }: { title: string; rows: PlayerLine[]; mvpName?: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <b className="small">{title}</b>
      <table className="statstable">
        <tbody>
          <tr>
            <th>Player</th>
            <th>K–D</th>
            <th>+/-</th>
            <th>ADR</th>
            <th>KAST</th>
            <th>Rating 2.0</th>
          </tr>
          {rows.map((r) => (
            <tr key={r.name} style={r.name === mvpName ? { background: "var(--gold-bg)" } : undefined}>
              <td>
                <b>{r.name}</b> <RoleTag role={r.role || ""} />{" "}
                {r.name === mvpName ? (
                  <>
                    <Icon name="star" /> MVP
                  </>
                ) : (
                  ""
                )}
              </td>
              <td>
                {r.k}–{r.d}
              </td>
              <td>
                {r.diff > 0 ? "+" : ""}
                {r.diff}
              </td>
              <td>{r.adr}</td>
              <td>{r.kast}%</td>
              <td>
                <b>{r.rating.toFixed(2)}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SeriesScopeProps {
  aggA: PlayerLine[];
  aggB: PlayerLine[];
  mvp: PlayerLine | null | undefined;
  mapStats?: MapStats[];
  seriesScore: string;
  aName: string;
  bName: string;
}

// Series totals by default; in a multi-map series the map tiles toggle the tables to one map.
// `compact` puts the two teams side by side and shrinks the tiles.
export function SeriesScopeTables({
  aggA,
  aggB,
  mvp,
  mapStats,
  seriesScore,
  aName,
  bName,
  compact = false,
}: SeriesScopeProps & { compact?: boolean }) {
  const [mapIndex, setMapIndex] = useState<number | null>(null);
  const maps = mapStats ?? [];
  const picked = mapIndex === null ? undefined : maps[mapIndex];
  const shownMvp = picked ? picked.mvp : mvp;
  return (
    <>
      {maps.length ? (
        <MapScoreboard
          compact={compact}
          maps={maps}
          aName={aName}
          bName={bName}
          series={maps.length > 1 ? seriesScore : undefined}
          selected={mapIndex}
          onSelect={maps.length > 1 ? setMapIndex : undefined}
        />
      ) : null}
      {shownMvp ? (
        <div className="mvpbox">
          <Icon name="star" /> <b>MVP: {shownMvp.name}</b> ({shownMvp.team}) — Rating{" "}
          {shownMvp.rating.toFixed(2)} · {shownMvp.k}–{shownMvp.d} · ADR {shownMvp.adr}
        </div>
      ) : null}
      <div
        className={compact ? "grid" : undefined}
        style={compact ? { gridTemplateColumns: "1fr 1fr", gap: 10 } : undefined}
      >
        <HltvTable title={aName} rows={picked ? picked.statsA : aggA} mvpName={shownMvp?.name} />
        <HltvTable title={bName} rows={picked ? picked.statsB : aggB} mvpName={shownMvp?.name} />
      </div>
    </>
  );
}

export function SeriesStats(props: SeriesScopeProps) {
  if (!props.aggA) return null;
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3 style={{ marginTop: 0 }}>HLTV-style scoreboard</h3>
      <SeriesScopeTables {...props} />
      {props.mapStats ? (
        <p className="small mut" style={{ marginTop: 8 }}>
          Per-map MVPs:{" "}
          {props.mapStats
            .map((m) => m.map + ": " + (m.mvp ? m.mvp.name + " " + m.mvp.rating.toFixed(2) : "—"))
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
