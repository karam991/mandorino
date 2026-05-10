import { getPracticeArea, listPracticeAreas } from "./areas/registry";
import type { AreaStep } from "./areas/types";
import { TENANT } from "./tenant.config";
import { getActivePracticeAreaIds } from "./tenantOverrides";
import {
  CLAIM_VALUE_BUCKETS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPES,
  INSURANCE_STATUS,
  URGENCIES,
  type ClaimValueBucket,
  type ClientType,
  type InsuranceStatus,
  type LeadDraft,
} from "./types";

/**
 * Globaler Chat-Flow.
 *
 * Aufbau:
 *   intro → area_select → <area-spezifische Steps> → urgency → notes
 *         → contact → consent → summary → done
 *
 * Die area-spezifischen Steps kommen aus `lib/areas/<area>.ts`.
 * StepIds sind dann global eindeutig durch das Schema „area:<id>".
 */

export type GlobalStepId =
  | "intro"
  | "client_type"
  | "area_select"
  | "area_intro"
  | "urgency"
  | "notes"
  | "insurance"
  | "insurance_provider"
  | "claim_value"
  | "contact"
  | "consent"
  | "summary"
  | "done";

/**
 * Eine StepId ist entweder eine globale oder ein qualifizierter Area-Step
 * im Format „area:<localId>". Beispiel: „arbeitsrecht:topic".
 */
export type StepId = GlobalStepId | string;

export type StepInputType =
  | { kind: "info" }
  | { kind: "choice"; options: readonly string[] }
  | { kind: "multi"; options: readonly string[]; allowEmpty?: boolean }
  | { kind: "date" }
  | { kind: "text"; multiline?: boolean; placeholder?: string; optional?: boolean }
  | { kind: "contact" }
  | { kind: "consent" }
  | { kind: "review" };

export interface RuntimeStep {
  id: StepId;
  botMessage: (draft: LeadDraft) => string;
  inputType: StepInputType;
  apply?: (answer: unknown, draft: LeadDraft) => void;
  next: (draft: LeadDraft) => StepId | null;
}

/** Aktive Areas — dynamisch, kann vom Team im Dashboard umgeschaltet werden. */
function getActiveAreas() {
  return listPracticeAreas(getActivePracticeAreaIds());
}

const GLOBAL_STEPS: Record<GlobalStepId, RuntimeStep> = {
  intro: {
    id: "intro",
    botMessage: () =>
      `Hallo und herzlich willkommen bei ${TENANT.brand.kanzleiName}. ` +
      `Ich bin Ihr digitaler Assistent und helfe Ihnen, Ihr Anliegen in Ruhe zu schildern. ` +
      `Wichtig vorab: Dieser Chat ersetzt keine Rechtsberatung — ` +
      `eine Anwältin oder ein Anwalt unserer Kanzlei meldet sich anschließend persönlich bei Ihnen ` +
      `(in der Regel innerhalb ${TENANT.legal.rueckmeldungInnerhalb}).`,
    inputType: { kind: "info" },
    next: () => "client_type",
  },
  /**
   * Privatperson vs. Unternehmen — entscheidet später, ob der Kontakt-Step
   * zusätzlich Firmenname/Position/USt-ID abfragt.
   * Diese Frage kommt VOR der Rechtsgebiets-Auswahl, weil sie auch die
   * Sprache („Sie als Arbeitnehmer:in" vs. „Sie als Arbeitgeber:in") prägen
   * könnte (für künftige Area-Varianten vorbereitet).
   */
  client_type: {
    id: "client_type",
    botMessage: () =>
      "Vorab eine kurze Frage: Stellen Sie die Anfrage als Privatperson " +
      "oder im Auftrag eines Unternehmens / als Selbstständige:r? " +
      "Das hilft uns, die richtigen Ansprechpersonen vorzubereiten.",
    inputType: {
      kind: "choice",
      options: CLIENT_TYPES.map((t) => CLIENT_TYPE_LABELS[t]),
    },
    apply: (a, d) => {
      const label = a as string;
      const entry = CLIENT_TYPES.find((t) => CLIENT_TYPE_LABELS[t] === label);
      if (entry) d.clientType = entry as ClientType;
    },
    next: (draft) => {
      // Deep-Link (?area=xxx) hat areaId schon gesetzt — direkt in den Area-Flow,
      // sonst über die normale Rechtsgebiets-Auswahl.
      if (draft.areaId) {
        const area = getPracticeArea(draft.areaId);
        if (area) return `${area.id}:${area.entryStepId}`;
      }
      return "area_select";
    },
  },
  area_select: {
    id: "area_select",
    botMessage: () => "In welchem Rechtsgebiet liegt Ihr Anliegen?",
    // Wird in `getStep()` mit den jeweils aktuellen aktiven Areas überschrieben.
    inputType: { kind: "choice", options: [] },
    apply: (answer, draft) => {
      const label = answer as string;
      const area = getActiveAreas().find((a) => a.label === label);
      if (!area) return;
      draft.areaId = area.id;
      draft.areaLabel = area.label;
      draft.areaData = {};
    },
    next: (draft) => {
      const area = draft.areaId ? getPracticeArea(draft.areaId) : null;
      if (!area) return null;
      return `${area.id}:${area.entryStepId}`;
    },
  },
  /**
   * Begrüßung bei Deep-Link `/chat?area=verkehrsrecht`.
   * Bestätigt dem Mandanten, dass das Rechtsgebiet bereits gesetzt ist,
   * und enthält den Disclaimer (sonst hätten wir den Hinweis aus „intro" verpasst).
   */
  area_intro: {
    id: "area_intro",
    botMessage: (draft) =>
      `Hallo und herzlich willkommen bei ${TENANT.brand.kanzleiName}. ` +
      `Sie haben eine Frage zum Rechtsgebiet "${draft.areaLabel ?? "Recht"}" — ich helfe Ihnen, ` +
      `Ihr Anliegen Schritt für Schritt zu schildern. ` +
      `Wichtig vorab: Dieser Chat ersetzt keine Rechtsberatung. ` +
      `Eine Anwältin oder ein Anwalt unserer Kanzlei meldet sich anschließend persönlich ` +
      `(in der Regel innerhalb ${TENANT.legal.rueckmeldungInnerhalb}).`,
    inputType: { kind: "info" },
    next: (draft) => {
      // Bei Deep-Link wurde clientType noch nicht gefragt — nachholen.
      if (!draft.clientType) return "client_type";
      const area = draft.areaId ? getPracticeArea(draft.areaId) : null;
      if (!area) return "area_select";
      return `${area.id}:${area.entryStepId}`;
    },
  },
  urgency: {
    id: "urgency",
    botMessage: () => "Wie dringend ist Ihr Anliegen?",
    inputType: { kind: "choice", options: URGENCIES },
    apply: (a, d) => {
      d.urgency = a as LeadDraft["urgency"];
    },
    next: () => "notes",
  },
  notes: {
    id: "notes",
    botMessage: () =>
      "Möchten Sie noch etwas ergänzen, das Ihnen wichtig erscheint? Sie können dieses Feld leer lassen.",
    inputType: {
      kind: "text",
      multiline: true,
      placeholder: "Optionale Ergänzung in eigenen Worten",
      optional: true,
    },
    apply: (a, d) => {
      const v = (a as string).trim();
      if (v) d.userNotes = v;
    },
    next: () => "insurance",
  },
  insurance: {
    id: "insurance",
    botMessage: () =>
      "Haben Sie eine Rechtsschutz-Versicherung, die für dieses Anliegen einspringen könnte? " +
      "Diese Information hilft der Kanzlei bei der Vorbereitung — sie ist für eine Anfrage nicht zwingend.",
    inputType: { kind: "choice", options: INSURANCE_STATUS },
    apply: (a, d) => {
      const status = a as InsuranceStatus;
      d.insurance = { status };
    },
    next: (d) => (d.insurance?.status === "Ja" ? "insurance_provider" : "claim_value"),
  },
  insurance_provider: {
    id: "insurance_provider",
    botMessage: () =>
      "Bei welcher Versicherung sind Sie rechtsschutzversichert? " +
      'Wenn Sie sich nicht sicher sind, schreiben Sie einfach „weiß ich nicht".',
    inputType: {
      kind: "text",
      placeholder: "z.B. ARAG, Allianz, DEVK …",
      optional: true,
    },
    apply: (a, d) => {
      const v = (a as string).trim();
      if (!d.insurance) d.insurance = { status: "Ja" };
      if (v) d.insurance.provider = v;
    },
    next: () => "claim_value",
  },
  claim_value: {
    id: "claim_value",
    botMessage: () =>
      "Können Sie den Streitwert oder Sachwert grob einschätzen? " +
      "Damit ist der Geldbetrag gemeint, um den es in der Sache geht " +
      "(z.B. ausstehender Lohn, Schaden am Auto, Kaution …). " +
      "Eine grobe Spanne genügt — eine genaue Bewertung erfolgt später durch die Kanzlei.",
    inputType: { kind: "choice", options: CLAIM_VALUE_BUCKETS },
    apply: (a, d) => {
      d.claimValue = a as ClaimValueBucket;
    },
    next: () => "contact",
  },
  contact: {
    id: "contact",
    botMessage: () =>
      `Damit ${TENANT.brand.kanzleiName} Sie erreichen kann, brauchen wir noch Ihre Kontaktdaten. ` +
      `Diese Daten verwenden wir ausschließlich für die Bearbeitung Ihrer Anfrage.`,
    inputType: { kind: "contact" },
    apply: (a, d) => {
      const c = a as Pick<
        LeadDraft,
        | "firstName"
        | "lastName"
        | "email"
        | "phone"
        | "postalCode"
        | "companyName"
        | "contactPosition"
        | "vatId"
      >;
      d.firstName = c.firstName;
      d.lastName = c.lastName;
      d.email = c.email;
      d.phone = c.phone;
      d.postalCode = c.postalCode;
      if (d.clientType === "business") {
        d.companyName = c.companyName?.trim() || undefined;
        d.contactPosition = c.contactPosition?.trim() || undefined;
        d.vatId = c.vatId?.trim() || undefined;
      } else {
        // Sicherstellen, dass keine B2B-Reste hängenbleiben, wenn der User
        // den clientType über „Letzte Antwort ändern" zurückwechselt.
        d.companyName = undefined;
        d.contactPosition = undefined;
        d.vatId = undefined;
      }
    },
    next: () => "consent",
  },
  consent: {
    id: "consent",
    botMessage: () =>
      "Letzter Schritt: Bitte bestätigen Sie, dass wir Ihre Angaben zur Bearbeitung Ihrer Anfrage verarbeiten dürfen.",
    inputType: { kind: "consent" },
    apply: (a, d) => {
      d.consentGiven = a === true;
    },
    next: () => "summary",
  },
  summary: {
    id: "summary",
    botMessage: () =>
      "Vielen Dank! Hier ist eine kurze Zusammenfassung Ihrer Angaben. " +
      "Bitte prüfen Sie diese und übermitteln Sie sie anschließend an die Kanzlei.",
    inputType: { kind: "review" },
    next: () => "done",
  },
  done: {
    id: "done",
    botMessage: () => "Übermittelt.",
    inputType: { kind: "info" },
    next: () => null,
  },
};

/** Auflösen eines Area-Step-Strings („arbeitsrecht:topic"). */
function resolveAreaStep(stepId: string): { areaId: string; step: AreaStep } | null {
  const idx = stepId.indexOf(":");
  if (idx < 0) return null;
  const areaId = stepId.slice(0, idx);
  const localId = stepId.slice(idx + 1);
  const area = getPracticeArea(areaId);
  if (!area) return null;
  const step = area.steps[localId];
  if (!step) return null;
  return { areaId, step };
}

/** Liefert den Runtime-Step für eine StepId — global oder area-qualifiziert. */
export function getStep(stepId: StepId): RuntimeStep | null {
  if (stepId in GLOBAL_STEPS) {
    const step = GLOBAL_STEPS[stepId as GlobalStepId];
    // area_select bekommt Live-Options aus dem aktuellen Override (dynamisch).
    if (stepId === "area_select") {
      return {
        ...step,
        inputType: {
          kind: "choice",
          options: getActiveAreas().map((a) => a.label),
        },
      };
    }
    return step;
  }

  const resolved = resolveAreaStep(stepId);
  if (!resolved) return null;
  const { areaId, step } = resolved;

  return {
    id: stepId,
    botMessage: step.botMessage,
    inputType: step.inputType,
    apply: step.apply,
    next: (draft) => {
      const localNext = step.next(draft);
      // Wenn Area zu Ende → in den globalen Pfad zurück (urgency).
      if (localNext === null) return "urgency";
      return `${areaId}:${localNext}`;
    },
  };
}

export const ENTRY_STEP: StepId = "intro";
