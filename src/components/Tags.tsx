// Small colour-coded labels, so formats, roles and regions can be told apart at a glance.

const FORMAT_TONE: Record<string, string> = { Bo1: "ct", Bo3: "t", Bo5: "pur" };

export function FormatPill({ format }: { format: string }) {
  return <span className={`pill ${FORMAT_TONE[format] ?? ""}`}>{format}</span>;
}

const ROLE_TONE: Record<string, string> = {
  IGL: "gold",
  AWP: "red",
  "AWP / IGL": "red",
  Entry: "orange",
  Lurker: "pur",
  Rifler: "blue",
  Support: "teal",
};

export function RoleTag({ role }: { role: string }) {
  return <span className={`role tone-${ROLE_TONE[role] ?? "mut"}`}>{role}</span>;
}

const REGION_TONE: Record<string, string> = { EU: "ct", AM: "t", AS: "teal", INT: "pur" };

export function RegionPill({ region }: { region: string }) {
  return <span className={`pill ${REGION_TONE[region] ?? ""}`}>{region}</span>;
}

// Per-map colours used for map names and cards.
export const MAP_TONE: Record<string, string> = {
  Cache: "blue",
  Dust2: "gold",
  Mirage: "orange",
  Inferno: "red",
  Nuke: "teal",
  Ancient: "green",
  Anubis: "pur",
};
