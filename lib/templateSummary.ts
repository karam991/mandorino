import type { LeadDraft } from "./types";

/**
 * Template-basierte Zusammenfassung als Fallback, wenn Claude nicht
 * verfügbar ist (kein API-Key, Netzwerkfehler, Rate-Limit etc.).
 *
 * Stilrichtlinie: rein deskriptiv, keine Bewertung, keine Empfehlung.
 * Funktioniert generisch über alle Practice-Areas hinweg.
 */
export function buildTemplateSummary(draft: LeadDraft): string {
  const lines: string[] = [];

  lines.push(`Rechtsgebiet: ${draft.areaLabel ?? "—"}.`);

  const data = draft.areaData;
  const seen = new Set<string>();

  function pushFromKey(key: string, label: string, transform?: (v: string) => string) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) {
      seen.add(key);
      lines.push(`${label}: ${transform ? transform(v) : v}.`);
    }
  }

  pushFromKey("topic", "Anliegen");
  pushFromKey("role", "Rolle des Mandanten");
  pushFromKey("party", "Partei-Rolle");
  pushFromKey("relation", "Verhältnis zum Erblasser");

  // Datums-Felder
  for (const dateKey of ["incidentDate", "deathDate"] as const) {
    const v = data[dateKey];
    if (typeof v === "string") {
      seen.add(dateKey);
      const formatted = new Date(v).toLocaleDateString("de-DE");
      const label = dateKey === "deathDate" ? "Datum des Erbfalls" : "Datum laut Mandant";
      lines.push(`${label}: ${formatted}.`);
    }
  }

  pushFromKey("terminationType", "Art der Kündigung");
  pushFromKey("terminationReason", "Genannter Kündigungsgrund (Mandantenangabe)", (v) => `„${v}"`);
  pushFromKey("employmentDuration", "Beschäftigungsdauer");
  pushFromKey("companySize", "Unternehmensgröße");
  pushFromKey("salaryRange", "Bruttogehalt-Range (Mandantenangabe)");
  pushFromKey("fault", "Schuld-Sicht des Mandanten");
  pushFromKey("injury", "Personenschäden");
  pushFromKey("damageRange", "Sachschaden-Range");
  pushFromKey("rentRange", "Mietkategorie");
  pushFromKey("estateRange", "Nachlass-Größenordnung");
  pushFromKey("testament", "Testament-Status");
  pushFromKey("description", "Schilderung des Mandanten", (v) => `„${v}"`);

  const docs = Array.isArray(data["documents"]) ? (data["documents"] as string[]) : [];
  if (docs.length > 0) {
    lines.push(`Vorliegende Dokumente: ${docs.join(", ")}.`);
  } else {
    lines.push("Keine Dokumente vom Mandanten als vorliegend angegeben.");
  }

  if (draft.urgency) {
    lines.push(`Dringlichkeit aus Sicht des Mandanten: ${draft.urgency}.`);
  }
  if (draft.insurance) {
    if (draft.insurance.status === "Ja") {
      const provider = draft.insurance.provider?.trim();
      lines.push(
        provider
          ? `Rechtsschutz-Versicherung: vorhanden (${provider}, Mandantenangabe).`
          : "Rechtsschutz-Versicherung: vorhanden (Versicherer nicht genannt).",
      );
    } else if (draft.insurance.status === "Nein") {
      lines.push("Rechtsschutz-Versicherung: nicht vorhanden (Mandantenangabe).");
    } else {
      lines.push("Rechtsschutz-Versicherung: Mandant unsicher.");
    }
  }
  if (draft.claimValue) {
    lines.push(`Streitwert-Spanne (Mandantenschätzung): ${draft.claimValue}.`);
  }
  if (draft.userNotes) {
    lines.push(`Eigene Ergänzung des Mandanten: „${draft.userNotes}".`);
  }

  lines.push(
    "Hinweis: Diese Zusammenfassung gibt ausschließlich die Angaben des Mandanten wieder und enthält keine rechtliche Bewertung.",
  );

  return lines.join(" ");
}
