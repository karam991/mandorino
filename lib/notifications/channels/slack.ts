import type { Lead } from "@/lib/types";

import type {
  NotificationChannel,
  NotificationResult,
  SlackChannelConfig,
} from "../types";

/**
 * Slack Incoming Webhook.
 *
 * Setup pro Kanzlei:
 *   1. Slack-Workspace → Apps → "Incoming Webhooks" → neuen Webhook im Ziel-Channel anlegen
 *   2. Webhook-URL kopieren und in tenant.config.ts → notifications eintragen
 *
 * Format: Block Kit (siehe https://api.slack.com/block-kit)
 */
export class SlackChannel implements NotificationChannel {
  readonly id: string;
  private cfg: SlackChannelConfig;
  private dashboardUrl?: string;
  private kanzleiName: string;

  constructor(cfg: SlackChannelConfig, opts: { dashboardUrl?: string; kanzleiName: string }) {
    this.cfg = cfg;
    this.id = `slack:${cfg.label}`;
    this.dashboardUrl = opts.dashboardUrl;
    this.kanzleiName = opts.kanzleiName;
  }

  async send(lead: Lead): Promise<NotificationResult> {
    const link = this.dashboardUrl ? `${this.dashboardUrl}/team/lead/${lead.id}` : null;
    const blocks: unknown[] = [
      {
        type: "header",
        text: { type: "plain_text", text: `Neue Anfrage · ${lead.areaLabel}` },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Mandant:*\n${lead.contact.firstName} ${lead.contact.lastName}` },
          { type: "mrkdwn", text: `*Priorität (intern):*\n${lead.priority.tier}` },
          { type: "mrkdwn", text: `*E-Mail:*\n${lead.contact.email}` },
          { type: "mrkdwn", text: `*Telefon:*\n${lead.contact.phone}` },
          { type: "mrkdwn", text: `*PLZ:*\n${lead.contact.postalCode}` },
          { type: "mrkdwn", text: `*Dringlichkeit:*\n${lead.urgency}` },
        ],
      },
    ];

    if (lead.aiSummary) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `*Zusammenfassung*\n${truncate(lead.aiSummary, 2800)}` },
      });
    }

    if (lead.priority.signals.length > 0) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Bearbeitungs-Signale*\n${lead.priority.signals
            .map((s) => `• ${s.label}`)
            .join("\n")}`,
        },
      });
    }

    if (link) {
      blocks.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Im Dashboard öffnen" },
            url: link,
            style: "primary",
          },
        ],
      });
    }

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${this.kanzleiName} · Mandorino · keine Rechtsberatung`,
        },
      ],
    });

    try {
      const res = await fetch(this.cfg.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `Neue Anfrage · ${lead.areaLabel}`, blocks }),
      });
      if (!res.ok) {
        return {
          channel: this.id,
          ok: false,
          error: `Slack HTTP ${res.status}: ${await res.text().catch(() => "")}`,
        };
      }
      return { channel: this.id, ok: true };
    } catch (e) {
      return {
        channel: this.id,
        ok: false,
        error: e instanceof Error ? e.message : "Unbekannter Slack-Fehler",
      };
    }
  }
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
