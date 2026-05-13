"use client";

import { getPracticeArea } from "./areas/registry";
import type {
  Lead,
  LeadDraft,
  LeadHistoryEntry,
  LeadStatus,
} from "./types";

const STORAGE_KEY = "mandorino.leads.v2"; // v2 — neues Schema (status, history, score)

/**
 * MVP-Persistenz im Browser-localStorage.
 * Alle Aufrufer benutzen nur diese Funktionen — der Swap auf
 * eine echte API (Supabase/Postgres) erfolgt später hier zentral.
 */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): Lead[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Lead[]) : [];
  } catch {
    return [];
  }
}

function writeAll(leads: Lead[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function getAllLeads(): Lead[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getLeadById(id: string): Lead | null {
  return readAll().find((l) => l.id === id) ?? null;
}

export function saveLead(lead: Lead): void {
  const all = readAll();
  const idx = all.findIndex((l) => l.id === lead.id);
  if (idx >= 0) all[idx] = lead;
  else all.push(lead);
  writeAll(all);
}

interface ActorContext {
  userId: string;
  userName: string;
}

/** Status ändern + History-Eintrag schreiben. */
export function changeStatus(
  leadId: string,
  newStatus: LeadStatus,
  actor: ActorContext,
): Lead | null {
  const lead = getLeadById(leadId);
  if (!lead) return null;
  if (lead.status === newStatus) return lead;
  const updated: Lead = {
    ...lead,
    status: newStatus,
    history: [
      ...lead.history,
      {
        at: new Date().toISOString(),
        byUserId: actor.userId,
        byUserName: actor.userName,
        type: "status",
        message: `Status geändert: ${lead.status} → ${newStatus}`,
      },
    ],
  };
  saveLead(updated);
  return updated;
}

/** Zuweisung ändern (oder entfernen, wenn assigneeId leer). */
export function assignLead(
  leadId: string,
  assigneeId: string | null,
  assigneeName: string | null,
  actor: ActorContext,
): Lead | null {
  const lead = getLeadById(leadId);
  if (!lead) return null;
  if (lead.assignedToUserId === (assigneeId ?? undefined)) return lead;
  const updated: Lead = {
    ...lead,
    assignedToUserId: assigneeId ?? undefined,
    history: [
      ...lead.history,
      {
        at: new Date().toISOString(),
        byUserId: actor.userId,
        byUserName: actor.userName,
        type: "assign",
        message: assigneeId
          ? `Zugewiesen an ${assigneeName ?? assigneeId}`
          : "Zuweisung entfernt",
      },
    ],
  };
  saveLead(updated);
  return updated;
}

/** Freitext-Notiz hinzufügen. */
export function addNote(leadId: string, text: string, actor: ActorContext): Lead | null {
  const lead = getLeadById(leadId);
  if (!lead) return null;
  const trimmed = text.trim();
  if (!trimmed) return lead;
  const updated: Lead = {
    ...lead,
    history: [
      ...lead.history,
      {
        at: new Date().toISOString(),
        byUserId: actor.userId,
        byUserName: actor.userName,
        type: "note",
        message: trimmed,
      },
    ],
  };
  saveLead(updated);
  return updated;
}

/** Baut aus einem fertigen Draft einen persistierbaren Lead. */
export function buildLeadFromDraft(
  draft: LeadDraft,
  aiSummary: string | undefined,
  aiSummarySource: "claude" | "template" | undefined,
): Lead {
  if (
    !draft.areaId ||
    !draft.areaLabel ||
    !draft.urgency ||
    !draft.firstName ||
    !draft.lastName ||
    !draft.email ||
    !draft.phone ||
    !draft.postalCode ||
    !draft.consentGiven
  ) {
    throw new Error("Lead-Draft ist unvollständig.");
  }

  const clientType = draft.clientType ?? "private";

  if (clientType === "business" && !draft.companyName) {
    throw new Error("Firmenname fehlt — bitte ergänzen.");
  }

  const area = getPracticeArea(draft.areaId);
  const priority = area
    ? area.scorePriority(draft)
    : { tier: "medium" as const, numeric: 50, signals: [] };

  const initialHistory: LeadHistoryEntry[] = [
    {
      at: new Date().toISOString(),
      byUserId: "system",
      byUserName: "System",
      type: "created",
      message: `Lead erstellt (${draft.areaLabel})`,
    },
  ];

  return {
    id: cryptoRandomId(),
    createdAt: new Date().toISOString(),
    clientType,
    areaId: draft.areaId,
    areaLabel: draft.areaLabel,
    areaData: { ...draft.areaData },
    urgency: draft.urgency,
    userNotes: draft.userNotes,
    insurance: draft.insurance,
    claimValue: draft.claimValue,
    aiSummary,
    aiSummarySource,
    contact: {
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      phone: draft.phone,
      postalCode: draft.postalCode,
      ...(clientType === "business" && draft.companyName
        ? {
            business: {
              companyName: draft.companyName,
              contactPosition: draft.contactPosition,
              vatId: draft.vatId,
            },
          }
        : {}),
    },
    status: "neu",
    history: initialHistory,
    priority,
  };
}

function cryptoRandomId(): string {
  if (isBrowser() && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Demo-Daten für das Dashboard.
 * Wird einmalig befüllt, falls der Store leer ist.
 */
export function seedDemoLeadsIfEmpty(): void {
  if (!isBrowser()) return;
  if (readAll().length > 0) return;

  const now = Date.now();
  const day = 86400000;

  function buildDemo(
    areaId: string,
    areaLabel: string,
    areaData: Record<string, unknown>,
    contact: Lead["contact"],
    overrides: Partial<Lead>,
  ): Lead {
    const area = getPracticeArea(areaId);
    const draft: LeadDraft = {
      areaId,
      areaLabel,
      areaData,
      urgency: "Innerhalb dieser Woche",
      consentGiven: true,
    };
    const priority = area
      ? area.scorePriority(draft)
      : { tier: "medium" as const, numeric: 50, signals: [] };
    return {
      id: overrides.id ?? cryptoRandomId(),
      createdAt: overrides.createdAt ?? new Date(now).toISOString(),
      areaId,
      areaLabel,
       clientType: overrides.clientType ?? "private",
      areaData,
      urgency: overrides.urgency ?? "Innerhalb dieser Woche",
      userNotes: overrides.userNotes,
      insurance: overrides.insurance,
      claimValue: overrides.claimValue,
      aiSummary: overrides.aiSummary,
      aiSummarySource: overrides.aiSummarySource ?? "template",
      contact,
      status: overrides.status ?? "neu",
      assignedToUserId: overrides.assignedToUserId,
      history: overrides.history ?? [
        {
          at: overrides.createdAt ?? new Date(now).toISOString(),
          byUserId: "system",
          byUserName: "System",
          type: "created",
          message: `Lead erstellt (${areaLabel})`,
        },
      ],
      priority,
    };
  }

  const seed: Lead[] = [
    buildDemo(
      "arbeitsrecht",
      "Arbeitsrecht",
      {
        topic: "Kündigung",
        incidentDate: new Date(now - 4 * day).toISOString().slice(0, 10),
        terminationType: "Ordentliche Kündigung",
        terminationReason: "Betriebsbedingt wegen Umstrukturierung im Vertrieb.",
        employmentDuration: "5 bis 10 Jahre",
        companySize: "51 bis 250 Mitarbeitende",
        salaryRange: "4.000–6.000 € brutto",
        documents: ["Arbeitsvertrag", "Kündigungsschreiben"],
      },
      {
        firstName: "Maria",
        lastName: "Schneider",
        email: "maria.schneider@example.de",
        phone: "+49 170 1234567",
        postalCode: "10115",
      },
      {
        id: "lead_demo_arb_1",
        createdAt: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
        urgency: "So schnell wie möglich",
        insurance: { status: "Ja", provider: "ARAG" },
        claimValue: "10.000 € – 50.000 €",
        userNotes:
          "Sozialauswahl wurde nicht erläutert; gute Bewertungen über die gesamte Beschäftigungszeit.",
        aiSummary:
          "Mandantin berichtet eine ordentliche, betriebsbedingte Kündigung nach 7 Jahren in einem mittelgroßen Unternehmen. Begründung im Schreiben: Umstrukturierung im Vertrieb. Kündigungsschreiben und Arbeitsvertrag liegen vor. Diese Zusammenfassung enthält keine rechtliche Bewertung.",
        status: "neu",
      },
    ),
    buildDemo(
      "verkehrsrecht",
      "Verkehrsrecht",
      {
        topic: "Bußgeldbescheid / Punkte",
        incidentDate: new Date(now - 5 * day).toISOString().slice(0, 10),
        fault: "Mitschuldfrage offen",
        injury: "Keine Personenschäden",
        damageRange: "Bis 2.500 €",
        documents: ["Bußgeldbescheid", "Anhörungsbogen"],
      },
      {
        firstName: "Tobias",
        lastName: "Becker",
        email: "tobias.becker@example.de",
        phone: "+49 151 9876543",
        postalCode: "80331",
      },
      {
        id: "lead_demo_verk_1",
        createdAt: new Date(now - 1 * day).toISOString(),
        urgency: "Innerhalb dieser Woche",
        insurance: { status: "Ja", provider: "Allianz" },
        claimValue: "Unter 2.000 €",
        userNotes: "Möchte Einspruch einlegen, wartet auf Rückmeldung.",
        aiSummary:
          "Mandant erhielt vor 5 Tagen einen Bußgeldbescheid und einen Anhörungsbogen. Keine Personenschäden, geringfügiger Sachschaden. Mandant beschreibt die Mitschuldfrage als offen. Diese Zusammenfassung enthält keine rechtliche Bewertung.",
        status: "in_bearbeitung",
        assignedToUserId: "user_admin",
      },
    ),
    buildDemo(
      "erbrecht",
      "Erbrecht",
      {
        topic: "Pflichtteil geltend machen",
        deathDate: new Date(now - 30 * day).toISOString().slice(0, 10),
        relation: "Kind / Abkömmling",
        testament: "Notarielles Testament vorhanden",
        estateRange: "250.000–1 Mio. €",
        description:
          "Vater ist verstorben; im Testament komplett vom Erbe ausgeschlossen. Wohnungseigentum vorhanden.",
        documents: ["Sterbeurkunde", "Testament / Erbvertrag", "Grundbuchauszüge"],
      },
      {
        firstName: "Aylin",
        lastName: "Yilmaz",
        email: "aylin.yilmaz@example.de",
        phone: "+49 176 5556677",
        postalCode: "20095",
      },
      {
        id: "lead_demo_erb_1",
        createdAt: new Date(now - 2 * day).toISOString(),
        urgency: "Innerhalb dieses Monats",
        insurance: { status: "Nein" },
        claimValue: "Über 50.000 €",
        aiSummary:
          "Mandantin berichtet, vor einem Monat den Vater verloren zu haben. Notarielles Testament liegt vor; die Mandantin gibt an, darin nicht bedacht zu sein. Nachlass im sechsstelligen Bereich, Grundbuchauszüge liegen vor. Diese Zusammenfassung enthält keine rechtliche Bewertung.",
        status: "neu",
      },
    ),
    buildDemo(
      "mietrecht",
      "Mietrecht",
      {
        topic: "Eigenbedarfskündigung",
        role: "Mieter:in",
        incidentDate: new Date(now - 12 * day).toISOString().slice(0, 10),
        rentRange: "1.000–1.500 € warm",
        description:
          "Vermieter hat schriftlich Eigenbedarf für seinen Sohn angemeldet. Wir wohnen seit 9 Jahren in der Wohnung.",
        documents: ["Mietvertrag", "Schriftliche Kündigung"],
      },
      {
        firstName: "Jonas",
        lastName: "Kraus",
        email: "jonas.kraus@example.de",
        phone: "+49 152 2233445",
        postalCode: "60311",
      },
      {
        id: "lead_demo_miet_1",
        createdAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
        urgency: "So schnell wie möglich",
        insurance: { status: "Weiß ich nicht" },
        claimValue: "2.000 € – 10.000 €",
        aiSummary:
          "Mandant berichtet eine Eigenbedarfskündigung nach 9-jährigem Mietverhältnis. Kündigung vor 12 Tagen erhalten, Vermieter beruft sich auf Eigenbedarf für seinen Sohn. Mietvertrag und Kündigungsschreiben liegen vor. Diese Zusammenfassung enthält keine rechtliche Bewertung.",
        status: "neu",
      },
    ),
    buildDemo(
      "digitales",
      "Digitales Recht",
      {
        topic: "Abmahnung im Internet",
        role: "Selbstständig / Freiberuflich",
        party: "Anspruch gegen mich (ich wurde abgemahnt/verklagt)",
        incidentDate: new Date(now - 3 * day).toISOString().slice(0, 10),
        description:
          "Anwaltliche Abmahnung wegen angeblicher Urheberrechtsverletzung durch ein Foto auf meiner Website.",
        documents: ["Abmahnschreiben / anwaltliches Schreiben", "Screenshots"],
      },
      {
        firstName: "Lena",
        lastName: "Hoffmann",
        email: "lena.hoffmann@example.de",
        phone: "+49 159 7788990",
        postalCode: "50667",
      },
      {
        id: "lead_demo_dig_1",
        createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
        urgency: "So schnell wie möglich",
        insurance: { status: "Nein" },
        claimValue: "2.000 € – 10.000 €",
        aiSummary:
          "Mandantin (Selbstständig) berichtet eine anwaltliche Abmahnung wegen angeblicher Urheberrechtsverletzung durch ein Foto auf der eigenen Website. Schreiben vor 3 Tagen erhalten. Abmahnschreiben und Screenshots liegen vor. Diese Zusammenfassung enthält keine rechtliche Bewertung.",
        status: "kontaktiert",
        assignedToUserId: "user_admin",
      },
    ),
  ];

  writeAll(seed);
}
