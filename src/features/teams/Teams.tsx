import { useState } from "react";
import { Icon } from "../../components/Icon";
import { LogoBadge } from "../../components/shared";
import { RegionPill, RoleTag } from "../../components/Tags";
import { MAPS } from "../../data/teams";
import { bestPlayedMap, playedCount } from "../../engine/sim";
import { store } from "../../engine/store";

export default function Teams() {
  const [q, setQ] = useState("");
  const query = q.toLowerCase();
  const filtered = store.teams.filter(
    (t) => t.name.toLowerCase().includes(query) || t.players.some((p) => p.name.toLowerCase().includes(query))
  );
  return (
    <>
      <div className="row between" style={{ flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: "4px 0" }}>Teams</h2>
        <div style={{ minWidth: 220, flex: "0 1 320px" }}>
          <input value={q} placeholder="Search team or player…" onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <p className="small mut">Seeds 1–8 start in Stage 3, 9–16 in Stage 2, 17–32 in Stage 1.</p>
      <div className="grid" id="teamGrid">
        {filtered.map((t) => (
          <div
            key={t.id}
            className={`team ${store.myId === t.id ? "sel" : ""}`}
            onClick={() => store.pickTeam(t.id)}
          >
            <div className="row">
              <LogoBadge team={t} />
              <div>
                <b>{t.name}</b>
                <div className="small mut">
                  Seed {t.id + 1} · <RegionPill region={t.region} /> · VRS {t.vrs} · Rating {t.avg.toFixed(2)}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              {t.players.map((p) => (
                <div className="row between small" key={p.name}>
                  <span>
                    {p.name} <RoleTag role={p.role} />
                  </span>
                  <b>
                    {p.rating.toFixed(2)}
                    {p.est ? "*" : ""}
                  </b>
                </div>
              ))}
            </div>
            <div className="small mut" style={{ marginTop: 8 }}>
              Coach: {t.coach} · Best map: {bestPlayedMap(t)}
              <div className="small mut" style={{ marginTop: 6 }}>
                HLTV map win rates, 22 Aug – 22 Nov 2026 (maps played):{" "}
                {MAPS.map((m) => {
                  const c = playedCount(t, m);
                  return c === 0
                    ? m + " —"
                    : c == null
                      ? m + " " + t.maps[m] + "%"
                      : m + " " + t.maps[m] + "% (" + c + ")";
                }).join(" · ")}
              </div>
            </div>
            <button
              className={`btn ${store.myId === t.id ? "sec" : ""}`}
              style={{ width: "100%", marginTop: 10 }}
            >
              {store.myId === t.id ? (
                <>
                  <Icon name="check" /> Managing
                </>
              ) : (
                "Manage"
              )}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
