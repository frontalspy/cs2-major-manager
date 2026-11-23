import { GameStore } from "./store";

// Guards against ratings (inflated for teams facing weaker opposition)
// letting a low-ranked team like FlyQuest win the Major regularly.
describe("tournament balance", () => {
  it("is won mostly by the top VRS seeds, seldom by the bottom half", () => {
    const g = new GameStore();
    const runs = 200;
    let topEight = 0;
    let bottomHalf = 0;
    let flyQuest = 0;
    const byVrs = [...g.teams].sort((a, b) => b.vrs - a.vrs).map((t) => t.name);
    for (let i = 0; i < runs; i++) {
      g.quickSim();
      const rank = byVrs.indexOf(g.champion?.name ?? "");
      if (rank >= 0 && rank < 8) topEight++;
      if (rank >= 16) bottomHalf++;
      if (g.champion?.name === "FlyQuest") flyQuest++;
      g.resetAll();
    }
    expect(topEight / runs).toBeGreaterThan(0.55);
    expect(bottomHalf / runs).toBeLessThan(0.25);
    expect(flyQuest / runs).toBeLessThan(0.05);
  });
});
