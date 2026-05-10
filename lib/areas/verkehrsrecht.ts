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
  "Verkehrsunfall",
  "Bußgeldbescheid / Punkte",
  "Führerschein-Entzug",
  "Trunkenheit / MPU",
  "Strafverfahren im Straßenverkehr",
  "Sonstiges Verkehrsrecht",
] as const;

const INJURY_LEVEL = [
  "Keine Personenschäden",
  "Leichte Verletzungen (HWS o.ä.)",
  "Schwere Verletzungen",
  "Möchte ich nicht angeben",
] as const;

const FAULT = [
  "Gegnerische Schuld eindeutig",
  "Mitschuldfrage offen",
  "Eigene Schuld",
  "Unklar / Behörde ermittelt noch",
] as const;

const DAMAGE_RANGE = [
  "Bis 2.500 €",
  "2.500–10.000 €",
  "10.000–25.000 €",
  "Mehr als 25.000 €",
  "Noch unklar",
] as const;

const DOCUMENTS = [
  "Polizeibericht / Aktenzeichen",
  "Kfz-Versicherungspolice",
  "Bußgeldbescheid",
  "Anhörungsbogen",
  "Fotos vom Schaden",
  "Zeugen-Kontakte",
  "Sonstige Dokumente",
] as const;

const steps: Record<string, AreaStep> = {
  topic: {
    id: "topic",
    botMessage: () => "Worum geht es konkret im Verkehrsrecht?",
    inputType: { kind: "choice", options: TOPICS },
    apply: (a, d) => {
      d.areaData.topic = a as string;
    },
    next: (d) => (getStr(d, "topic") === "Verkehrsunfall" ? "incident_date" : "incident_date_short"),
  },
  incident_date: {
    id: "incident_date",
    botMessage: () => "Wann ist der Unfall passiert?",
    inputType: { kind: "date" },
    apply: (a, d) => {
      d.areaData.incidentDate = a as string;
    },
    next: () => "fault",
  },
  incident_date_short: {
    id: "incident_date_short",
    botMessage: () =>
      "Welches Datum hat das relevante Schreiben (z.B. Bußgeldbescheid, Anhörungsbogen)?",
    inputType: { kind: "date" },
    apply: (a, d) => {
      d.areaData.incidentDate = a as string;
    },
    next: () => "documents",
  },
  fault: {
    id: "fault",
    botMessage: () =>
      "Wie schätzen Sie die Schuldfrage ein? Sie geben damit nur Ihre Sicht wieder — die Bewertung übernimmt der Anwalt.",
    inputType: { kind: "choice", options: FAULT },
    apply: (a, d) => {
      d.areaData.fault = a as string;
    },
    next: () => "injury",
  },
  injury: {
    id: "injury",
    botMessage: () => "Gab es Personenschäden?",
    inputType: { kind: "choice", options: INJURY_LEVEL },
    apply: (a, d) => {
      d.areaData.injury = a as string;
    },
    next: () => "damage",
  },
  damage: {
    id: "damage",
    botMessage: () => "In welcher Größenordnung liegt der Sachschaden ungefähr?",
    inputType: { kind: "choice", options: DAMAGE_RANGE },
    apply: (a, d) => {
      d.areaData.damageRange = a as string;
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

  // Bußgeld: 2-Wochen-Einspruchsfrist
  const topic = getStr(draft, "topic");
  if (topic === "Bußgeldbescheid / Punkte" || topic === "Führerschein-Entzug") {
    const dateStr = getStr(draft, "incidentDate");
    if (dateStr) {
      const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
      if (days >= 0 && days <= 14) {
        score += 30;
        signals.push({
          kind: "frist",
          label: `Bescheid vor ${days} Tagen — Einspruchsfrist sensibel`,
        });
      }
    }
  }

  // Streitwert-Indikator
  const dmg = getStr(draft, "damageRange");
  if (dmg === "10.000–25.000 €" || dmg === "Mehr als 25.000 €") {
    score += 15;
    signals.push({ kind: "streitwert", label: "Höherer Sachschaden angegeben" });
  }
  if (getStr(draft, "injury") === "Schwere Verletzungen") {
    score += 10;
    signals.push({ kind: "streitwert", label: "Personenschaden — Schmerzensgeld-Aspekt" });
  }

  // Eindeutige Gegnerschuld → guter Bearbeitungs-Aufhänger
  if (getStr(draft, "fault") === "Gegnerische Schuld eindeutig") {
    score += 10;
    signals.push({ kind: "fit", label: "Gegnerische Schuld laut Mandant eindeutig" });
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

export const VERKEHRSRECHT: PracticeArea = {
  id: "verkehrsrecht",
  label: "Verkehrsrecht",
  blurb: "Unfall, Bußgeld, Führerschein, Strafverfahren im Straßenverkehr.",
  icon: "car",
  entryStepId: "topic",
  steps,
  scorePriority,
};
