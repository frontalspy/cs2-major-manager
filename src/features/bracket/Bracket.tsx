import { Icon } from "../../components/Icon";
import { Score } from "../../components/MapScoreboard";
import { LogoSm } from "../../components/shared";
import { FormatPill } from "../../components/Tags";
import { asset } from "../../engine/sim";
import { store } from "../../engine/store";
import type { PlayoffMatch, Stage } from "../../types";
import { MatchDetails, StageResults } from "./MatchResult";

interface RecordGroup {
  key: string;
  ids: number[];
  status: "adv" | "elim" | "live";
  label: string;
}

// Groups a stage's teams by W–L record, best record first, like the Major's
// Swiss view: 3 wins advance, 3 losses are eliminated.
function recordGroups(st: Stage): RecordGroup[] {
  const groups = new Map<string, RecordGroup>();
  for (const id of st.ids) {
    const { w, l } = st.rec[id];
    const key = `${w}-${l}`;
    const status = st.qual.includes(id) ? "adv" : st.elim.includes(id) ? "elim" : "live";
    const label = status === "adv" ? "Advanced" : status === "elim" ? "Eliminated" : "In play";
    const g = groups.get(key) ?? { key, ids: [], status, label };
    g.ids.push(id);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => {
    const [aw, al] = a.key.split("-").map(Number);
    const [bw, bl] = b.key.split("-").map(Number);
    return bw - aw || al - bl;
  });
}
export default function Bracket() {
  const mbox = (m: PlayoffMatch | null | undefined) => {
    if (!m) return null;
    const a = store.teamById(m.a)!;
    const b = store.teamById(m.b)!;
    return (
      <div className="matchbox" key={m.label}>
        <LogoSm team={a} />
        {a.name} vs <LogoSm team={b} />
        {b.name} <FormatPill format={m.format || ""} />
        <br />
        {m.done ? (
          <>
            <b>
              {store.teamById(m.winner!)?.name} won <Score value={m.score ?? ""} />
            </b>
            {m.mapsInfo ? (
              <>
                <br />
                <span className="small mut">{m.mapsInfo}</span>
              </>
            ) : null}
            {m.mvp ? (
              <>
                <br />
                <span className="small">
                  <Icon name="star" /> MVP: {m.mvp.name} {m.mvp.rating.toFixed(2)}
                </span>
              </>
            ) : null}
            <MatchDetails resultId={m.resultId} />
            {m.vetoNote ? (
              <>
                <br />
                <span className="small mut">{m.vetoNote}</span>
              </>
            ) : null}
          </>
        ) : (
          <span className="mut">Not played</span>
        )}
      </div>
    );
  };

  const final = store.playoffs?.final;
  const runnerUp = final?.done ? store.teamById(final.loser) : undefined;

  return (
    <>
      {store.stages.map((st) => (
        <div className="card" style={{ marginBottom: 12 }} key={st.num}>
          <h3 style={{ marginTop: 0 }}>
            Stage {st.num} · Swiss
            {st.done ? " · Complete" : store.stages[store.stageIdx] === st ? " · Live" : ""}
          </h3>
          <div className="swiss">
            {recordGroups(st).map((g) => (
              <div className={`recbox ${g.status}`} key={g.key}>
                <header>
                  <span>{g.key.replace("-", " – ")}</span>
                  <span>{g.label}</span>
                </header>
                <ul>
                  {g.ids.map((id) => {
                    const t = store.teamById(id)!;
                    return (
                      <li key={id}>
                        <LogoSm team={t} />
                        <b>{t.name}</b> {id === store.myId ? <Icon name="star" label="Your team" /> : ""}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {st.history.length ? (
            <>
              <h4 style={{ margin: "14px 0 4px" }}>Results</h4>
              <StageResults history={st.history} />
            </>
          ) : null}
        </div>
      ))}

      {store.playoffs ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Playoffs</h3>
          <div className="bracket">
            <div>
              <b>Quarter-finals · Bo3</b>
              {store.playoffs.matches.map((m) => mbox(m))}
            </div>
            <div>
              <b>Semi-finals · Bo3</b>
              {store.playoffs.semis ? (
                store.playoffs.semis.map((m) => mbox(m))
              ) : (
                <p className="mut small">TBD</p>
              )}
            </div>
            <div>
              <b>Grand Final · Bo5</b>
              {store.playoffs.final ? mbox(store.playoffs.final) : <p className="mut small">TBD</p>}
              <b>3rd-place decider · Bo3</b>
              {store.playoffs.third ? mbox(store.playoffs.third) : null}
            </div>
            <div>
              <b>Champion</b>
              <div className="matchbox" style={{ textAlign: "center", fontSize: 18 }}>
                {store.champion ? (
                  <>
                    {store.champion.logo ? (
                      <img
                        className="logomd"
                        src={asset(store.champion.logo)}
                        alt={`${store.champion.name} logo`}
                      />
                    ) : null}
                    <Icon name="trophy" /> {store.champion.name}
                  </>
                ) : (
                  "—"
                )}
              </div>
              {runnerUp ? (
                <p style={{ margin: "8px 0 4px", fontSize: 16 }}>
                  <Icon name="medal" /> <b>2nd:</b> {runnerUp.name}
                </p>
              ) : null}
              {store.third ? (
                <p className="small mut" style={{ margin: "4px 0" }}>
                  <b>3rd:</b> {store.third.name}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {!store.stages.length && !store.playoffs ? <p className="mut">Nothing played yet.</p> : null}
    </>
  );
}
