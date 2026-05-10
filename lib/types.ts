import type { PriorityResult } from "./areas/types";

export const URGENCIES = [
  "So schnell wie möglich",
  "Innerhalb dieser Woche",
  "Innerhalb dieses Monats",
  "Noch unklar / nur Information",
] as const;
export type Urgency = (typeof URGENCIES)[number];

/**
 * Rechtsschutz-Versicherung — wichtig für die Anwalts-Priorisierung
 * (zahlende Mandate haben anderes Risiko-Profil).
 * Bewusst KEINE rechtliche Bewertung, nur eine Selbst-Auskunft.
 */
export const INSURANCE_STATUS = [
  "Ja",
  "Nein",
  "Weiß ich nicht",
] as const;
export type InsuranceStatus = (typeof INSURANCE_STATUS)[number];

export interface InsuranceInfo {
  status: InsuranceStatus;
  /** Frei eingegebener Versicherer-Name, nur bei status === "Ja" */
  provider?: string;
}

/**
 * Streitwert-/Sachwert-Bucket. Bewusst grob in Bereichen, weil
 * Mandanten den genauen Wert oft nicht kennen / falsch schätzen.
 */
export const CLAIM_VALUE_BUCKETS = [
  "Unter 2.000 €",
  "2.000 € – 10.000 €",
  "10.000 € – 50.000 €",
  "Über 50.000 €",
  "Weiß ich nicht",
] as const;
export type ClaimValueBucket = (typeof CLAIM_VALUE_BUCKETS)[number];

/**
 * Mandanten-Typ — bestimmt den Chat-Pfad und die geforderten Kontakt-Felder.
 * „business" = Unternehmen / Selbstständig (eigene Pflichtfelder, B2B-Tarife,
 * andere Priorität für die Kanzlei).
 */
export const CLIENT_TYPES = ["private", "business"] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  private: "Privatperson",
  business: "Unternehmen / Selbstständig",
};

/** B2B-spezifische Angaben — nur bei clientType === "business" gefuellt. */
export interface BusinessContact {
  companyName: string;
  /** Z.B. „Geschäftsführung", „Personalleitung", „Inhaber:in". Frei. */
  contactPosition?: string;
  /** Optional, weil viele Kleinunternehmer keine USt-ID haben. */
  vatId?: string;
}

export interface ClientContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postalCode: string;
  business?: BusinessContact;
}

/** Feste Lead-Status für den Backend-Workflow. */
export const LEAD_STATUSES = [
  "neu",
  "in_bearbeitung",
  "kontaktiert",
  "mandat_angenommen",
  "abgelehnt",
  "erledigt",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  neu: "Neu",
  in_bearbeitung: "In Bearbeitung",
  kontaktiert: "Kontaktiert",
  mandat_angenommen: "Mandat angenommen",
  abgelehnt: "Abgelehnt",
  erledigt: "Erledigt",
};

/** Eintrag in der Bearbeitungs-Historie eines Leads. */
export interface LeadHistoryEntry {
  at: string; // ISO
  byUserId: string;
  byUserName: string;
  type: "status" | "assign" | "note" | "created";
  message: string;
}

/**
 * Generischer Lead.
 * `areaId` + `areaData` ersetzen die früheren topic-spezifischen Felder.
 * Jedes Practice-Area-Modul kennt seine eigenen `areaData`-Keys.
 */
export interface Lead {
  id: string;
  createdAt: string; // ISO
  clientType: ClientType;
  areaId: string;
  areaLabel: string;

  /** Frei strukturierte Mandantenangaben (Schlüssel sind area-spezifisch). */
  areaData: Record<string, unknown>;

  urgency: Urgency;
  userNotes?: string;

  // Rechtsschutz und Streitwert — global (nicht area-spezifisch),
  // weil sie für jedes Anliegen die Priorisierung beeinflussen.
  insurance?: InsuranceInfo;
  claimValue?: ClaimValueBucket;

  // KI-Reformulierung (neutral, ohne Bewertung)
  aiSummary?: string;
  aiSummarySource?: "claude" | "template";

  // Kontakt — direkt sichtbar (kein Marktplatz-Käuferschutz mehr)
  contact: ClientContact;

  // Workflow
  status: LeadStatus;
  assignedToUserId?: string;
  history: LeadHistoryEntry[];

  // Bearbeitungs-Priorität (kein juristisches Erfolgs-Rating)
  priority: PriorityResult;
}

/** Während der Chat-Flow läuft, wird ein Draft schrittweise befüllt. */
export interface LeadDraft {
  /** Wird im Step `client_type` gesetzt; default „private" wenn nicht abgefragt. */
  clientType?: ClientType;
  areaId?: string;
  areaLabel?: string;
  areaData: Record<string, unknown>;

  urgency?: Urgency;
  userNotes?: string;

  // Rechtsschutz + Streitwert (global, vor Kontakt abgefragt)
  insurance?: InsuranceInfo;
  claimValue?: ClaimValueBucket;

  // Kontakt
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  postalCode?: string;

  // B2B-Felder (nur bei clientType === "business" relevant)
  companyName?: string;
  contactPosition?: string;
  vatId?: string;

  // DSGVO
  consentGiven: boolean;
}

export function emptyDraft(): LeadDraft {
  return { areaData: {}, consentGiven: false };
}
