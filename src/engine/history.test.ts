import { RECENT_RESULTS } from "../data/results";
import { TEAM_DATA } from "../data/teams";
import { addEventResult, headToHead, initialForm } from "./history";
import { winProb } from "./sim";
import { freshTeams } from "./teams";

function pair() {
  const [a, b] = freshTeams();
  a.recent = [];
  b.recent = [];
  return { a, b };
}
const win = (opp: string, date: string) => ({ date, opp, won: true, score: "2–0", event: "E" });

describe("head-to-head", () => {
  it("rewards the recent winner and penalises the loser", () => {
    const { a, b } = pair();
    a.recent = [win(b.name, "2026-11-20")];
    expect(headToHead(a, b)).toBeGreaterThan(0);
    b.recent = [{ ...win(a.name, "2026-11-20"), won: false }];
    expect(headToHead(b, a)).toBeLessThan(0);
  });

  it("fades with age and ignores meetings outside the window", () => {
    const { a, b } = pair();
    a.recent = [win(b.name, "2026-11-22")];
    const fresh = headToHead(a, b);
    a.recent = [win(b.name, "2026-10-10")];
    expect(headToHead(a, b)).toBeLessThan(fresh);
    a.recent = [win(b.name, "2026-07-30")];
    expect(headToHead(a, b)).toBe(0);
  });

  it("is capped, and custom teams are exempt", () => {
    const { a, b } = pair();
    a.recent = Array.from({ length: 6 }, () => win(b.name, "2026-11-23"));
    expect(headToHead(a, b)).toBe(4);
    b.isCustom = true;
    expect(headToHead(a, b)).toBe(0);
  });

  it("moves win probability toward the recent winner", () => {
    const { a, b } = pair();
    const base = winProb(a, b, null, null);
    a.recent = [win(b.name, "2026-11-23")];
    expect(winProb(a, b, null, null)).toBeGreaterThan(base);
  });

  it("records event results for both teams", () => {
    const { a, b } = pair();
    addEventResult(a, b, 2, 1, "Stage 1");
    expect(a.recent[0]).toMatchObject({ opp: b.name, won: true, score: "2–1" });
    expect(b.recent[0]).toMatchObject({ opp: a.name, won: false, score: "1–2" });
  });

  it("keys the recent results by the names of the Major teams", () => {
    const names = new Set(TEAM_DATA.map((t) => t.name));
    for (const key of Object.keys(RECENT_RESULTS)) expect(names.has(key)).toBe(true);
  });
});

describe("initialForm", () => {
  const res = (opp: string, won: boolean) => ({ date: "2026-11-01", opp, won, score: "2–0", event: "E" });

  it("ignores results against teams outside the Major", () => {
    expect(initialForm(1318, [res("Some Cup Team", true), res("Another", true)])).toBe(0);
  });

  it("rewards upsets and punishes losses to lower-ranked teams", () => {
    expect(initialForm(1318, [res("MOUZ", true), res("FURIA", true)])).toBeGreaterThan(0);
    expect(initialForm(1960, [res("Lynn Vision", false), res("FlyQuest", false)])).toBeLessThan(0);
  });
});
