import type { LeadDraft } from "../types";

/**
 * Ein Step im Chat-Flow eines Rechtsgebiets.
 * Identische Mechanik wie zuvor in chatFlow.ts, aber pro Area gekapselt.
 */
export type StepInputType =
  | { kind: "info" }
  | { kind: "choice"; options: readonly string[] }
  | { kind: "multi"; options: readonly string[]; allowEmpty?: boolean }
  | { kind: "date" }
  | { kind: "text"; multiline?: boolean; placeholder?: string; optional?: boolean };

export interface AreaStep {
  /** Eindeutige ID innerhalb des Area-Flows. */
  id: string;
  /** Bot-Frage. Darf den Draft lesen, um Folgefragen zu personalisieren. */
  botMessage: (draft: LeadDraft) => string;
  inputType: StepInputType;
  /** Schreibt die Antwort in `draft.areaData[<key>]`. */
  apply?: (answer: unknown, draft: LeadDraft) => void;
  /** ID des nächsten Schritts oder null (= Ende des Area-Flows). */
  next: (draft: LeadDraft) => string | null;
}

/**
 * Bearbeitungs-Priorität für das Anwalts-Backend.
 * BEWUSST KEIN „Erfolgsaussicht"-Score — RDG-konform.
 *
 * Score-Logik liefert:
 *  - tier: "high" | "medium" | "low"
 *  - signals: kurze, neutrale Begründungen für die Sortierung
 *  - estimatedValueRange?: { min, max, label } — optional und je Area
 *    nur dann, wenn die Datenlage einen Streitwert sinnvoll andeutet.
 *    Anzeige beim Mandanten ist über tenant.config togglebar.
 */
export interface PrioritySignal {
  label: string;
  kind: "frist" | "vollstaendigkeit" | "streitwert" | "dringlichkeit" | "fit";
}

export interface PriorityResult {
  tier: "high" | "medium" | "low";
  numeric: number; // 0–100, für Sortierung
  signals: PrioritySignal[];
  estimatedValueRange?: {
    min: number;
    max: number;
    label: string;
  };
}

export interface PracticeArea {
  id: string;
  /** Kurzlabel im UI (z.B. „Arbeitsrecht"). */
  label: string;
  /** Erläuterungs-Sub-Label, ein Satz. */
  blurb: string;
  /** Emoji oder Icon-Identifier für Karten. Optional. */
  icon?: string;
  /** Erste StepId, mit der der Area-Flow beginnt. */
  entryStepId: string;
  /** Steps als Map. */
  steps: Record<string, AreaStep>;
  /** Lead-Priorität berechnen (rein businessseitig, KEINE rechtliche Bewertung). */
  scorePriority: (draft: LeadDraft) => PriorityResult;
}
