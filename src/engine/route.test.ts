import { parseView } from "./route";

describe("route", () => {
  it("parses hash routes and falls back to the dashboard", () => {
    expect(parseView("#/match")).toBe("match");
    expect(parseView("#recap")).toBe("recap");
    expect(parseView("#/nope")).toBe("dash");
    expect(parseView("")).toBe("dash");
  });
});
