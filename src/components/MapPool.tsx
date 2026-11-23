import { MAPS } from "../data/teams";
import { playedCount, playedMaps } from "../engine/sim";
import { store } from "../engine/store";
import { Icon } from "./Icon";

// Port of renderMapPool() in the static build. Custom-team rates are locked
// after creation: this panel is read-only for every team.
export default function MapPool() {
  const t = store.myId !== null ? store.teamById(store.myId) : null;

  if (!t) return null;

  if (!t.isCustom) {
    const pm = playedMaps(t);
    const avg = pm.length ? Math.round(pm.reduce((a, m) => a + t.maps[m], 0) / pm.length) : 50;
    const bm = pm.length ? pm.reduce((x, y) => (t.maps[y] > t.maps[x] ? y : x)) : MAPS[0];
    const wm = pm.length ? pm.reduce((x, y) => (t.maps[y] < t.maps[x] ? y : x)) : MAPS[0];
    return (
      <div className="card">
        <div className="row between" style={{ flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ margin: 0 }}>
            <Icon name="map" /> Map pool
          </h3>
          <span className="pill o">HLTV rates</span>
        </div>
        <p className="small mut" style={{ margin: "8px 0" }}>
          HLTV, 22 Aug – 22 Nov 2026. Average <b style={{ color: "#fff" }}>{avg}%</b> · best {bm} {t.maps[bm]}
          % ({playedCount(t, bm)} maps) · worst {wm} {t.maps[wm]}% ({playedCount(t, wm)} maps). — means no
          maps played, so it is a permaban.
        </p>
        <div>
          {MAPS.map((m) => {
            const c = playedCount(t, m);
            if (c === 0)
              return (
                <div className="maprate" key={m}>
                  <div>
                    <b>{m}</b>
                    <div className="mapratebar">
                      <i style={{ width: "0%" }} />
                    </div>
                  </div>
                  <span className="small mut">No HLTV maps in window — permaban, no win rate exists</span>
                  <div className="rateinp">
                    <span>— · 0 maps</span>
                  </div>
                </div>
              );
            return (
              <div className="maprate" key={m}>
                <div>
                  <b>{m}</b>
                  <div className="mapratebar">
                    <i style={{ width: `${t.maps[m]}%` }} />
                  </div>
                </div>
                <span className="small mut">HLTV win rate · {c} maps played</span>
                <div className="rateinp">
                  <span>{t.maps[m]}%</span>
                </div>
              </div>
            );
          })}
        </div>
        <button className="btn sec" style={{ marginTop: 10 }} onClick={() => store.show("builder")}>
          Build a custom team →
        </button>
      </div>
    );
  }

  const avg = Math.round(MAPS.reduce((a, m) => a + t.maps[m], 0) / 7);
  const bm = MAPS.reduce((x, y) => (t.maps[y] > t.maps[x] ? y : x));
  const wm = MAPS.reduce((x, y) => (t.maps[y] < t.maps[x] ? y : x));
  return (
    <div className="card">
      <div className="row between" style={{ flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0 }}>
          <Icon name="map" /> Map pool
        </h3>
        <span className="pill o">{t.name} · Custom team · Locked</span>
      </div>
      <p className="small mut" style={{ margin: "8px 0" }}>
        Rates are locked for the tournament. Average <b style={{ color: "#fff" }}>{avg}%</b> · best {bm}{" "}
        {t.maps[bm]}% · worst {wm} {t.maps[wm]}%.
      </p>
      <div>
        {MAPS.map((m) => (
          <div className="maprate" key={m}>
            <div>
              <b>{m}</b>
              <div className="mapratebar">
                <i style={{ width: `${t.maps[m]}%` }} />
              </div>
            </div>
            <span className="small mut">Locked</span>
            <div className="rateinp">
              <span>{t.maps[m]}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
