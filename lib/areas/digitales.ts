import type { LeadDraft } from "../types";
import {
  buildPriority,
  claimValuePoints,
  documentsPoints,
  getStr,
  getStrArr,
  insurancePoints,
  urgencyPoints,
} from "./_helpers";
import type { AreaStep, PracticeArea, PrioritySignal } from "./types";

const TOPICS = [
  "Datenschutz / DSGVO-Verstoß",
  "Abmahnung im Internet",
  "Urheberrecht (Foto, Video, Text)",
  "Online-Bewertung / Rufschädigung",
  "IT-Vertrag / Softwareprojekt",
  "Cybercrime / Hacking-Vorfall",
  "Sonstiges Digitalrecht",
] as const;

const ROLE = [
  "Privatperson",
  "Selbstständig / Freiberuflich",
  "Unternehmen",
] as const;

const PARTY = [
  "Anspruch gegen mich (ich wurde abgemahnt/verklagt)",
  "Eigener Anspruch (ich möchte vorgehen)",
  "Beratung vorab",
] as const;

const DOCUMENTS = [
  "Abmahnschreiben / anwaltliches Schreiben",
  "Vertrag / AGB",
  "Screenshots",
  "E-Mail-Korrespondenz",
  "Rechnungen",
  "Sonstige Dokumente",
] as const;

const steps: Record<string, AreaStep> = {
  topic: {
    id: "topic",
    botMessage: () => "Welcher Bereich des digitalen Rechts trifft am ehesten zu?",
    inputType: { kind: "choice", options: TOPICS },
    apply: (a, d) => {
      d.areaData.topic = a as string;
    },
    next: () => "role",
  },
  role: {
    id: "role",
    botMessage: () => "Treten Sie als Privatperson, Selbstständige:r oder Unternehmen auf?",
    inputType: { kind: "choice", options: ROLE },
    apply: (a, d) => {
      d.areaData.role = a as string;
    },
    next: () => "party",
  },
  party: {
    id: "party",
    botMessage: () => "Geht es um einen Anspruch gegen Sie oder einen eigenen Anspruch?",
    inputType: { kind: "choice", options: PARTY },
    apply: (a, d) => {
      d.areaData.party = a as string;
    },
    next: () => "incident_date",
  },
  incident_date: {
    id: "incident_date",
    botMessage: () =>
      "Welches Datum hat das relevante Schreiben oder der Vorfall? (Schätzen ist ok.)",
    inputType: { kind: "date" },
    apply: (a, d) => {
      d.areaData.incidentDate = a as string;
    },
    next: () => "description",
  },
  description: {
    id: "description",
    botMessage: () =>
      "Beschreiben Sie kurz, was vorgefallen ist — in eigenen Worten, ohne Wertung.",
    inputType: {
      kind: "text",
      multiline: true,
      placeholder: "Worum geht es?",
      optional: false,
    },
    apply: (a, d) => {
      d.areaData.description = (a as string).trim();
    },
    next: () => "documents",
  },
  documents: {
    id: "documents",
    botMessage: () => "Welche Unterlagen liegen Ihnen vor?",
    inputType: { kind: "multi", options: DOCUMENTS, allowEmpty: true },
    apply: (a, d) => {
      d.areaData.documents = a as string[];
    },
    next: () => null,
  },
};

function scorePriority(draft: LeadDraft) {
  const signals: PrioritySignal[] = [];
  let score = 30;

  // Abmahnung: typisch kurze Fristen (oft 7–14 Tage zur Unterlassungserklärung)
  const topic = getStr(draft, "topic");
  if (topic === "Abmahnung im Internet" || topic === "Urheberrecht (Foto, Video, Text)") {
    const dateStr = getStr(draft, "incidentDate");
    if (dateStr) {
      const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
      if (days >= 0 && days <= 10) {
        score += 30;
        signals.push({ kind: "frist", label: `Schreiben vor ${days} Tagen — Frist sensibel` });
      }
    }
  }

  // Unternehmen → höherer Streitwert wahrscheinlich
  if (getStr(draft, "role") === "Unternehmen") {
    score += 10;
    signals.push({ kind: "streitwert", label: "Mandant: Unternehmen" });
  }

  const docs = getStrArr(draft, "documents");
  const dp = documentsPoints(docs, 2);
  score += dp.points;
  if (dp.signal) signals.push(dp.signal);

  const up = urgencyPoints(draft);
  score += up.points;
  if (up.signal) signals.push(up.signal);

  const ip = insurancePoints(draft);
  score += ip.points;
  if (ip.signal) signals.push(ip.signal);
  const cv = claimValuePoints(draft);
  score += cv.points;
  if (cv.signal) signals.push(cv.signal);

  return buildPriority(Math.min(100, score), signals);
}

export const DIGITALES: PracticeArea = {
  id: "digitales",
  label: "Digitales Recht",
  blurb: "DSGVO, Abmahnung, Urheberrecht, IT-Verträge, Online-Reputation.",
  icon: "globe",
  entryStepId: "topic",
  steps,
  scorePriority,
};
