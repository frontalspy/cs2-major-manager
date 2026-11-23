import { scoutTeam } from "./scout";
import { playedMaps, rateTxtN } from "./sim";
import { freshTeams } from "./teams";

describe("scoutTeam", () => {
  it("names the best and weakest player by rating", () => {
    const team = freshTeams()[0];
    const r = scoutTeam(team);
    const ratings = team.players.map((p) => p.rating);
    expect(r.best.rating).toBe(Math.max(...ratings));
    expect(r.weakest.rating).toBe(Math.min(...ratings));
  });

  it("labels form from the last five results", () => {
    const team = freshTeams()[0];
    const res = (won: boolean) => ({ date: "2026-11-01", opp: "X", won, score: "2–0", event: "E" });
    team.recent = [res(true), res(true), res(true), res(true), res(false)];
    expect(scoutTeam(team).formLabel).toBe("On a roll");
    team.recent = [];
    expect(scoutTeam(team).formLabel).toBe("No recent results");
  });
});

describe("map rates in the veto", () => {
  it("shows a custom team's own win rate instead of 0 maps", () => {
    const team = freshTeams()[0];
    team.isCustom = true;
    team.maps.Mirage = 64;
    team.mapCounts.Mirage = 0;
    expect(rateTxtN(team, "Mirage")).toBe("64%");
    expect(playedMaps(team)).toContain("Mirage");
  });
});
