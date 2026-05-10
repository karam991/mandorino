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
  "Eigenbedarfskündigung",
  "Sonstige Kündigung durch Vermieter",
  "Mängel / Mietminderung",
  "Mieterhöhung / Modernisierung",
  "Nebenkostenabrechnung",
  "Kaution",
  "Kündigung durch mich",
  "Sonstiges Mietrecht",
] as const;

const ROLE = ["Mieter:in", "Vermieter:in"] as const;

const RENT_RANGE = [
  "Bis 600 € warm",
  "600–1.000 € warm",
  "1.000–1.500 € warm",
  "Mehr als 1.500 € warm",
  "Möchte ich nicht angeben",
] as const;

const DOCUMENTS = [
  "Mietvertrag",
  "Schriftliche Kündigung",
  "Mieterhöhungsschreiben",
  "Nebenkostenabrechnung",
  "Fotos / Mängelprotokoll",
  "Korrespondenz mit Gegenseite",
  "Sonstige Dokumente",
] as const;

const steps: Record<string, AreaStep> = {
  topic: {
    id: "topic",
    botMessage: () => "Worum geht es im Mietrecht?",
    inputType: { kind: "choice", options: TOPICS },
    apply: (a, d) => {
      d.areaData.topic = a as string;
    },
    next: () => "role",
  },
  role: {
    id: "role",
    botMessage: () => "Treten Sie als Mieter:in oder Vermieter:in auf?",
    inputType: { kind: "choice", options: ROLE },
    apply: (a, d) => {
      d.areaData.role = a as string;
    },
    next: (d) => {
      const t = getStr(d, "topic");
      return t && t.toLowerCase().includes("kündigung") ? "incident_date" : "rent";
    },
  },
  incident_date: {
    id: "incident_date",
    botMessage: () => "Wann haben Sie das relevante Schreiben erhalten?",
    inputType: { kind: "date" },
    apply: (a, d) => {
      d.areaData.incidentDate = a as string;
    },
    next: () => "rent",
  },
  rent: {
    id: "rent",
    botMessage: () => "In welcher Größenordnung liegt die Bruttomiete?",
    inputType: { kind: "choice", options: RENT_RANGE },
    apply: (a, d) => {
      d.areaData.rentRange = a as string;
    },
    next: () => "description",
  },
  description: {
    id: "description",
    botMessage: () => "Beschreiben Sie kurz die Situation in eigenen Worten.",
    inputType: {
      kind: "text",
      multiline: true,
      placeholder: 'z.B. „Vermieter macht Eigenbedarf für seinen Sohn geltend"',
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

  // Kündigung des Mietverhältnisses: Widerspruchsfristen
  const topic = getStr(draft, "topic") ?? "";
  if (topic.toLowerCase().includes("kündigung")) {
    const dateStr = getStr(draft, "incidentDate");
    if (dateStr) {
      const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
      if (days >= 0 && days <= 30) {
        score += 25;
        signals.push({
          kind: "frist",
          label: `Kündigungsschreiben vor ${days} Tagen`,
        });
      }
    }
  }

  // Höhere Miete = oft komplexere Verfahren / höherer Streitwert
  const rent = getStr(draft, "rentRange");
  if (rent === "1.000–1.500 € warm" || rent === "Mehr als 1.500 € warm") {
    score += 5;
    signals.push({ kind: "streitwert", label: "Höhere Mietkategorie" });
  }

  const docs = getStrArr(draft, "documents");
  const dp = documentsPoints(docs, 3);
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

export const MIETRECHT: PracticeArea = {
  id: "mietrecht",
  label: "Mietrecht",
  blurb: "Kündigung, Mängel, Mieterhöhung, Nebenkosten, Kaution.",
  icon: "key",
  entryStepId: "topic",
  steps,
  scorePriority,
};
