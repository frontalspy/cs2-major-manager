import type { Stage } from "../types";

export function makeStage(num: number, ids: number[]): Stage {
  const st: Stage = { num, ids: [...ids], rec: {}, round: 0, done: false, qual: [], elim: [], history: [] };
  st.ids.forEach((id) => (st.rec[id] = { w: 0, l: 0, opp: [] }));
  return st;
}

export function pairings(st: Stage): [number, number][] {
  const active = st.ids.filter((id) => st.rec[id] && st.rec[id].w < 3 && st.rec[id].l < 3);
  const pairs: [number, number][] = [];
  if (st.round === 0) {
    // Round 1: top seed vs the seed eight places below (1v9, 2v10, …)
    const seeded = st.ids.filter((id) => active.includes(id));
    for (let i = 0; i + 8 < seeded.length; i++) pairs.push([seeded[i], seeded[i + 8]]);
    return pairs;
  }
  // Later rounds: pair inside each W–L record group, best seed first,
  // avoiding rematches where possible.
  const groups: Record<string, number[]> = {};
  active.forEach((id) => {
    const k = st.rec[id].w + "-" + st.rec[id].l;
    (groups[k] = groups[k] || []).push(id);
  });
  Object.values(groups).forEach((g) => {
    const used = new Set<number>();
    for (let i = 0; i < g.length; i++) {
      const a = g[i];
      if (used.has(a)) continue;
      const rest = g.filter((x) => x !== a && !used.has(x));
      const opp = rest.find((x) => !st.rec[a].opp.includes(x)) || rest[0];
      if (!opp) continue;
      used.add(a);
      used.add(opp);
      pairs.push([a, opp]);
    }
  });
  return pairs;
}

// Major Swiss format rule: Stage 3 is all Bo3. In Stages 1–2 a match is
// Bo3 only when it decides advancement or elimination (either team on
// 2 wins or 2 losses); everything else is Bo1.
export function matchFormat(st: Stage, aId: number, bId: number): string {
  if (st.num === 3) return "Bo3";
  const ra = st.rec[aId];
  const rb = st.rec[bId];
  const deciding = (ra && (ra.w === 2 || ra.l === 2)) || (rb && (rb.w === 2 || rb.l === 2));
  return deciding ? "Bo3" : "Bo1";
}
