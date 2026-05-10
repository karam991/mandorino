import type { Lead } from "@/lib/types";

/**
 * Pluggable Benachrichtigungs-Architektur.
 *
 * Pro Kanzlei können beliebig viele Channels parallel aktiv sein
 * (z.B. Email an die Sekretariats-Adresse + Slack ins Team-Channel).
 * Jeder Channel bekommt denselben Lead und entscheidet selbst, was
 * er daraus macht (Email-Body, Slack-Card, Teams-Adaptive-Card …).
 *
 * Tokens: KEINE Lead-Inhalte werden an externe LLM-Services geschickt;
 * lediglich neutrale Zusammenfassung + Kontaktdaten gehen an den
 * konfigurierten Channel der Kanzlei.
 */

export type NotificationChannelKind =
  | "email"
  | "slack"
  | "teams"
  | "webhook";

/** Eltern-Discriminator. Konkrete Configs siehe weiter unten. */
export type NotificationChannelConfig =
  | EmailChannelConfig
  | SlackChannelConfig
  | TeamsChannelConfig
  | WebhookChannelConfig;

export interface EmailChannelConfig {
  kind: "email";
  /** Anzeigename in den Logs. */
  label: string;
  /** Empfänger-Adressen — z.B. ["leads@kanzlei.de"]. */
  to: string[];
  /** Optional CC. */
  cc?: string[];
  /** Optional individueller Absender (sonst SMTP_FROM aus Env). */
  from?: string;
  /**
   * Transport: für MVP nur SMTP via Env. Outlook/Gmail werden ebenfalls
   * via SMTP angesprochen (smtp.office365.com / smtp.gmail.com).
   * Microsoft Graph als Variante folgt nach Launch.
   */
  transport?: "smtp";
}

export interface SlackChannelConfig {
  kind: "slack";
  label: string;
  /**
   * Slack Incoming Webhook URL. Der Endpoint wird in Slack pro
   * Channel/Workspace generiert.
   */
  webhookUrl: string;
}

export interface TeamsChannelConfig {
  kind: "teams";
  label: string;
  /** Microsoft Teams Incoming Webhook (Connector). */
  webhookUrl: string;
}

export interface WebhookChannelConfig {
  kind: "webhook";
  label: string;
  /** Beliebiger HTTP-Endpoint (Zapier, Make, n8n, eigenes CRM …). */
  url: string;
  /** Optional zusätzliche Header (Auth, Tokens …). */
  headers?: Record<string, string>;
}

/**
 * Ergebnis einer einzelnen Channel-Auslieferung.
 * Nicht-blockierend: Fehler werden geloggt, aber der Lead wird trotzdem
 * gespeichert. Sonst würde ein kaputter Slack-Webhook Mandanten-Anfragen
 * verschlucken.
 */
export interface NotificationResult {
  channel: string;
  ok: boolean;
  error?: string;
}

export interface NotificationChannel {
  /** Eindeutiger, menschen-lesbarer Bezeichner für Logs. */
  readonly id: string;
  send(lead: Lead): Promise<NotificationResult>;
}
