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

export const ARBEITSRECHT_TOPICS = [
  "Kündigung",
  "Abmahnung",
  "Lohn / Gehalt",
  "Aufhebungsvertrag",
  "Arbeitszeugnis",
  "Überstunden / Urlaub",
  "Mobbing / Diskriminierung",
  "Sonstiges Arbeitsrecht",
] as const;

const TERMINATION_TYPES = [
  "Ordentliche Kündigung",
  "Außerordentliche / fristlose Kündigung",
  "Verdachtskündigung",
  "Änderungskündigung",
  "Weiß ich nicht / steht nicht im Schreiben",
] as const;

const EMPLOYMENT_DURATIONS = [
  "Weniger als 6 Monate",
  "6 Monate bis 2 Jahre",
  "2 bis 5 Jahre",
  "5 bis 10 Jahre",
  "Mehr als 10 Jahre",
] as const;

const COMPANY_SIZES = [
  "Bis 10 Mitarbeitende",
  "11 bis 50 Mitarbeitende",
  "51 bis 250 Mitarbeitende",
  "Mehr als 250 Mitarbeitende",
  "Weiß ich nicht",
] as const;

const DOCUMENTS = [
  "Arbeitsvertrag",
  "Kündigungsschreiben",
  "Abmahnung(en)",
  "Lohnabrechnungen",
  "Korrespondenz mit Arbeitgeber",
  "Arbeitszeugnis",
  "Sonstige Dokumente",
] as const;

const SALARY_RANGES = [
  "Bis 2.500 € brutto",
  "2.500–4.000 € brutto",
  "4.000–6.000 € brutto",
  "Mehr als 6.000 € brutto",
  "Möchte ich nicht angeben",
] as const;

const steps: Record<string, AreaStep> = {
  topic: {
    id: "topic",
    botMessage: () => "Womit können wir Ihnen im Arbeitsrecht helfen?",
    inputType: { kind: "choice", options: ARBEITSRECHT_TOPICS },
    apply: (a, d) => {
      d.areaData.topic = a as string;
    },
    next: (d) => (getStr(d, "topic") === "Kündigung" ? "kuendigung_date" : "duration"),
  },
  kuendigung_date: {
    id: "kuendigung_date",
    botMessage: () =>
      "Wann haben Sie die Kündigung erhalten? Falls Sie das genaue Datum nicht wissen, schätzen Sie bitte.",
    inputType: { kind: "date" },
    apply: (a, d) => {
      d.areaData.incidentDate = a as string;
    },
    next: () => "kuendigung_type",
  },
  kuendigung_type: {
    id: "kuendigung_type",
    botMessage: () => "Welche Art von Kündigung wurde ausgesprochen?",
    inputType: { kind: "choice", options: TERMINATION_TYPES },
    apply: (a, d) => {
      d.areaData.terminationType = a as string;
    },
    next: () => "kuendigung_reason",
  },
  kuendigung_reason: {
    id: "kuendigung_reason",
    botMessage: () =>
      "Welcher Grund wurde Ihnen genannt? Geben Sie es gerne in eigenen Worten wieder.",
    inputType: {
      kind: "text",
      multiline: true,
      placeholder: 'z.B. „betriebsbedingt wegen Stellenabbau"',
      optional: true,
    },
    apply: (a, d) => {
      const v = (a as string).trim();
      if (v) d.areaData.terminationReason = v;
    },
    next: () => "duration",
  },
  duration: {
    id: "duration",
    botMessage: () => "Wie lange waren bzw. sind Sie in diesem Unternehmen beschäftigt?",
    inputType: { kind: "choice", options: EMPLOYMENT_DURATIONS },
    apply: (a, d) => {
      d.areaData.employmentDuration = a as string;
    },
    next: () => "company_size",
  },
  company_size: {
    id: "company_size",
    botMessage: () => "Wie groß ist das Unternehmen ungefähr?",
    inputType: { kind: "choice", options: COMPANY_SIZES },
    apply: (a, d) => {
      d.areaData.companySize = a as string;
    },
    next: () => "salary",
  },
  salary: {
    id: "salary",
    botMessage: () =>
      "In welcher Größenordnung liegt Ihr Bruttogehalt? Diese Angabe hilft dem Anwalt bei der Einordnung.",
    inputType: { kind: "choice", options: SALARY_RANGES },
    apply: (a, d) => {
      d.areaData.salaryRange = a as string;
    },
    next: () => "documents",
  },
  documents: {
    id: "documents",
    botMessage: () => "Welche Dokumente liegen Ihnen vor? Wählen Sie alle Zutreffenden.",
    inputType: { kind: "multi", options: DOCUMENTS, allowEmpty: true },
    apply: (a, d) => {
      d.areaData.documents = a as string[];
    },
    next: () => null,
  },
};

function scorePriority(draft: LeadDraft) {
  const signals: PrioritySignal[] = [];
  let score = 30; // Basis

  // Frist-Sensitivität: Kündigung → 3-Wochen-Klagefrist (KSchG)
  if (getStr(draft, "topic") === "Kündigung") {
    const dateStr = getStr(draft, "incidentDate");
    if (dateStr) {
      const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
      if (days >= 0 && days <= 21) {
        score += 30;
        signals.push({
          kind: "frist",
          label: `Kündigung vor ${days} Tagen — Frist-sensibel`,
        });
      } else if (days > 21 && days <= 30) {
        score += 10;
        signals.push({ kind: "frist", label: "Kündigung knapp über 3 Wochen — prüfen" });
      }
    }
  }

  // Beschäftigungsdauer (Indikator für möglichen Streitwert)
  const dur = getStr(draft, "employmentDuration");
  if (dur === "5 bis 10 Jahre" || dur === "Mehr als 10 Jahre") {
    score += 10;
    signals.push({ kind: "streitwert", label: "Lange Beschäftigungsdauer" });
  }

  // Vollständigkeit
  const docs = getStrArr(draft, "documents");
  const dp = documentsPoints(docs, 3);
  score += dp.points;
  if (dp.signal) signals.push(dp.signal);

  // Dringlichkeit
  const up = urgencyPoints(draft);
  score += up.points;
  if (up.signal) signals.push(up.signal);

  // Rechtsschutz + Streitwert-Bucket (Selbstauskunft)
  const ip = insurancePoints(draft);
  score += ip.points;
  if (ip.signal) signals.push(ip.signal);
  const cv = claimValuePoints(draft);
  score += cv.points;
  if (cv.signal) signals.push(cv.signal);

  // Streitwert-Range (3 Bruttogehälter Faustwert für Abfindungsverhandlung)
  const salary = getStr(draft, "salaryRange");
  let range: { min: number; max: number; label: string } | undefined;
  if (getStr(draft, "topic") === "Kündigung" && salary && salary !== "Möchte ich nicht angeben") {
    const s = salaryRangeMidpoint(salary);
    if (s) {
      const min = Math.round((s * 0.5) / 1000) * 1000;
      const max = Math.round((s * 6) / 1000) * 1000;
      range = {
        min,
        max,
        label: `ungefährer Streitwert-Korridor: ${min.toLocaleString("de-DE")}–${max.toLocaleString("de-DE")} €`,
      };
    }
  }

  return buildPriority(Math.min(100, score), signals, range);
}

function salaryRangeMidpoint(label: string): number | null {
  switch (label) {
    case "Bis 2.500 € brutto":
      return 2000;
    case "2.500–4.000 € brutto":
      return 3250;
    case "4.000–6.000 € brutto":
      return 5000;
    case "Mehr als 6.000 € brutto":
      return 7500;
    default:
      return null;
  }
}

export const ARBEITSRECHT: PracticeArea = {
  id: "arbeitsrecht",
  label: "Arbeitsrecht",
  blurb: "Kündigung, Abmahnung, Aufhebungsvertrag, Lohn, Zeugnis.",
  icon: "briefcase",
  entryStepId: "topic",
  steps,
  scorePriority,
};
