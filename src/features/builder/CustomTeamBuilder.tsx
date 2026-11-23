import { useState } from "react";
import { Icon } from "../../components/Icon";
import { RoleTag } from "../../components/Tags";
import { CUSTOM_EMBLEMS, CUSTOM_ROLES } from "../../data/maps";
import { MAPS } from "../../data/teams";
import {
  addCustomPlayer,
  createCustom,
  getAllPlayers,
  getCustomMapRates,
  pickLogo,
  presetCustomMapRates,
  removeCustomPlayer,
  resetCustomMapRates,
  setCustomMapRate,
  togglePick,
} from "../../engine/customTeam";
import { asset } from "../../engine/sim";
import { store } from "../../engine/store";

// Custom Team builder — port of renderBuilder() / renderPool() /
// renderCustomMapRates() / addCustomPlayer() in the static build.
export default function CustomTeamBuilder() {
  const [name, setName] = useState("Custom Team");
  const [tag, setTag] = useState("CSTM");
  const [cpName, setCpName] = useState("");
  const [cpRating, setCpRating] = useState("1.08");
  const [cpRole, setCpRole] = useState<string>("Rifler");
  const [q, setQ] = useState("");

  const rates = getCustomMapRates(store);
  const avg = store.customPicks.length
    ? store.customPicks.reduce((a, p) => a + p.rating, 0) / store.customPicks.length
    : 0;
  const poolAvg = Math.round(MAPS.reduce((a, m) => a + rates[m], 0) / 7);

  const all = getAllPlayers(store);
  const query = q.toLowerCase();
  const shown = (
    query
      ? all.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p as { team?: string }).team?.toLowerCase().includes(query)
        )
      : all
  ).slice(0, 80);

  return (
    <>
      <h2>Custom team</h2>
      <p className="small mut">
        Pick five from the 160-player pool or create your own. Enters Stage 1 as seed 32. An IGL and an AWPer
        matter more than five entries.
      </p>
      <div className="hero">
        <div className="card">
          <label className="small">Team name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Custom Team"
            style={{ margin: "6px 0 10px" }}
          />
          <label className="small">Tag (3–4 letters)</label>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. CSTM"
            style={{ margin: "6px 0 10px" }}
          />
          <label className="small">Team emblem — pick one</label>
          <div className="emblems" id="ctLogos">
            {CUSTOM_EMBLEMS.map((l, i) => (
              <button
                key={l.name}
                type="button"
                className={`emblem ${i === store.customLogoIdx ? "on" : ""}`}
                onClick={() => pickLogo(store, i)}
              >
                <img src={asset(l.src)} alt={`${l.name} emblem`} />
                <span>{l.name}</span>
              </button>
            ))}
          </div>
          <label className="small">Map win rates (%)</label>
          <p className="small mut" style={{ margin: "4px 0 2px" }}>
            Win % per map, used in the sim and the veto. Locked once the team is created. Defaults follow your
            five’s rating.
          </p>
          <div id="ctMapRates">
            {MAPS.map((m) => {
              const v = rates[m];
              return (
                <div className="maprate" key={m}>
                  <div>
                    <b>{m}</b>
                    <div className="mapratebar">
                      <i style={{ width: `${v}%` }} />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={v}
                    onChange={(e) => setCustomMapRate(store, m, e.target.value)}
                    aria-label={`${m} win rate`}
                  />
                  <div className="rateinp">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={v}
                      onChange={(e) => setCustomMapRate(store, m, e.target.value)}
                      aria-label={`${m} win rate percent`}
                    />
                    <span>{v}%</span>
                  </div>
                </div>
              );
            })}
            <p className="small mut" style={{ marginTop: 6 }}>
              Pool average <b style={{ color: "#fff" }}>{poolAvg}%</b>{" "}
              {store.customMapsTouched
                ? "custom rates, locked on create."
                : "suggested from your five's rating. Move a slider to set your own."}
            </p>
          </div>
          <div className="row" style={{ flexWrap: "wrap", margin: "8px 0" }}>
            <button type="button" className="talkbtn" onClick={() => presetCustomMapRates(store, 50)}>
              All 50%
            </button>
            <button type="button" className="talkbtn" onClick={() => resetCustomMapRates(store)}>
              Reset to suggested
            </button>
          </div>
          <div id="ctSummary">
            {store.customPicks.length ? (
              <>
                <p className="small">
                  Team rating: <b>{avg.toFixed(2)}</b>
                </p>
                <p className="small mut">
                  For reference: Vitality 1.11, lowest Major team ~0.99.{" "}
                  {store.customPicks.some((p) => p.role.includes("IGL")) ? (
                    <>
                      <Icon name="check" /> IGL included
                    </>
                  ) : (
                    <>
                      <Icon name="warning" /> No IGL.
                    </>
                  )}{" "}
                  {store.customPicks.some((p) => p.role.includes("AWP")) ? (
                    <>
                      <Icon name="check" /> AWPer included
                    </>
                  ) : (
                    <>
                      <Icon name="warning" /> No AWPer.
                    </>
                  )}
                </p>
              </>
            ) : null}
          </div>
          <button className="btn" style={{ width: "100%" }} onClick={() => createCustom(store, name, tag)}>
            Create team
          </button>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>
            Selected five (<span id="ctCount">{store.customPicks.length}</span>/5)
          </h3>
          <div id="ctPicked">
            {store.customPicks.length ? (
              store.customPicks.map((p) => (
                <div className="row small" style={{ marginBottom: 8 }} key={p.name}>
                  <span className="avatar">{p.name.slice(0, 2).toUpperCase()}</span>
                  <span>
                    <b>{p.name}</b> — <RoleTag role={p.role} />
                    <br />
                    <span className="mut">{(p as { team?: string }).team}</span>
                  </span>
                  <b style={{ marginLeft: "auto" }}>{p.rating.toFixed(2)}</b>
                </div>
              ))
            ) : (
              <p className="mut small">No players picked yet — tap players below.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ margin: "14px 0" }}>
        <h3 style={{ marginTop: 0 }}>
          <Icon name="plus" /> Create a custom player
        </h3>
        <p className="small mut">Name, rating (0.70–1.60) and role. They join the pool below.</p>
        <div className="customform">
          <div>
            <label className="small">Player name</label>
            <input value={cpName} onChange={(e) => setCpName(e.target.value)} placeholder="e.g. Nova" />
          </div>
          <div>
            <label className="small">Rating</label>
            <input
              type="number"
              min="0.70"
              max="1.60"
              step="0.01"
              value={cpRating}
              onChange={(e) => setCpRating(e.target.value)}
            />
          </div>
          <div>
            <label className="small">Role</label>
            <select value={cpRole} onChange={(e) => setCpRole(e.target.value)}>
              {CUSTOM_ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "end" }}>
            <button
              className="btn"
              onClick={() => {
                const err = addCustomPlayer(store, cpName, parseFloat(cpRating), cpRole);
                if (!err) setCpName("");
              }}
            >
              Add player
            </button>
          </div>
        </div>
        <div id="customList" style={{ marginTop: 10 }}>
          {store.customPlayers.length ? (
            <>
              <b className="small">Your custom players</b>
              {store.customPlayers.map((pl) => (
                <div className="row small" style={{ margin: "6px 0" }} key={pl.name}>
                  <span className="avatar">{pl.name.slice(0, 2).toUpperCase()}</span>
                  <span>
                    <b>{pl.name}</b> — <RoleTag role={pl.role} />
                  </span>
                  <b style={{ marginLeft: "auto" }}>{pl.rating.toFixed(2)}</b>
                  <button className="talkbtn" onClick={() => removeCustomPlayer(store, pl.name)}>
                    Remove
                  </button>
                  <button className="talkbtn" onClick={() => togglePick(store, pl.name)}>
                    {store.customPicks.some((x) => x.name === pl.name) ? (
                      <>
                        <Icon name="check" /> Picked
                      </>
                    ) : (
                      "Pick"
                    )}
                  </button>
                </div>
              ))}
            </>
          ) : (
            <p className="small mut">
              No custom players yet — create one above, then pick them like any pro.
            </p>
          )}
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search players — try donk, ZywOo, s1mple…"
      />
      <div id="pool" style={{ marginTop: 12 }}>
        <div className="grid">
          {shown.map((p) => {
            const sel = store.customPicks.some((x) => x.name === p.name);
            return (
              <div
                key={p.name}
                className={`team ${sel ? "sel" : ""}`}
                onClick={() => togglePick(store, p.name)}
              >
                <div className="row">
                  <span className="avatar">{p.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <b>{p.name}</b>
                    <div className="small mut">
                      {(p as { team?: string }).team} · <RoleTag role={p.role} />
                      {(p as { isCustomPlayer?: boolean }).isCustomPlayer ? " · CUSTOM" : ""}
                    </div>
                  </div>
                  <b style={{ marginLeft: "auto" }}>{p.rating.toFixed(2)}</b>
                </div>
              </div>
            );
          })}
        </div>
        <p className="small mut">
          Showing top {Math.min(80, shown.length)} {q ? "matches" : "by rating"} players in pool (160 pros +
          your custom players).
        </p>
      </div>
    </>
  );
}
