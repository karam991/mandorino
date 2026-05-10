import type { LeadDraft } from "../types";
import type { PriorityResult, PrioritySignal } from "./types";

/** Liest typsichere Werte aus areaData. */
export function getStr(draft: LeadDraft, key: string): string | undefined {
  const v = draft.areaData[key];
  return typeof v === "string" ? v : undefined;
}

export function getStrArr(draft: LeadDraft, key: string): string[] {
  const v = draft.areaData[key];
  return Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : [];
}

/** Hilfs-Builder für ein PriorityResult. */
export function buildPriority(
  numeric: number,
  signals: PrioritySignal[],
  range?: { min: number; max: number; label: string },
): PriorityResult {
  const tier: PriorityResult["tier"] =
    numeric >= 70 ? "high" : numeric >= 40 ? "medium" : "low";
  return { tier, numeric, signals, estimatedValueRange: range };
}

/** Score-Beitrag aus der Mandanten-Dringlichkeit. Konsistent in allen Areas. */
export function urgencyPoints(draft: LeadDraft): { points: number; signal?: PrioritySignal } {
  switch (draft.urgency) {
    case "So schnell wie möglich":
      return {
        points: 25,
        signal: { kind: "dringlichkeit", label: "Mandant: höchste Dringlichkeit" },
      };
    case "Innerhalb dieser Woche":
      return {
        points: 15,
        signal: { kind: "dringlichkeit", label: "Mandant: diese Woche" },
      };
    case "Innerhalb dieses Monats":
      return { points: 5 };
    default:
      return { points: 0 };
  }
}

/**
 * Score-Beitrag aus Rechtsschutz-Versicherung (Selbstauskunft Mandant).
 * „Ja" → klarer Boost (zahlende Mandate sind operativ einfacher).
 * „Nein"/„Weiß ich nicht" → kein Punktabzug, weil sich das Anliegen
 * trotzdem lohnen kann (Streitwert hoch, Pflichtverteidigung etc.).
 */
export function insurancePoints(draft: LeadDraft): {
  points: number;
  signal?: PrioritySignal;
} {
  if (!draft.insurance) return { points: 0 };
  if (draft.insurance.status === "Ja") {
    const provider = draft.insurance.provider?.trim();
    return {
      points: 12,
      signal: {
        kind: "fit",
        label: provider
          ? `Rechtsschutz vorhanden (${provider}, Mandantenangabe)`
          : "Rechtsschutz vorhanden (Mandantenangabe)",
      },
    };
  }
  return { points: 0 };
}

/**
 * Score-Beitrag aus Streitwert-Bucket (Selbstauskunft Mandant).
 * Höherer Streitwert → höhere wirtschaftliche Bedeutung für die Kanzlei.
 * Bewusst gestuft — Mandanten schätzen oft falsch, daher konservativ.
 */
export function claimValuePoints(draft: LeadDraft): {
  points: number;
  signal?: PrioritySignal;
} {
  switch (draft.claimValue) {
    case "Über 50.000 €":
      return {
        points: 18,
        signal: { kind: "streitwert", label: "Streitwert > 50.000 € (Mandantenschätzung)" },
      };
    case "10.000 € – 50.000 €":
      return {
        points: 12,
        signal: { kind: "streitwert", label: "Streitwert 10–50 T€ (Mandantenschätzung)" },
      };
    case "2.000 € – 10.000 €":
      return { points: 5 };
    case "Unter 2.000 €":
    case "Weiß ich nicht":
    default:
      return { points: 0 };
  }
}

/** Score-Beitrag aus Dokumenten-Vollständigkeit. */
export function documentsPoints(
  documents: string[],
  expected: number,
): { points: number; signal?: PrioritySignal } {
  if (documents.length === 0) return { points: 0 };
  const ratio = Math.min(1, documents.length / Math.max(1, expected));
  const points = Math.round(ratio * 20);
  if (ratio >= 0.66) {
    return {
      points,
      signal: {
        kind: "vollstaendigkeit",
        label: `Dokumente weitgehend vorhanden (${documents.length})`,
      },
    };
  }
  return { points };
}
