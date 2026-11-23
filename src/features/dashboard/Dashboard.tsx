import { Icon } from "../../components/Icon";
import MapPool from "../../components/MapPool";
import { LogoBadge } from "../../components/shared";
import { RoleTag } from "../../components/Tags";
import { myPlacement } from "../../engine/recap";
import { mentalColor, mentalLabel, store, teamMentalAvg, tourneyAvg, trendOf } from "../../engine/store";
import { RecentResults } from "./RecentResults";
import { ScoutNotes } from "./ScoutNotes";

// Dashboard — port of renderAll()'s dashboard section in the static build:
// hero (tutorial text hides once the tournament starts), dugout, progress,
// log, stats, live mental + recent HLTV results, map pool, scout notes.
export default function Dashboard() {
  const mt = store.myId !== null ? store.teamById(store.myId) : null;
  const started = store.started;
  const total = store.champion
    ? 100
    : store.playoffs
      ? 78
      : store.stageIdx === 2
        ? 55
        : store.stageIdx === 1
          ? 32
          : store.stages.length
            ? 12
            : 0;
  const progTxt = store.champion
    ? store.champion.name + " win the Major!"
    : store.playoffs
      ? "Playoffs · " + store.playoffs.round
      : store.stages.length
        ? `Stage ${store.stageIdx + 1} · Round ${(store.stages[store.stageIdx] || {}).round || 0}`
        : "Not started";

  const dashStats = started
    ? [
        ["Stage " + (store.stageIdx + 1), "Current stage", "blue"],
        [mt ? mt.wins + "–" + mt.losses : "—", "Your record", "green"],
        [mt ? String(Math.round(teamMentalAvg(mt))) : "—", "Team mental avg", "teal"],
        [
          store.detailedResults.length ? (store.detailedResults[0].mvp?.name ?? "—") : "—",
          "Last MVP",
          "gold",
        ],
      ]
    : [
        ["32", "Teams invited", "blue"],
        ["160", "Players in the pool", "teal"],
        ["7", "Maps in the pool", "pur"],
        ["$1,170,000", "Prize pool", "gold"],
      ];

  return (
    <>
      <div className={`hero ${mt ? "single" : ""}`}>
        {mt ? null : (
          <div className="card" id="heroCard">
            <div className="kick">PGL Major Singapore 2026 · 24 Nov – 13 Dec</div>
            {started ? (
              <div id="heroLive">
                <h2 style={{ fontSize: 28, margin: "4px 0" }}>Simulated Major</h2>
                <p className="small mut">No team managed. Pick a team to play your own run.</p>
              </div>
            ) : (
              <div id="heroTutorial">
                <h1>
                  TAKE YOUR TEAM
                  <br />
                  <span>TO THE MAJOR TITLE</span>
                </h1>
                <p className="mut">
                  Take over one of 32 teams, or build your own five. Run the veto, call the strats and manage
                  mental through three Swiss stages and the playoffs.
                </p>
              </div>
            )}
            <div className="row" style={{ flexWrap: "wrap" }}>
              <button className="btn" onClick={() => store.show("teams")}>
                Pick a team
              </button>
              <button className="btn sec" onClick={() => store.show("builder")}>
                Custom team
              </button>
            </div>
            {!started ? (
              <p className="small mut" id="formatTutorial" style={{ marginTop: 12 }}>
                Stage 1: seeds 17–32. Stage 2: seeds 9–16 plus 8 from Stage 1. Stage 3: seeds 1–8 plus 8 from
                Stage 2. Top 8 go to the playoffs.
                <br />
                Swiss: 3 wins advance, 3 losses are out. Bo1, but Bo3 once a team is on 2 wins or 2 losses.
                Stage 3 is all Bo3. Playoffs: Bo3, Bo5 Grand Final, Bo3 3rd-place decider.
                <br />
                Veto: Bo1 is six bans. Bo3 is ban, ban, pick, pick, ban, ban, and the last map decides.
              </p>
            ) : null}
          </div>
        )}
        <div className="card">
          <div className="kick">Your team</div>
          <div style={{ marginTop: 10 }}>
            {mt ? (
              <>
                <div className="row">
                  <LogoBadge team={mt} />
                  <div>
                    <b style={{ fontSize: 18 }}>{mt.name}</b>
                    <div className="small mut">
                      Rating {mt.avg.toFixed(2)} · VRS {mt.vrs} · Form {mt.form > 0 ? "+" : ""}
                      {mt.form} · Record {mt.wins}–{mt.losses}
                    </div>
                  </div>
                </div>
                <p className="small mut" style={{ marginTop: 8 }}>
                  Starts in {mt.id < 8 ? "Stage 3" : mt.id < 16 ? "Stage 2" : "Stage 1"}.
                </p>
                {store.myRun.length ? (
                  <button
                    className="btn sec"
                    style={{ width: "100%", marginTop: 6 }}
                    onClick={() => store.show("recap")}
                  >
                    <Icon name="book" /> Recap — {store.myRun.length} series played
                  </button>
                ) : null}
                {store.champion ? (
                  <button
                    className="btn"
                    style={{ width: "100%", marginTop: 6 }}
                    onClick={() => store.show("recap")}
                  >
                    <Icon name="trophy" /> Final recap — {myPlacement(store)}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <p className="mut">No team yet.</p>
                <button className="btn sec" onClick={() => store.show("teams")}>
                  Pick a team
                </button>
              </>
            )}
          </div>
          <hr style={{ borderColor: "var(--line)" }} />
          <div className="row between">
            <span className="mut small">Progress</span>
            <b>
              {store.champion ? <Icon name="trophy" /> : null} {progTxt}
            </b>
          </div>
          <div className="progress" style={{ margin: "8px 0" }}>
            <i style={{ width: total + "%" }} />
          </div>
          <div>
            {store.logLines.length ? (
              <div className="log">{store.logLines.slice(-10).join("\n")}</div>
            ) : (
              <p className="small mut">No matches yet.</p>
            )}
          </div>
          <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
            <button className="btn" style={{ flex: "2 1 220px" }} onClick={() => store.playNext()}>
              <Icon name="play" /> Play next round
            </button>
            <button
              className="btn sec"
              style={{ flex: "1 1 120px" }}
              onClick={() => {
                if (!started || window.confirm("Reset the Major? Your saved run will be cleared."))
                  store.resetAll();
              }}
            >
              Reset
            </button>
            <button
              className="btn ghost"
              style={{ flex: "1 1 160px" }}
              onClick={() => {
                if (
                  !mt ||
                  window.confirm("Sim the whole Major without your team? Your current run will be replaced.")
                )
                  store.quickSim();
              }}
            >
              Sim the whole Major
            </button>
          </div>
        </div>
      </div>

      <div id="mapPoolBox" style={{ marginBottom: 14 }}>
        <MapPool />
      </div>

      <div className="grid stats">
        {dashStats.map(([v, l, tone]) => (
          <div className="card" style={{ textAlign: "center" }} key={l}>
            <div className={`statnum tone-${tone}`} style={{ fontSize: started ? 26 : 34 }}>
              {v}
            </div>
            <div className="small mut">{l}</div>
          </div>
        ))}
      </div>

      {started ? (
        <div id="livePanels" style={{ marginTop: 14 }}>
          {mt ? (
            <div id="mentalMini">
              <div className="card">
                <div className="row between">
                  <h3 style={{ margin: 0 }}>Squad</h3>
                  <button className="btn sec" onClick={() => store.show("squad")}>
                    Squad →
                  </button>
                </div>
                <div style={{ marginTop: 10 }}>
                  {mt.players.map((pl) => {
                    const tr = trendOf(pl);
                    return (
                      <div className="row small" style={{ margin: "7px 0", flexWrap: "wrap" }} key={pl.name}>
                        <span style={{ minWidth: 130 }}>
                          <b>{pl.name}</b> <RoleTag role={pl.role} />
                        </span>
                        <span style={{ minWidth: 110 }}>
                          Tourney {tourneyAvg(pl).toFixed(2)}{" "}
                          <span className={`trend ${tr.cls}`}>{tr.arrow}</span>
                        </span>
                        <span style={{ flex: 1, minWidth: 120 }}>
                          <span className="mentalbar" style={{ display: "block" }}>
                            <i style={{ width: `${pl.mental}%`, background: mentalColor(pl.mental) }} />
                          </span>
                        </span>
                        <span className="mut">
                          {pl.mental} {mentalLabel(pl.mental)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="small mut">
                  Prep talks can lift a player or backfire.{" "}
                  {mt.isCustom
                    ? `Form (${mt.form > 0 ? "+" : ""}${mt.form}), win rate and ${mt.beatHigher || 0} upset win(s) feed your win chance.`
                    : ""}
                </p>
              </div>
            </div>
          ) : null}
          <RecentResults />
        </div>
      ) : null}

      {!started ? <ScoutNotes /> : null}
    </>
  );
}
