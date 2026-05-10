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
  "Pflichtteil geltend machen",
  "Pflichtteil abwehren",
  "Testament anfechten",
  "Testament gestalten / Beratung",
  "Erbschein beantragen",
  "Erbengemeinschaft / Auseinandersetzung",
  "Erbausschlagung",
  "Sonstiges Erbrecht",
] as const;

const RELATION = [
  "Ehepartner:in",
  "Kind / Abkömmling",
  "Elternteil",
  "Geschwister",
  "Sonstige:r Verwandte:r",
  "Lebensgefährt:in (nicht verheiratet)",
] as const;

const TESTAMENT = [
  "Notarielles Testament vorhanden",
  "Handschriftliches Testament vorhanden",
  "Erbvertrag vorhanden",
  "Kein Testament / unklar",
] as const;

const ESTATE_RANGE = [
  "Bis 50.000 €",
  "50.000–250.000 €",
  "250.000–1 Mio. €",
  "Mehr als 1 Mio. €",
  "Möchte ich nicht angeben",
] as const;

const DOCUMENTS = [
  "Sterbeurkunde",
  "Testament / Erbvertrag",
  "Erbschein",
  "Grundbuchauszüge",
  "Kontoauszüge / Vermögensübersicht",
  "Korrespondenz mit Miterben",
  "Sonstige Dokumente",
] as const;

const steps: Record<string, AreaStep> = {
  topic: {
    id: "topic",
    botMessage: () => "Welches erbrechtliche Anliegen passt am besten?",
    inputType: { kind: "choice", options: TOPICS },
    apply: (a, d) => {
      d.areaData.topic = a as string;
    },
    next: (d) =>
      getStr(d, "topic") === "Testament gestalten / Beratung" ? "estate" : "death_date",
  },
  death_date: {
    id: "death_date",
    botMessage: () => "Wann ist der Erbfall eingetreten? (Datum des Sterbetags)",
    inputType: { kind: "date" },
    apply: (a, d) => {
      d.areaData.deathDate = a as string;
    },
    next: () => "relation",
  },
  relation: {
    id: "relation",
    botMessage: () => "In welchem Verwandtschaftsverhältnis stehen Sie zum Erblasser?",
    inputType: { kind: "choice", options: RELATION },
    apply: (a, d) => {
      d.areaData.relation = a as string;
    },
    next: () => "testament",
  },
  testament: {
    id: "testament",
    botMessage: () => "Liegt ein Testament oder Erbvertrag vor?",
    inputType: { kind: "choice", options: TESTAMENT },
    apply: (a, d) => {
      d.areaData.testament = a as string;
    },
    next: () => "estate",
  },
  estate: {
    id: "estate",
    botMessage: () =>
      "Wie groß ist der Nachlass ungefähr? Eine grobe Einordnung reicht — der Anwalt wird das später präzise erfassen.",
    inputType: { kind: "choice", options: ESTATE_RANGE },
    apply: (a, d) => {
      d.areaData.estateRange = a as string;
    },
    next: () => "description",
  },
  description: {
    id: "description",
    botMessage: () =>
      "Beschreiben Sie die Situation kurz in eigenen Worten — Familienverhältnisse, Streitpunkte, was Sie erreichen möchten.",
    inputType: {
      kind: "text",
      multiline: true,
      placeholder: "Worum geht es Ihnen?",
      optional: false,
    },
    apply: (a, d) => {
      d.areaData.description = (a as string).trim();
    },
    next: () => "documents",
  },
  documents: {
    id: "documents",
    botMessage: () => "Welche Dokumente liegen Ihnen bereits vor?",
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

  // Erbausschlagung: 6-Wochen-Frist ab Kenntnis
  if (getStr(draft, "topic") === "Erbausschlagung") {
    const d = getStr(draft, "deathDate");
    if (d) {
      const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
      if (days >= 0 && days <= 42) {
        score += 30;
        signals.push({
          kind: "frist",
          label: `Erbfall vor ${days} Tagen — Ausschlagungsfrist sensibel`,
        });
      }
    }
  }

  // Nachlassgröße als Streitwert-Indikator
  const estate = getStr(draft, "estateRange");
  if (estate === "250.000–1 Mio. €") {
    score += 15;
    signals.push({ kind: "streitwert", label: "Nachlass im sechsstelligen Bereich" });
  } else if (estate === "Mehr als 1 Mio. €") {
    score += 25;
    signals.push({ kind: "streitwert", label: "Nachlass siebenstellig" });
  }

  // Pflichtteils-Konstellationen
  const topic = getStr(draft, "topic") ?? "";
  if (topic.includes("Pflichtteil") || topic === "Testament anfechten") {
    score += 5;
    signals.push({ kind: "fit", label: "Streitiges Erbrecht" });
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

export const ERBRECHT: PracticeArea = {
  id: "erbrecht",
  label: "Erbrecht",
  blurb: "Pflichtteil, Testament, Erbschein, Erbengemeinschaft, Ausschlagung.",
  icon: "scroll",
  entryStepId: "topic",
  steps,
  scorePriority,
};
