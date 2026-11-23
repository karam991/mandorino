import { randomUUID } from "node:crypto";

import { getPracticeArea } from "@/lib/areas/registry";
import { verifySummary } from "@/lib/server/summarySignature";
import { TENANT } from "@/lib/tenant.config";
import { buildTemplateSummary } from "@/lib/templateSummary";
import {
  CLAIM_VALUE_BUCKETS,
  CLIENT_TYPES,
  INSURANCE_STATUS,
  URGENCIES,
  type ClaimValueBucket,
  type ClientType,
  type InsuranceInfo,
  type Lead,
  type LeadDraft,
  type Urgency,
} from "@/lib/types";

/**
 * Server-seitige Validierung + Aufbau eines Leads aus dem Besucher-Payload.
 *
 * Vertrauensgrenze: Der Client darf nur *Mandantenangaben* liefern. Alles, was
 * Workflow oder Audit betrifft (id, createdAt, status, assignedToUserId, history,
 * priority, areaLabel) wird hier neu erzeugt und Client-Werte werden ignoriert.
 */

export type ParseResult = { ok: true; lead: Lead } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KEY_RE = /^[A-Za-z0-9_]{1,50}$/;

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Pflicht-String: getrimmt, 1..max Zeichen. */
function reqStr(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length >= 1 && t.length <= max ? t : null;
}

/** Optionaler String: undefined wenn leer, null wenn ungültig (zu lang / falscher Typ). */
function optStr(v: unknown, max: number): string | undefined | null {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (t.length > max) return null;
  return t || undefined;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}

/** areaData: nur flache Primitive / String-Listen, begrenzte Größe — Rest wird verworfen. */
function sanitizeAreaData(v: unknown): Record<string, unknown> {
  if (!isObj(v)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v).slice(0, 40)) {
    if (!KEY_RE.test(k)) continue;
    if (typeof val === "string") {
      out[k] = val.slice(0, 2000);
    } else if (typeof val === "number" && Number.isFinite(val)) {
      out[k] = val;
    } else if (typeof val === "boolean") {
      out[k] = val;
    } else if (Array.isArray(val)) {
      out[k] = val
        .filter((x): x is string => typeof x === "string")
        .slice(0, 30)
        .map((x) => x.slice(0, 200));
    }
  }
  return out;
}

export function parseLeadInput(raw: unknown): ParseResult {
  const body = isObj(raw) ? raw : null;
  const src = body && isObj(body.lead) ? body.lead : null;
  if (!src) return { ok: false, error: "Ungültiger Lead." };

  // --- Rechtsgebiet: muss beim Tenant aktiv sein; Label kommt vom Server ---
  const areaId = reqStr(src.areaId, 50);
  const area = areaId ? getPracticeArea(areaId) : null;
  if (!areaId || !area || !(TENANT.practiceAreas as string[]).includes(areaId)) {
    return { ok: false, error: "Ungültiges Rechtsgebiet." };
  }

  const urgency = oneOf<Urgency>(src.urgency, URGENCIES);
  if (!urgency) return { ok: false, error: "Ungültige Dringlichkeit." };

  const clientType: ClientType = oneOf<ClientType>(src.clientType, CLIENT_TYPES) ?? "private";

  // --- Kontakt ---
  const c = isObj(src.contact) ? src.contact : null;
  const firstName = c ? reqStr(c.firstName, 100) : null;
  const lastName = c ? reqStr(c.lastName, 100) : null;
  const email = c ? reqStr(c.email, 254) : null;
  const phone = c ? reqStr(c.phone, 40) : null;
  const postalCode = c ? reqStr(c.postalCode, 12) : null;
  if (!firstName || !lastName || !email || !phone || !postalCode || !EMAIL_RE.test(email)) {
    return { ok: false, error: "Kontaktdaten unvollständig oder ungültig." };
  }

  let business: Lead["contact"]["business"];
  if (clientType === "business") {
    const b = c && isObj(c.business) ? c.business : null;
    const companyName = b ? reqStr(b.companyName, 200) : null;
    const contactPosition = b ? optStr(b.contactPosition, 100) : undefined;
    const vatId = b ? optStr(b.vatId, 30) : undefined;
    if (!companyName || contactPosition === null || vatId === null) {
      return { ok: false, error: "Firmenangaben unvollständig oder ungültig." };
    }
    business = { companyName, contactPosition, vatId };
  }

  // --- Optionale Angaben ---
  const userNotes = optStr(src.userNotes, 5000);
  if (userNotes === null) return { ok: false, error: "Anmerkungen zu lang." };

  let insurance: InsuranceInfo | undefined;
  if (src.insurance !== undefined && src.insurance !== null) {
    const ins = isObj(src.insurance) ? src.insurance : null;
    const status = ins ? oneOf(ins.status, INSURANCE_STATUS) : null;
    const provider = ins ? optStr(ins.provider, 100) : undefined;
    if (!status || provider === null) return { ok: false, error: "Ungültige Versicherungsangabe." };
    insurance = { status, ...(provider ? { provider } : {}) };
  }

  let claimValue: ClaimValueBucket | undefined;
  if (src.claimValue !== undefined && src.claimValue !== null) {
    const cv = oneOf<ClaimValueBucket>(src.claimValue, CLAIM_VALUE_BUCKETS);
    if (!cv) return { ok: false, error: "Ungültiger Streitwert." };
    claimValue = cv;
  }

  // --- DSGVO-Einwilligung ist Pflicht ---
  // (Lead-Objekte tragen das Feld nicht; der Client sendet es auf Body-Ebene mit.)
  if (body?.consentGiven !== true) {
    return { ok: false, error: "Einwilligung fehlt." };
  }

  const areaData = sanitizeAreaData(src.areaData);

  const draft: LeadDraft = {
    clientType,
    areaId,
    areaLabel: area.label,
    areaData,
    urgency,
    userNotes,
    insurance,
    claimValue,
    firstName,
    lastName,
    email,
    phone,
    postalCode,
    consentGiven: true,
  };

  // Zusammenfassung: nur übernehmen, wenn /api/summarize sie signiert hat.
  // Sonst (fehlende/ungültige Signatur, abgelaufen, kein Secret) baut der Server
  // selbst die neutrale Template-Zusammenfassung — Client-Text wird nie vertraut.
  const clientSummary = optStr(src.aiSummary, 4000);
  const clientSource = oneOf(src.aiSummarySource, ["claude", "template"] as const);
  let aiSummary: string;
  let aiSummarySource: "claude" | "template";
  if (clientSummary && clientSource && verifySummary(clientSummary, clientSource, body?.summaryProof)) {
    aiSummary = clientSummary;
    aiSummarySource = clientSource;
  } else {
    aiSummary = buildTemplateSummary(draft);
    aiSummarySource = "template";
  }

  const now = new Date().toISOString();
  const lead: Lead = {
    id: randomUUID(),
    createdAt: now,
    clientType,
    areaId,
    areaLabel: area.label,
    areaData,
    urgency,
    userNotes,
    insurance,
    claimValue,
    aiSummary,
    aiSummarySource,
    contact: { firstName, lastName, email, phone, postalCode, ...(business ? { business } : {}) },
    status: "neu",
    history: [
      {
        at: now,
        byUserId: "system",
        byUserName: "System",
        type: "created",
        message: `Lead erstellt (${area.label})`,
      },
    ],
    priority: area.scorePriority(draft),
  };

  return { ok: true, lead };
}
