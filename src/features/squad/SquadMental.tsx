import { Icon, type IconName } from "../../components/Icon";
import MapPool from "../../components/MapPool";
import { LogoBadge, Spark } from "../../components/shared";
import { RoleTag } from "../../components/Tags";
import type { TalkKind } from "../../data/maps";
import { mentalColor, mentalLabel, store, teamMentalAvg, tourneyAvg, trendOf } from "../../engine/store";

// Squad & Mental — port of renderSquad() / doTalk() in the static build.
export default function SquadMental() {
  const key = store.currentRoundKey();
  if (store.myId === null || !store.teamById(store.myId)) {
    return (
      <div className="card">
        <p className="mut">No team yet.</p>
        <button className="btn" onClick={() => store.show("teams")}>
          Teams
        </button>
      </div>
    );
  }
  const t = store.teamById(store.myId)!;
  const talks: { kind: TalkKind; label: string; icon: IconName }[] = [
    { kind: "confidence", label: "Confidence", icon: "users" },
    { kind: "fire", label: "Fire-up", icon: "flame" },
    { kind: "calm", label: "Calm & reset", icon: "wind" },
    { kind: "hard", label: "Hard truth", icon: "warning" },
  ];
  return (
    <>
      <div className="card">
        <div className="row">
          <LogoBadge team={t} />
          <div>
            <b style={{ fontSize: 20 }}>{t.name}</b>
            <div className="small mut">
              Team mental avg {Math.round(teamMentalAvg(t))} · Form {t.form > 0 ? "+" : ""}
              {t.form} · Record {t.wins}–{t.losses}
              {t.isCustom ? ` · Upset wins vs higher VRS: ${t.beatHigher || 0}` : ""}
            </div>
          </div>
          <span className="pill o" style={{ marginLeft: "auto" }}>
            Round key: {key}
          </span>
        </div>
      </div>
      {t.players.map((pl) => {
        const tr = trendOf(pl);
        const avg = tourneyAvg(pl);
        return (
          <div className="card" style={{ marginTop: 10 }} key={pl.name}>
            <div className="row" style={{ flexWrap: "wrap" }}>
              <span className="avatar">{pl.name.slice(0, 2).toUpperCase()}</span>
              <div style={{ minWidth: 170 }}>
                <b>{pl.name}</b>{" "}
                <span className="mut small">
                  <RoleTag role={pl.role} /> {pl.isCustomPlayer ? "· Custom" : ""}
                </span>
                <div className="small mut">
                  Base {pl.rating.toFixed(2)} · Tourney avg <b style={{ color: "#fff" }}>{avg.toFixed(2)}</b>{" "}
                  · Maps {pl.tourneyMaps || 0}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div className="row between small">
                  <span>
                    Mental: <b>{pl.mental}</b> — {mentalLabel(pl.mental)}
                  </span>
                  <span className={`trend ${tr.cls}`}>
                    {tr.arrow} {tr.label}
                  </span>
                </div>
                <div className="mentalbar" style={{ margin: "6px 0" }}>
                  <i style={{ width: `${pl.mental}%`, background: mentalColor(pl.mental) }} />
                </div>
                <div>
                  <Spark hist={pl.hist} />{" "}
                  {pl.boost ? (
                    <span className="pill g">
                      Boost {pl.boost > 0 ? "+" : ""}
                      {pl.boost.toFixed(2)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="row" style={{ marginTop: 10, flexWrap: "wrap", gap: 6 }}>
              <span className="small mut">Prep talk:</span>
              {talks.map((talk) => (
                <button
                  key={talk.kind}
                  className="talkbtn"
                  onClick={() => store.doTalk(pl.name, talk.kind)}
                  disabled={pl.lastTalk === key}
                >
                  <Icon name={talk.icon} /> {talk.label}
                </button>
              ))}
              {pl.lastTalk === key ? <span className="small mut">Talked this round</span> : null}
            </div>
          </div>
        );
      })}
      <div id="squadMapBox" style={{ marginTop: 14 }}>
        <MapPool />
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Prep talks</h3>
        <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
          <div className="small">
            <b>
              <Icon name="users" /> Confidence 1-on-1
            </b>
            <p className="mut">Success 70%: +8–14 mental, +0.03 rating. Fail: −6 mental.</p>
          </div>
          <div className="small">
            <b>
              <Icon name="flame" /> Fire-up speech
            </b>
            <p className="mut">Success 60%: +12–20 mental, +0.06 rating. Fail: −12 mental, −0.03.</p>
          </div>
          <div className="small">
            <b>
              <Icon name="wind" /> Calm &amp; reset
            </b>
            <p className="mut">Success 82%: +5–9 mental, +0.02 rating. Fail: −4 mental.</p>
          </div>
          <div className="small">
            <b>
              <Icon name="warning" /> Hard truth
            </b>
            <p className="mut">Success 50%: +14–18 mental, +0.08 rating. Fail: −16 mental, −0.05.</p>
          </div>
        </div>
        <p className="small mut" style={{ marginTop: 8 }}>
          Mental moves in-game rating: 90+ ≈ +0.04, under 45 ≈ −0.05. Rating boosts last one series.
        </p>
      </div>
    </>
  );
}
