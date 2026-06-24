"use client";

import type { Lead } from "./types";
import { LEAD_STATUS_LABELS } from "./types";

/**
 * Lead-Export-Utilities für CSV (Excel-kompatibel) und JSON (DSGVO-Datenexport).
 *
 * Alles client-seitig: Der Lead ist im Browser-State, wir bauen ein Blob und
 * triggern den klassischen `<a download>`-Klick. Kein API-Roundtrip, kein
 * Server-Auth nötig — wer im Dashboard ist, hat den Lead ohnehin schon.
 *
 * Die PDF-Variante ist eine eigene Druck-Route (`/team/lead/[id]/auskunft`)
 * und wird hier NICHT generiert — Browser-Print spart eine 200-KB-Lib und
 * liefert bessere Typografie als jsPDF/pdfmake.
 */

function downloadBlob(filename: string, content: string, mimeType: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Safari: erst nach dem Click revoken, sonst bricht der Download ab.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** RFC-4180: Quotes verdoppeln, dann komplett quoten. Behandelt auch Zeilenumbrüche. */
function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '""';
  const s = String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("de-DE");
  } catch {
    return iso;
  }
}

/**
 * Stabile Spalten-Reihenfolge — Kunden bauen ggf. Excel-Imports/Pivot-Tabellen
 * darauf. Neue Spalten bitte AM ENDE anhängen, nicht in der Mitte einfügen.
 */
const CSV_COLUMNS = [
  "id",
  "eingegangen",
  "mandantentyp",
  "firma",
  "vorname",
  "nachname",
  "email",
  "telefon",
  "plz",
  "rechtsgebiet",
  "status",
  "prioritaet",
  "dringlichkeit",
  "rechtsschutz",
  "rechtsschutz_versicherer",
  "streitwert_bucket",
  "anliegen_topic",
  "beschreibung",
  "dokumente_genannt",
  "ki_zusammenfassung",
  "interne_notizen",
  "zugewiesen_an",
] as const;

function leadToCsvRow(lead: Lead): string[] {
  const ad = lead.areaData as Record<string, unknown>;
  const docs = Array.isArray(ad.documents) ? (ad.documents as string[]).join("; ") : "";
  const notes = lead.history
    .filter((h) => h.type === "note")
    .map((h) => `[${fmtDate(h.at)} ${h.byUserName}] ${h.message}`)
    .join(" | ");

  return [
    lead.id,
    fmtDate(lead.createdAt),
    lead.clientType,
    lead.contact.business?.companyName ?? "",
    lead.contact.firstName,
    lead.contact.lastName,
    lead.contact.email,
    lead.contact.phone,
    lead.contact.postalCode,
    lead.areaLabel,
    LEAD_STATUS_LABELS[lead.status],
    lead.priority.tier,
    lead.urgency,
    lead.insurance?.status ?? "",
    lead.insurance?.provider ?? "",
    lead.claimValue ?? "",
    String(ad.topic ?? ""),
    String(ad.description ?? lead.userNotes ?? ""),
    docs,
    lead.aiSummary ?? "",
    notes,
    lead.assignedToUserId ?? "",
  ];
}

export function leadsToCsv(leads: Lead[]): string {
  const head = CSV_COLUMNS.map(csvEscape).join(",");
  const rows = leads.map((l) => leadToCsvRow(l).map(csvEscape).join(","));
  // UTF-8 BOM, damit Excel die Umlaute korrekt erkennt.
  return "\uFEFF" + [head, ...rows].join("\r\n");
}

export function leadToCsv(lead: Lead): string {
  return leadsToCsv([lead]);
}

/** Vollständig — für DSGVO-Datenexport (Art. 20 DSGVO Portabilität) oder Migration. */
export function leadToJson(lead: Lead): string {
  return JSON.stringify(lead, null, 2);
}

function safeSlug(s: string): string {
  const umlautMap: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
  return s
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => umlautMap[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function leadFilenameBase(lead: Lead): string {
  const date = lead.createdAt.slice(0, 10);
  const name = safeSlug(`${lead.contact.lastName}-${lead.contact.firstName}`) || "lead";
  return `lead-${date}-${name}-${lead.id.slice(0, 8)}`;
}

export function downloadLeadCsv(lead: Lead): void {
  downloadBlob(`${leadFilenameBase(lead)}.csv`, leadToCsv(lead), "text/csv");
}

export function downloadLeadJson(lead: Lead): void {
  downloadBlob(`${leadFilenameBase(lead)}.json`, leadToJson(lead), "application/json");
}

export function downloadAllLeadsCsv(leads: Lead[], filterTag = "alle"): void {
  const date = new Date().toISOString().slice(0, 10);
  const tag = safeSlug(filterTag) || "alle";
  downloadBlob(`leads-${date}-${tag}.csv`, leadsToCsv(leads), "text/csv");
}
