import { describe, expect, it } from "vitest";

import { brandTokens, contrast } from "@/app/brandTokens";

/** [Name, Primär, Akzent] */
const PAIRS = [
  ["Navy + Gold (Demo)", "#13315C", "#C9A86A"],
  ["Dunkelgrün + Kupfer", "#1F4D3A", "#B87333"],
  ["Bordeaux + Sand", "#5A1A2B", "#D9C3A0"],
  ["Anthrazit + Rot", "#222629", "#B23A48"],
] as const;

describe("brandTokens", () => {
  it.each(PAIRS)("%s: Akzent-Schrift ist lesbar (WCAG AA)", (_name, primary, accent) => {
    const t = brandTokens(primary, accent);
    expect(contrast(t["--on-accent"], accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t["--accent-on-brand"], primary)).toBeGreaterThanOrEqual(4.5);
  });

  it("lässt die Demo-Farben unverändert", () => {
    const t = brandTokens("#13315C", "#C9A86A");
    expect(t["--on-accent"]).toBe("#13315C");
    expect(t["--accent-on-brand"]).toBe("#C9A86A");
  });
});
