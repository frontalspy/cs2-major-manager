import type { CurrentMatch } from "../../types";

export function VetoGuide({ format }: { format: string }) {
  if (format === "Bo1")
    return (
      <div className="vetoguide">
        <b>Bo1:</b> six bans, alternating, you first. The last map left is played.
      </div>
    );
  if (format === "Bo5")
    return (
      <div className="vetoguide">
        <b>Bo5:</b> one ban each. The other five maps are played.
      </div>
    );
  return (
    <div className="vetoguide">
      <b>Bo3:</b> ban, ban, pick, pick, ban, ban. The last map left is the decider.
    </div>
  );
}

export function VetoSummary({ match: cm }: { match: CurrentMatch }) {
  if (!cm.mapList) return null;
  const ml = cm.mapList;
  if (cm.format === "Bo1")
    return (
      <p className="small" style={{ marginTop: 10 }}>
        Veto done: <b>{ml[0]}</b> is played.
      </p>
    );
  if (cm.format === "Bo5")
    return (
      <p className="small" style={{ marginTop: 10 }}>
        Veto done: <b>{ml.join(" → ")}</b> will be played.
      </p>
    );
  const yp = cm.picked.find((p) => p.by === "you")?.map;
  const op = cm.picked.find((p) => p.by === "opp")?.map;
  const dec = ml[2];
  return (
    <p className="small" style={{ marginTop: 10 }}>
      Veto done: your pick <b>{yp}</b>, their pick <b>{op}</b>, decider <b>{dec}</b>.
    </p>
  );
}
