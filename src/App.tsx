import type { ComponentType } from "react";
import { ThemePicker } from "./components/ThemePicker";
import { useStore } from "./hooks/useGame";
import { useTheme } from "./hooks/useTheme";
import BracketPage from "./pages/BracketPage";
import BuilderPage from "./pages/BuilderPage";
import DashboardPage from "./pages/DashboardPage";
import MatchPage from "./pages/MatchPage";
import RecapPage from "./pages/RecapPage";
import SquadPage from "./pages/SquadPage";
import TeamsPage from "./pages/TeamsPage";
import type { ViewId } from "./types";

const ROUTES: { id: ViewId; label: string; Page: ComponentType }[] = [
  { id: "dash", label: "Dashboard", Page: DashboardPage },
  { id: "teams", label: "Teams", Page: TeamsPage },
  { id: "builder", label: "Custom Team", Page: BuilderPage },
  { id: "bracket", label: "Bracket", Page: BracketPage },
  { id: "match", label: "Match Centre", Page: MatchPage },
  { id: "squad", label: "Squad & Mental", Page: SquadPage },
  { id: "recap", label: "Recap", Page: RecapPage },
];

export default function App() {
  const store = useStore();
  const [theme, setTheme] = useTheme();
  const active = ROUTES.find((r) => r.id === store.view) ?? ROUTES[0];

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="top">
        <div className="topin">
          <div className="logo">
            CS2 <b>MAJOR</b> SIMULATOR
            <small>PGL Major · Singapore 2026</small>
          </div>
          <button
            className={`hamb ${store.menuOpen ? "open" : ""}`}
            type="button"
            aria-label={store.menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={store.menuOpen}
            aria-controls="mainNav"
            onClick={() => store.toggleMenu()}
          >
            <span />
            <span />
            <span />
          </button>
          <nav id="mainNav" aria-label="Main" className={store.menuOpen ? "open" : ""}>
            {ROUTES.map((r) => (
              <a
                key={r.id}
                className={`navbtn ${active.id === r.id ? "on" : ""}`}
                href={`#/${r.id}`}
                aria-current={active.id === r.id ? "page" : undefined}
                onClick={() => store.toggleMenu(false)}
              >
                {r.label}
              </a>
            ))}
          </nav>
          <ThemePicker theme={theme} onChange={setTheme} />
        </div>
      </header>

      <main id="main" className="wrap" tabIndex={-1}>
        <active.Page />
      </main>
    </>
  );
}
