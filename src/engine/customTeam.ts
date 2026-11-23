import { CUSTOM_EMBLEMS } from "../data/maps";
import { MAPS } from "../data/teams";
import type { CustomPlayer, PlayerState, Team } from "../types";
import type { GameStore } from "./store";
import { clampRate } from "./teams";

// Custom-team creation: player pool, picks, emblem, map win rates. Map rates
// are locked once a team is created (there is no post-creation setter).

export function getAllPlayers(game: GameStore): (PlayerState | CustomPlayer)[] {
  const all: (PlayerState | CustomPlayer)[] = [];
  game.customPlayers.forEach((pl) =>
    all.push({ ...pl, team: "Custom", tag: "CSTM" } as PlayerState & { team: string })
  );
  game.teams.forEach((t) =>
    t.players.forEach((p) => all.push({ ...p, team: t.name, tag: t.tag } as PlayerState & { team: string }))
  );
  all.sort((a, b) => b.rating - a.rating);
  return all as (PlayerState | CustomPlayer)[];
}

export function togglePick(game: GameStore, name: string): void {
  const all = getAllPlayers(game);
  const p = all.find((x) => x.name === name);
  const i = game.customPicks.findIndex((x) => x.name === name);
  if (i >= 0) game.customPicks.splice(i, 1);
  else {
    if (game.customPicks.length >= 5 || !p) {
      game.notify();
      return;
    }
    game.customPicks.push(p);
  }
  game.notify();
}

export function pickLogo(game: GameStore, i: number): void {
  game.customLogoIdx = i;
  game.notify();
}

export function getCustomMapRates(game: GameStore): Record<string, number> {
  if (!game.customMapsTouched) {
    const avg = game.customPicks.length
      ? game.customPicks.reduce((a, p) => a + p.rating, 0) / game.customPicks.length
      : 1.05;
    MAPS.forEach((m, i) => {
      game.customMapRates[m] = Math.max(5, Math.min(95, Math.round(42 + (avg - 1) * 55 + ((i * 11) % 14))));
    });
  }
  return { ...game.customMapRates };
}

export function setCustomMapRate(game: GameStore, map: string, val: number | string): void {
  game.customMapsTouched = true;
  game.customMapRates[map] = clampRate(val);
  game.notify();
}

export function presetCustomMapRates(game: GameStore, v: number): void {
  game.customMapsTouched = true;
  MAPS.forEach((m) => (game.customMapRates[m] = clampRate(v)));
  game.notify();
}

export function resetCustomMapRates(game: GameStore): void {
  game.customMapsTouched = false;
  game.notify();
}

export function addCustomPlayer(game: GameStore, name: string, rating: number, role: string): string | null {
  const clean = (name || "").trim();
  if (!clean) {
    game.alertBox("Enter a player name for your custom player.");
    return "Enter a player name for your custom player.";
  }
  if (isNaN(rating) || rating < 0.7 || rating > 1.6) {
    game.alertBox("Rating must be between 0.70 and 1.60.");
    return "Rating must be between 0.70 and 1.60.";
  }
  if (
    game.customPlayers.some((x) => x.name.toLowerCase() === clean.toLowerCase()) ||
    game.teams.some((t) => t.players.some((x) => x.name.toLowerCase() === clean.toLowerCase()))
  ) {
    game.alertBox("That name already exists — pick a unique name.");
    return "That name already exists — pick a unique name.";
  }
  const pl: CustomPlayer = {
    name: clean,
    rating: +rating.toFixed(2),
    role,
    team: "Custom",
    tag: "CSTM",
    isCustomPlayer: true,
    mental: 72 + Math.floor(Math.random() * 14),
    hist: [],
    boost: 0,
    lastTalk: "",
    tourneyMaps: 0,
  };
  game.customPlayers.push(pl);
  game.logLines.push(`Custom player created: ${clean} (${role}, ${pl.rating.toFixed(2)}).`);
  game.notify();
  return null;
}

export function removeCustomPlayer(game: GameStore, name: string): void {
  game.customPlayers = game.customPlayers.filter((x) => x.name !== name);
  game.customPicks = game.customPicks.filter((x) => x.name !== name);
  game.notify();
}

export function createCustom(game: GameStore, name: string, tag: string): string | null {
  if (game.customPicks.length !== 5) {
    game.alertBox("Pick exactly 5 players first.");
    return "Pick exactly 5 players first.";
  }
  const teamName = name || "Custom Team";
  const teamTag = (tag || "CSTM").toUpperCase();
  const avg = game.customPicks.reduce((a, p) => a + p.rating, 0) / 5;
  const rates = getCustomMapRates(game);
  const nt: Team = {
    id: 31,
    name: teamName,
    tag: teamTag,
    region: "INT",
    vrs: 990,
    coach: "Head Coach",
    isCustom: true,
    beatHigher: 0,
    players: game.customPicks.map((p) => ({
      name: p.name,
      rating: p.rating,
      role: p.role,
      est: (p as PlayerState).est,
      isCustomPlayer: !!(p as CustomPlayer).isCustomPlayer,
      mental: p.mental !== undefined ? p.mental : 74,
      hist: p.hist ? [...p.hist] : [],
      boost: 0,
      lastTalk: "",
      tourneyMaps: 0,
    })),
    style: "default",
    avg: +avg.toFixed(3),
    maps: {},
    mapCounts: {},
    defaultMaps: {},
    form: 0,
    wins: 0,
    losses: 0,
    logo: CUSTOM_EMBLEMS[game.customLogoIdx].src,
    recent: [],
  };
  MAPS.forEach((m) => {
    nt.maps[m] = clampRate(rates[m]);
    nt.mapCounts[m] = 0;
  });
  nt.defaultMaps = { ...nt.maps };
  game.teams[31] = nt;
  game.myId = nt.id;
  game.logLines.push(
    "Custom team " +
      teamName +
      " created with your map win rates: " +
      MAPS.map((m) => m + " " + nt.maps[m] + "%").join(", ") +
      ". These rates are now locked for the tournament."
  );
  game.initTourney();
  game.notify();
  game.show("dash");
  return null;
}
