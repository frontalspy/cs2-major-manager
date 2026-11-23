import { makeStage, matchFormat, pairings } from "./swiss";

const ids = Array.from({ length: 16 }, (_, i) => i);

describe("swiss", () => {
  it("pairs round 1 as seed n vs seed n+8", () => {
    const pairs = pairings(makeStage(1, ids));
    expect(pairs).toHaveLength(8);
    expect(pairs[0]).toEqual([0, 8]);
    expect(pairs[7]).toEqual([7, 15]);
  });

  it("pairs later rounds inside the same W–L group without rematches", () => {
    const st = makeStage(1, ids);
    pairings(st).forEach(([a, b]) => {
      st.rec[a].w++;
      st.rec[b].l++;
      st.rec[a].opp.push(b);
      st.rec[b].opp.push(a);
    });
    st.round = 1;
    const pairs = pairings(st);
    expect(pairs).toHaveLength(8);
    for (const [a, b] of pairs) {
      expect(`${st.rec[a].w}-${st.rec[a].l}`).toBe(`${st.rec[b].w}-${st.rec[b].l}`);
      expect(st.rec[a].opp).not.toContain(b);
    }
  });

  it("uses Bo3 for decider matches and all of stage 3, Bo1 otherwise", () => {
    const st = makeStage(1, ids);
    expect(matchFormat(st, 0, 1)).toBe("Bo1");
    st.rec[0].w = 2;
    expect(matchFormat(st, 0, 1)).toBe("Bo3");
    expect(matchFormat(makeStage(3, ids), 0, 1)).toBe("Bo3");
  });
});
