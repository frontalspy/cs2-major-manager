import { Icon } from "../../components/Icon";
import { RoleTag } from "../../components/Tags";
import { H2H_WINDOW_DAYS } from "../../engine/history";
import { headToHeadLines, type ScoutPlayer, scoutTeam } from "../../engine/scout";
import type { RecentResult, Team } from "../../types";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function PlayerLine({ label, player }: { label: string; player: ScoutPlayer }) {
  return (
    <div className="small" style={{ margin: "4px 0" }}>
      <span className="mut">{label}:</span> <b>{player.name}</b> <RoleTag role={player.role} /> ·{" "}
      {player.rating.toFixed(2)}
      {player.estimated ? "*" : ""}
      {player.trend ? (
        <>
          {" "}
          <span className={`trend ${player.trend.cls}`} title={player.trend.label}>
            {player.trend.arrow}
          </span>
        </>
      ) : null}
    </div>
  );
}

function ResultRow({ result }: { result: RecentResult }) {
  return (
    <li className="small">
      <span className={result.won ? "win" : "down"}>{result.won ? "W" : "L"}</span> {result.score} vs{" "}
      <b>{result.opp}</b>{" "}
      <span className="mut">
        · {result.event} · {formatDate(result.date)}
      </span>
    </li>
  );
}

function TeamScout({ team }: { team: Team }) {
  const report = scoutTeam(team);
  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <b>{team.name}</b>
      <PlayerLine label="Best" player={report.best} />
      <PlayerLine label="Weakest" player={report.weakest} />
      <div className="small" style={{ margin: "4px 0" }}>
        <span className="mut">Form:</span> {report.formLabel}
      </div>
      {report.recent.length ? (
        <ul style={{ listStyle: "none", margin: "4px 0 0", padding: 0 }}>
          {report.recent.map((r) => (
            <ResultRow key={`${r.date}-${r.opp}-${r.event}-${r.score}`} result={r} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function HeadToHead({ you, opponent }: { you: Team; opponent: Team }) {
  if (you.isCustom || opponent.isCustom) return null;
  const meetings = headToHeadLines(you, opponent);
  return (
    <div className="small" style={{ marginTop: 10 }}>
      <b>Head-to-head ({H2H_WINDOW_DAYS} days):</b>{" "}
      {meetings.length ? (
        meetings.map((m) => (
          <span key={`${m.date}-${m.event}-${m.score}`} style={{ marginRight: 10 }}>
            {you.name} <span className={m.won ? "win" : "down"}>{m.won ? "won" : "lost"}</span> {m.score} ·{" "}
            <span className="mut">
              {m.event}, {formatDate(m.date)}
            </span>
          </span>
        ))
      ) : (
        <span className="mut">none</span>
      )}
    </div>
  );
}

export function ScoutReport({ you, opponent }: { you: Team; opponent: Team }) {
  return (
    <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
      <div className="kick">
        <Icon name="search" /> Scout report
      </div>
      <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap", marginTop: 6 }}>
        <TeamScout team={you} />
        <TeamScout team={opponent} />
      </div>
      <HeadToHead you={you} opponent={opponent} />
    </div>
  );
}
