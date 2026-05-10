import type { Lead } from "@/lib/types";

import { leadHeadline, leadHtml, leadPlainText } from "../format";
import type {
  EmailChannelConfig,
  NotificationChannel,
  NotificationResult,
} from "../types";

/**
 * Email-Channel über SMTP (nodemailer wird lazy importiert,
 * damit das Paket nicht für jede Installation Pflicht ist).
 *
 * SMTP-Settings kommen aus der Env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE
 *
 * Outlook  → smtp.office365.com:587 (STARTTLS)
 * Gmail    → smtp.gmail.com:587 (App-Password!)
 * Eigener  → beliebig
 *
 * Microsoft Graph (OAuth-flow für 365 ohne SMTP) ist als zweiter
 * Email-Transport vorgesehen, kommt aber nach Launch.
 */
export class EmailChannel implements NotificationChannel {
  readonly id: string;
  private cfg: EmailChannelConfig;
  private dashboardUrl?: string;
  private kanzleiName: string;

  constructor(cfg: EmailChannelConfig, opts: { dashboardUrl?: string; kanzleiName: string }) {
    this.cfg = cfg;
    this.id = `email:${cfg.label}`;
    this.dashboardUrl = opts.dashboardUrl;
    this.kanzleiName = opts.kanzleiName;
  }

  async send(lead: Lead): Promise<NotificationResult> {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? "587");
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = this.cfg.from || process.env.SMTP_FROM || user;
    const secure = process.env.SMTP_SECURE === "true";

    if (!host || !user || !pass || !from) {
      return {
        channel: this.id,
        ok: false,
        error: "SMTP-Konfiguration unvollständig (SMTP_HOST/USER/PASS/FROM).",
      };
    }

    let nodemailer: typeof import("nodemailer");
    try {
      // Lazy import — kein harter Build-Failure ohne nodemailer
      nodemailer = (await import("nodemailer")) as typeof import("nodemailer");
    } catch {
      return {
        channel: this.id,
        ok: false,
        error: "nodemailer nicht installiert. `npm install nodemailer` ausführen.",
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from,
        to: this.cfg.to.join(","),
        cc: this.cfg.cc?.join(","),
        subject: leadHeadline(lead, this.kanzleiName),
        text: leadPlainText(lead, { dashboardUrl: this.dashboardUrl }),
        html: leadHtml(lead, { dashboardUrl: this.dashboardUrl }),
      });
      return { channel: this.id, ok: true };
    } catch (e) {
      return {
        channel: this.id,
        ok: false,
        error: e instanceof Error ? e.message : "Unbekannter SMTP-Fehler",
      };
    }
  }
}
