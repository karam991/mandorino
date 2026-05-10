import type { Lead } from "@/lib/types";

/**
 * Gemeinsame Formatierungs-Hilfen für alle Notification-Channels.
 * Halten Inhalte strikt deskriptiv — keine rechtliche Bewertung.
 */

function formatInsurance(lead: Lead): string | null {
  if (!lead.insurance) return null;
  if (lead.insurance.status === "Ja") {
    const provider = lead.insurance.provider?.trim();
    return provider
      ? `Rechtsschutz: ja (${provider}, Mandantenangabe)`
      : "Rechtsschutz: ja (Versicherer nicht genannt)";
  }
  if (lead.insurance.status === "Nein") return "Rechtsschutz: nein (Mandantenangabe)";
  return "Rechtsschutz: Mandant unsicher";
}

export function leadHeadline(lead: Lead, kanzleiName: string): string {
  const name = `${lead.contact.firstName} ${lead.contact.lastName}`.trim();
  return `[${kanzleiName}] Neue Anfrage · ${lead.areaLabel} · ${name}`;
}

/** Plaintext-Body für Email & Webhook. Bewusst nüchtern, ohne Marketing. */
export function leadPlainText(lead: Lead, opts: { dashboardUrl?: string } = {}): string {
  const lines: string[] = [];
  lines.push(`Neue Anfrage über Mandorino`);
  lines.push("");
  lines.push(`Rechtsgebiet: ${lead.areaLabel}`);
  lines.push(`Eingegangen:  ${new Date(lead.createdAt).toLocaleString("de-DE")}`);
  lines.push(`Priorität (intern, Sortier-Hilfe): ${lead.priority.tier}`);
  lines.push(`Status: ${lead.status}`);
  lines.push("");
  lines.push(`Mandant:`);
  lines.push(`  ${lead.contact.firstName} ${lead.contact.lastName}`);
  lines.push(`  E-Mail:  ${lead.contact.email}`);
  lines.push(`  Telefon: ${lead.contact.phone}`);
  lines.push(`  PLZ:     ${lead.contact.postalCode}`);
  lines.push(`  Dringlichkeit: ${lead.urgency}`);
  const ins = formatInsurance(lead);
  if (ins) lines.push(`  ${ins}`);
  if (lead.claimValue) lines.push(`  Streitwert (Mandantenschätzung): ${lead.claimValue}`);
  lines.push("");
  if (lead.aiSummary) {
    lines.push(`Zusammenfassung (${lead.aiSummarySource === "claude" ? "KI-Reformulierung" : "Strukturvorlage"}):`);
    lines.push(lead.aiSummary);
    lines.push("");
  }
  if (lead.priority.signals.length > 0) {
    lines.push(`Bearbeitungs-Signale (interne Sortier-Hilfe):`);
    for (const s of lead.priority.signals) lines.push(`  · ${s.label}`);
    lines.push("");
  }
  if (opts.dashboardUrl) {
    lines.push(`Im Dashboard öffnen: ${opts.dashboardUrl}/team/lead/${lead.id}`);
    lines.push("");
  }
  lines.push(`— Hinweis: Mandorino erbringt keine Rechtsberatung. Die rechtliche Bewertung übernimmt die Kanzlei.`);
  return lines.join("\n");
}

/** Minimaler HTML-Body — viele E-Mail-Clients erwarten beides. */
export function leadHtml(lead: Lead, opts: { dashboardUrl?: string } = {}): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const summary = lead.aiSummary
    ? `<p style="white-space:pre-wrap;background:#f7f7f5;padding:12px;border-radius:6px;border:1px solid #e5e5e0">${esc(lead.aiSummary)}</p>`
    : "";
  const signals = lead.priority.signals.length
    ? `<ul>${lead.priority.signals.map((s) => `<li>${esc(s.label)}</li>`).join("")}</ul>`
    : "";
  const link = opts.dashboardUrl
    ? `<p><a href="${opts.dashboardUrl}/team/lead/${esc(lead.id)}">Im Dashboard öffnen →</a></p>`
    : "";
  return `<div style="font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#222">
  <h2 style="margin:0 0 8px">Neue Anfrage über Mandorino</h2>
  <p><strong>Rechtsgebiet:</strong> ${esc(lead.areaLabel)}<br>
     <strong>Priorität (intern):</strong> ${esc(lead.priority.tier)}<br>
     <strong>Eingegangen:</strong> ${new Date(lead.createdAt).toLocaleString("de-DE")}</p>
  <h3 style="margin:16px 0 4px">Mandant</h3>
  <p>${esc(lead.contact.firstName)} ${esc(lead.contact.lastName)}<br>
     ${esc(lead.contact.email)} · ${esc(lead.contact.phone)} · PLZ ${esc(lead.contact.postalCode)}<br>
     Dringlichkeit: ${esc(lead.urgency)}${
       (() => {
         const ins = formatInsurance(lead);
         return ins ? `<br>${esc(ins)}` : "";
       })()
     }${lead.claimValue ? `<br>Streitwert (Mandantenschätzung): ${esc(lead.claimValue)}` : ""}</p>
  ${summary ? `<h3 style="margin:16px 0 4px">Zusammenfassung</h3>${summary}` : ""}
  ${signals ? `<h3 style="margin:16px 0 4px">Bearbeitungs-Signale</h3>${signals}` : ""}
  ${link}
  <p style="font-size:11px;color:#888;margin-top:24px">Mandorino erbringt keine Rechtsberatung. Die rechtliche Bewertung übernimmt die Kanzlei.</p>
</div>`;
}
