import { Icon } from "../../components/Icon";

const LINK_STYLE = { color: "var(--accent-2)" };

export function ScoutNotes() {
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h3>
        <Icon name="clipboard" /> How results are decided
      </h3>
      <p className="small mut">
        Every map is rolled from VRS, HLTV Rating 3.0, map win rate, recent results and head-to-head, event
        form, your veto, strat and buy strategy, and mental. Favourites win more often; upsets happen.
      </p>
      <p className="small mut" style={{ marginTop: 8 }}>
        <b style={{ color: "#fff" }}>Data:</b> HLTV snapshot, 22 Nov 2026 —{" "}
        <a
          href="https://www.hltv.org/events/8302/pgl-major-singapore-2026"
          target="_blank"
          rel="noopener"
          style={LINK_STYLE}
        >
          teams, rosters and VRS
        </a>
        ,{" "}
        <a
          href="https://www.hltv.org/stats/players?startDate=2026-08-22&endDate=2026-11-22"
          target="_blank"
          rel="noopener"
          style={LINK_STYLE}
        >
          Rating 3.0 (22 Aug – 22 Nov)
        </a>
        , map win rates and results. — = map not played in the window, so it counts as a permaban. The Major
        hasn&apos;t started, so every result here is simulated.
      </p>
    </div>
  );
}
