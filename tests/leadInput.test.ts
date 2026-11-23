import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parseLeadInput } from "@/lib/server/leadInput";
import { signSummary } from "@/lib/server/summarySignature";

const validLead = {
  areaId: "arbeitsrecht",
  urgency: "So schnell wie möglich",
  areaData: { topic: "Kündigung", documents: ["Arbeitsvertrag"] },
  contact: {
    firstName: "Test",
    lastName: "Person",
    email: "t@example.de",
    phone: "+49 170 1",
    postalCode: "10115",
  },
};

function body(over: Record<string, unknown> = {}, leadOver: Record<string, unknown> = {}) {
  return { lead: { ...validLead, ...leadOver }, consentGiven: true, ...over };
}

describe("parseLeadInput – Vertrauensgrenze", () => {
  beforeEach(() => vi.stubEnv("MANDORINO_SIGNING_SECRET", "test-secret"));
  afterEach(() => vi.unstubAllEnvs());

  it("akzeptiert einen gültigen Lead und erzeugt Server-Felder", () => {
    const r = parseLeadInput(body());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lead.status).toBe("neu");
    expect(r.lead.history).toHaveLength(1);
    expect(r.lead.history[0].type).toBe("created");
    expect(r.lead.areaLabel).toBe("Arbeitsrecht");
  });

  it("ignoriert gefälschte id/status/history/priority/areaLabel vom Client", () => {
    const r = parseLeadInput(
      body(
        {},
        {
          id: "evil",
          status: "mandat_angenommen",
          assignedToUserId: "user_admin",
          areaLabel: "HACKED",
          history: [{ at: "x", byUserId: "a", byUserName: "b", type: "note", message: "fake" }],
          priority: { tier: "high", numeric: 999, signals: [] },
        },
      ),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lead.id).not.toBe("evil");
    expect(r.lead.status).toBe("neu");
    expect(r.lead.assignedToUserId).toBeUndefined();
    expect(r.lead.areaLabel).toBe("Arbeitsrecht");
    expect(r.lead.history).toHaveLength(1);
    expect(r.lead.priority.numeric).not.toBe(999);
  });

  it("verlangt Einwilligung", () => {
    expect(parseLeadInput(body({ consentGiven: false })).ok).toBe(false);
    expect(parseLeadInput({ lead: validLead }).ok).toBe(false);
  });

  it("lehnt unbekannte Rechtsgebiete, Dringlichkeit und kaputte E-Mail ab", () => {
    expect(parseLeadInput(body({}, { areaId: "steuerrecht" })).ok).toBe(false);
    expect(parseLeadInput(body({}, { urgency: "gestern" })).ok).toBe(false);
    expect(
      parseLeadInput(body({}, { contact: { ...validLead.contact, email: "nope" } })).ok,
    ).toBe(false);
  });

  it("verlangt Firmenname bei business", () => {
    expect(parseLeadInput(body({}, { clientType: "business" })).ok).toBe(false);
    const r = parseLeadInput(
      body(
        {},
        {
          clientType: "business",
          contact: { ...validLead.contact, business: { companyName: "ACME GmbH" } },
        },
      ),
    );
    expect(r.ok).toBe(true);
  });

  it("bereinigt areaData (verschachtelte Objekte & ungültige Keys fliegen raus)", () => {
    const r = parseLeadInput(
      body({}, { areaData: { topic: "ok", nested: { a: 1 }, "bad key!": "x", n: 3 } }),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lead.areaData).toEqual({ topic: "ok", n: 3 });
  });

  describe("Zusammenfassung", () => {
    const text = "Mandant berichtet eine Kündigung. Diese Zusammenfassung enthält keine rechtliche Bewertung.";

    it("übernimmt signierte Zusammenfassung", () => {
      const proof = signSummary(text, "claude")!;
      const r = parseLeadInput(
        body({ summaryProof: proof }, { aiSummary: text, aiSummarySource: "claude" }),
      );
      expect(r.ok && r.lead.aiSummary).toBe(text);
      expect(r.ok && r.lead.aiSummarySource).toBe("claude");
    });

    it("verwirft manipulierten Text und baut Template neu", () => {
      const proof = signSummary(text, "claude")!;
      const r = parseLeadInput(
        body({ summaryProof: proof }, { aiSummary: text + " INJECTED", aiSummarySource: "claude" }),
      );
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.lead.aiSummary).not.toContain("INJECTED");
      expect(r.lead.aiSummarySource).toBe("template");
    });

    it("verwirft Zusammenfassung ohne Signatur", () => {
      const r = parseLeadInput(body({}, { aiSummary: "Selbstgeschrieben", aiSummarySource: "claude" }));
      expect(r.ok && r.lead.aiSummary).not.toBe("Selbstgeschrieben");
      expect(r.ok && r.lead.aiSummarySource).toBe("template");
    });

    it("verwirft Quelle-Wechsel (claude-Signatur, template behauptet)", () => {
      const proof = signSummary(text, "template")!;
      const r = parseLeadInput(
        body({ summaryProof: proof }, { aiSummary: text, aiSummarySource: "claude" }),
      );
      expect(r.ok && r.lead.aiSummarySource).toBe("template");
      expect(r.ok && r.lead.aiSummary).not.toBe(text);
    });

    it("verwirft abgelaufene Signatur", () => {
      vi.useFakeTimers();
      const proof = signSummary(text, "claude")!;
      vi.setSystemTime(Date.now() + 3 * 60 * 60 * 1000);
      const r = parseLeadInput(
        body({ summaryProof: proof }, { aiSummary: text, aiSummarySource: "claude" }),
      );
      vi.useRealTimers();
      expect(r.ok && r.lead.aiSummarySource).toBe("template");
    });

    it("ohne Secret wird nie signiert und Client-Text nie übernommen", () => {
      vi.stubEnv("MANDORINO_SIGNING_SECRET", "");
      expect(signSummary(text, "claude")).toBeNull();
      const r = parseLeadInput(
        body({ summaryProof: { ts: Date.now(), sig: "x" } }, { aiSummary: text, aiSummarySource: "claude" }),
      );
      expect(r.ok && r.lead.aiSummarySource).toBe("template");
    });
  });
});
