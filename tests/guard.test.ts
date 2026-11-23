import { describe, expect, it } from "vitest";

import { clientIp, rateLimit } from "@/lib/server/guard";

const req = (h: Record<string, string>) => new Request("http://x.test", { headers: h });

describe("clientIp", () => {
  it("bevorzugt Plattform-Header", () => {
    expect(clientIp(req({ "x-vercel-forwarded-for": "1.1.1.1", "x-forwarded-for": "9.9.9.9" }))).toBe("1.1.1.1");
    expect(clientIp(req({ "x-real-ip": "2.2.2.2" }))).toBe("2.2.2.2");
  });
  it("nimmt rechtesten XFF-Eintrag (links ist fälschbar)", () => {
    expect(clientIp(req({ "x-forwarded-for": "6.6.6.6, 3.3.3.3" }))).toBe("3.3.3.3");
  });
  it("fällt auf unknown zurück", () => {
    expect(clientIp(req({}))).toBe("unknown");
  });
});

describe("rateLimit", () => {
  it("blockt nach dem Limit, getrennt nach Scope und IP", () => {
    const a = req({ "x-real-ip": "10.0.0.1" });
    const b = req({ "x-real-ip": "10.0.0.2" });
    expect([1, 2, 3].map(() => rateLimit(a, "t1", 2, 60_000))).toEqual([true, true, false]);
    expect(rateLimit(b, "t1", 2, 60_000)).toBe(true);
    expect(rateLimit(a, "t2", 2, 60_000)).toBe(true);
  });
});
