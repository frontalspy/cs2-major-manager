import { asset } from "../engine/sim";
import type { PlayerLine, Team } from "../types";
import { Icon } from "./Icon";
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

export function SeriesStats({
  aggA,
  aggB,
  mvp,
  maps,
  aName,
  bName,
}: {
  aggA: PlayerLine[];
  aggB: PlayerLine[];
  mvp: PlayerLine | null | undefined;
  maps?: { map: string; mvp?: PlayerLine | null }[];
  aName: string;
  bName: string;
}) {
  if (!aggA) return null;
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3 style={{ marginTop: 0 }}>HLTV-style scoreboard</h3>
      {mvp ? (
        <div className="mvpbox">
          <Icon name="star" /> <b>MVP: {mvp.name}</b> ({mvp.team}) — Rating {mvp.rating.toFixed(2)} · {mvp.k}–
          {mvp.d} · ADR {mvp.adr}
        </div>
      ) : null}
      <HltvTable title={aName} rows={aggA} mvpName={mvp?.name} />
      <HltvTable title={bName} rows={aggB} mvpName={mvp?.name} />
      {maps ? (
        <p className="small mut" style={{ marginTop: 8 }}>
          Per-map MVPs:{" "}
          {maps
            .map((m) => m.map + ": " + (m.mvp ? m.mvp.name + " " + m.mvp.rating.toFixed(2) : "—"))
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
