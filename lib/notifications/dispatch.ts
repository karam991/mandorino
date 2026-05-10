import type { Lead } from "@/lib/types";

import { EmailChannel } from "./channels/email";
import { SlackChannel } from "./channels/slack";
import { TeamsChannel } from "./channels/teams";
import { WebhookChannel } from "./channels/webhook";
import type {
  NotificationChannel,
  NotificationChannelConfig,
  NotificationResult,
} from "./types";

interface DispatchOptions {
  channels: NotificationChannelConfig[];
  kanzleiName: string;
  /** Basis-URL der Mandorino-Instanz für Dashboard-Deeplinks. */
  dashboardUrl?: string;
}

/**
 * Materialisiert die Channel-Configs in echte Channel-Instanzen.
 * Trennung von Config und Implementierung erlaubt es, die Configs
 * (z.B. Webhook-URLs) später aus DB/Env statt aus tenant.config zu lesen.
 */
export function buildChannels(opts: DispatchOptions): NotificationChannel[] {
  const ctx = { kanzleiName: opts.kanzleiName, dashboardUrl: opts.dashboardUrl };
  const out: NotificationChannel[] = [];
  for (const c of opts.channels) {
    switch (c.kind) {
      case "email":
        out.push(new EmailChannel(c, ctx));
        break;
      case "slack":
        out.push(new SlackChannel(c, ctx));
        break;
      case "teams":
        out.push(new TeamsChannel(c, ctx));
        break;
      case "webhook":
        out.push(new WebhookChannel(c, ctx));
        break;
    }
  }
  return out;
}

/**
 * Versendet einen neuen Lead parallel an alle konfigurierten Channels.
 * Fehler einzelner Channels brechen NICHT den Vorgang ab — sie werden
 * geloggt und als `NotificationResult[]` zurückgegeben. Der Lead ist
 * bereits gespeichert; im worst case verliert die Kanzlei nur die
 * Push-Benachrichtigung (Lead bleibt im Dashboard sichtbar).
 */
export async function dispatchLead(
  lead: Lead,
  opts: DispatchOptions,
): Promise<NotificationResult[]> {
  if (opts.channels.length === 0) return [];
  const channels = buildChannels(opts);
  const settled = await Promise.allSettled(channels.map((c) => c.send(lead)));
  return settled.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      channel: channels[i]?.id ?? "unknown",
      ok: false,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });
}
