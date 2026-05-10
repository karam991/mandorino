import type { Lead } from "@/lib/types";

import type {
  NotificationChannel,
  NotificationResult,
  WebhookChannelConfig,
} from "../types";

/**
 * Generischer HTTP-Webhook für Zapier, Make, n8n, eigene CRMs.
 *
 * Schickt das komplette Lead-Objekt als JSON. Empfänger entscheidet
 * selbst, welche Felder er nutzt.
 */
export class WebhookChannel implements NotificationChannel {
  readonly id: string;
  private cfg: WebhookChannelConfig;
  private dashboardUrl?: string;
  private kanzleiName: string;

  constructor(cfg: WebhookChannelConfig, opts: { dashboardUrl?: string; kanzleiName: string }) {
    this.cfg = cfg;
    this.id = `webhook:${cfg.label}`;
    this.dashboardUrl = opts.dashboardUrl;
    this.kanzleiName = opts.kanzleiName;
  }

  async send(lead: Lead): Promise<NotificationResult> {
    const payload = {
      event: "lead.created",
      tenant: this.kanzleiName,
      dashboardUrl: this.dashboardUrl
        ? `${this.dashboardUrl}/team/lead/${lead.id}`
        : null,
      lead,
      _disclaimer: "Mandorino erbringt keine Rechtsberatung.",
    };

    try {
      const res = await fetch(this.cfg.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.cfg.headers ?? {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        return {
          channel: this.id,
          ok: false,
          error: `Webhook HTTP ${res.status}: ${await res.text().catch(() => "")}`,
        };
      }
      return { channel: this.id, ok: true };
    } catch (e) {
      return {
        channel: this.id,
        ok: false,
        error: e instanceof Error ? e.message : "Unbekannter Webhook-Fehler",
      };
    }
  }
}
