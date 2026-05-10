import type { Lead } from "@/lib/types";

import type {
  NotificationChannel,
  NotificationResult,
  TeamsChannelConfig,
} from "../types";

/**
 * Microsoft Teams Incoming Webhook (Office365Connector / Adaptive Card).
 *
 * Setup pro Kanzlei:
 *   1. Teams-Channel → "…" → "Connectors" → "Incoming Webhook" → Name + Bild → erstellen
 *   2. Webhook-URL kopieren und in tenant.config.ts → notifications eintragen
 *
 * Format: MessageCard (klassisch, breit kompatibel; Adaptive-Card-Migration
 * empfohlen, sobald Microsoft den MessageCard-Pfad endgültig sunsettet).
 */
export class TeamsChannel implements NotificationChannel {
  readonly id: string;
  private cfg: TeamsChannelConfig;
  private dashboardUrl?: string;
  private kanzleiName: string;

  constructor(cfg: TeamsChannelConfig, opts: { dashboardUrl?: string; kanzleiName: string }) {
    this.cfg = cfg;
    this.id = `teams:${cfg.label}`;
    this.dashboardUrl = opts.dashboardUrl;
    this.kanzleiName = opts.kanzleiName;
  }

  async send(lead: Lead): Promise<NotificationResult> {
    const facts = [
      { name: "Mandant", value: `${lead.contact.firstName} ${lead.contact.lastName}` },
      { name: "E-Mail", value: lead.contact.email },
      { name: "Telefon", value: lead.contact.phone },
      { name: "PLZ", value: lead.contact.postalCode },
      { name: "Dringlichkeit", value: lead.urgency },
      { name: "Priorität (intern)", value: lead.priority.tier },
      { name: "Eingegangen", value: new Date(lead.createdAt).toLocaleString("de-DE") },
    ];

    const sections: unknown[] = [
      {
        activityTitle: `Neue Anfrage · ${lead.areaLabel}`,
        activitySubtitle: this.kanzleiName,
        facts,
        markdown: true,
      },
    ];

    if (lead.aiSummary) {
      sections.push({
        title: "Zusammenfassung",
        text: lead.aiSummary,
      });
    }
    if (lead.priority.signals.length) {
      sections.push({
        title: "Bearbeitungs-Signale",
        text: lead.priority.signals.map((s) => `- ${s.label}`).join("  \n"),
      });
    }

    const payload: Record<string, unknown> = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: `Neue Anfrage · ${lead.areaLabel}`,
      themeColor: "0F4C81",
      title: `Neue Anfrage · ${lead.areaLabel}`,
      sections,
    };

    if (this.dashboardUrl) {
      payload.potentialAction = [
        {
          "@type": "OpenUri",
          name: "Im Dashboard öffnen",
          targets: [{ os: "default", uri: `${this.dashboardUrl}/team/lead/${lead.id}` }],
        },
      ];
    }

    try {
      const res = await fetch(this.cfg.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        return {
          channel: this.id,
          ok: false,
          error: `Teams HTTP ${res.status}: ${await res.text().catch(() => "")}`,
        };
      }
      return { channel: this.id, ok: true };
    } catch (e) {
      return {
        channel: this.id,
        ok: false,
        error: e instanceof Error ? e.message : "Unbekannter Teams-Fehler",
      };
    }
  }
}
