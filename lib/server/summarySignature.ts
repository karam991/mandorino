import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signatur für die KI-/Template-Zusammenfassung.
 *
 * Problem: Der Client schickt die Zusammenfassung beim Absenden zurück an
 * /api/leads. Ohne Schutz könnte ein Besucher dort beliebigen Text einschleusen,
 * der im Dashboard als „KI-Zusammenfassung" erscheint.
 *
 * Lösung: /api/summarize signiert (source, ts, summary) mit einem Server-Secret.
 * /api/leads übernimmt die Client-Zusammenfassung nur, wenn die Signatur passt
 * und nicht zu alt ist; sonst baut der Server selbst die Template-Zusammenfassung.
 *
 * Ohne `MANDORINO_SIGNING_SECRET` wird nie signiert → der Server verwirft
 * Client-Zusammenfassungen grundsätzlich (sicherer Default).
 */

export type SummarySource = "claude" | "template";

const MAX_AGE_MS = 2 * 60 * 60 * 1000; // Mandanten brauchen Zeit zum Prüfen

function secret(): string | null {
  return process.env.MANDORINO_SIGNING_SECRET || null;
}

function mac(key: string, source: SummarySource, ts: number, summary: string): Buffer {
  return createHmac("sha256", key).update(`${source}\n${ts}\n${summary}`).digest();
}

export function signSummary(
  summary: string,
  source: SummarySource,
): { ts: number; sig: string } | null {
  const key = secret();
  if (!key) return null;
  const ts = Date.now();
  return { ts, sig: mac(key, source, ts, summary).toString("base64url") };
}

export function verifySummary(
  summary: string,
  source: SummarySource,
  proof: unknown,
): boolean {
  const key = secret();
  if (!key || typeof proof !== "object" || proof === null) return false;
  const { ts, sig } = proof as { ts?: unknown; sig?: unknown };
  if (typeof ts !== "number" || typeof sig !== "string") return false;
  const age = Date.now() - ts;
  if (age < 0 || age > MAX_AGE_MS) return false;
  const expected = mac(key, source, ts, summary);
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}
