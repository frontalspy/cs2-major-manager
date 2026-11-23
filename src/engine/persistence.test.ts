import { playMap, veto } from "./matchCentre";
import { attachPersistence, restore, SAVE_KEY, serialize } from "./persistence";
import { GameStore } from "./store";

function playToMatch(g: GameStore): void {
  g.myId = 20;
  g.playNext();
  expect(g.currentMatch).not.toBeNull();
}

function playOutMatch(g: GameStore): void {
  while (g.currentMatch && !g.currentMatch.mapList) veto(g, g.currentMatch.pool[0]);
  while (g.currentMatch && !g.currentMatch.done) playMap(g);
}

describe("persistence", () => {
  it("round-trips a run mid-match and re-links object references", () => {
    const a = new GameStore();
    playToMatch(a);
    while (a.currentMatch && !a.currentMatch.mapList) veto(a, a.currentMatch.pool[0]);
    playMap(a);

    const b = new GameStore();
    expect(restore(b, serialize(a))).toBe(true);
    expect(b.myId).toBe(20);
    expect(b.currentMatch?.stage).toBe(b.stages[0]);
    expect(b.currentMatch?.maps).toHaveLength(1);
    expect(b.teams).toContain(b.currentMatch?.maps[0].winner);
    expect(b.logLines).toEqual(a.logLines);
  });

  it("resumes a restored match to completion and keeps the playoff slot linked", () => {
    const a = new GameStore();
    a.quickSim();
    expect(a.champion).not.toBeNull();
    const b = new GameStore();
    expect(restore(b, serialize(a))).toBe(true);
    expect(b.champion).toBe(b.teams.find((t) => t.id === a.champion?.id));

    const c = new GameStore();
    playToMatch(c);
    const d = new GameStore();
    restore(d, serialize(c));
    playOutMatch(d);
    expect(d.currentMatch?.done).toBe(true);
    expect(d.myRun).toHaveLength(1);
  });

  it("rejects corrupt or outdated saves without touching the store", () => {
    const g = new GameStore();
    const before = g.teams;
    expect(restore(g, "not json")).toBe(false);
    expect(restore(g, JSON.stringify({ v: 999 }))).toBe(false);
    expect(restore(g, JSON.stringify({ v: 5, teams: [] }))).toBe(false);
    expect(g.teams).toBe(before);
  });

  it("discards an invalid stored save and saves after updates", () => {
    vi.useFakeTimers();
    localStorage.setItem(SAVE_KEY, "garbage");
    const g = new GameStore();
    attachPersistence(g, localStorage);
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    g.pickTeam(3);
    vi.advanceTimersByTime(400);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "{}").myId).toBe(3);
    vi.useRealTimers();
  });
});

describe("stale saves", () => {
  it("rejects a save made against different team data", () => {
    const g = new GameStore();
    const stale = JSON.parse(serialize(g));
    stale.data = "old-data";
    expect(restore(new GameStore(), JSON.stringify(stale))).toBe(false);
    expect(restore(new GameStore(), serialize(g))).toBe(true);
  });
});
