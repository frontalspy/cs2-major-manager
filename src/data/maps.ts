import type { Emblem } from "../types";

// Emblems for custom teams. The original static build inlined these as
// base64 data URIs; here they are real files under public/assets/emblems/.
export const CUSTOM_EMBLEMS: Emblem[] = [
  { src: "assets/emblems/emblem-shield.png", name: "Gold Shield" },
  { src: "assets/emblems/emblem-wings.png", name: "CT Wings" },
  { src: "assets/emblems/emblem-fang.png", name: "Fang" },
];

export const CUSTOM_ROLES = ["IGL", "AWP", "Rifler", "Entry", "Lurker", "Support", "AWP / IGL"] as const;

export const TALK_DEFS = {
  confidence: {
    label: "Confidence 1-on-1",
    chance: 0.7,
    up: [8, 14] as const,
    boost: 0.03,
    down: 6,
    bdown: 0.01,
  },
  fire: { label: "Fire-up speech", chance: 0.6, up: [12, 20] as const, boost: 0.06, down: 12, bdown: 0.03 },
  calm: { label: "Calm & reset", chance: 0.82, up: [5, 9] as const, boost: 0.02, down: 4, bdown: 0 },
  hard: { label: "Hard truth", chance: 0.5, up: [14, 18] as const, boost: 0.08, down: 16, bdown: 0.05 },
} as const;

export type TalkKind = keyof typeof TALK_DEFS;
