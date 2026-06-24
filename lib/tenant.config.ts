import type { PracticeAreaId } from "./areas/registry";
import type { NotificationChannelConfig } from "./notifications/types";

/**
 * Mandorino White-Label-Konfiguration.
 *
 * Pro Deployment = eine Kanzlei. Diese Datei wird beim Onboarding
 * angepasst (Logo, Farben, aktivierte Rechtsgebiete, Team).
 *
 * In Zukunft: aus DB/Env-Vars laden statt hartkodiert.
 */

export interface TenantTeamMember {
  id: string;
  name: string;
  /**
   * E-Mail = Whitelist-Schlüssel. Muss exakt mit der Adresse des Supabase-
   * Auth-Users übereinstimmen (oder im MVP-Fallback mit der Login-Eingabe).
   */
  email: string;
  /**
   * Optional. Nur im MVP-Dev-Modus benutzt (ohne Supabase Auth).
   * In Produktion wegslassen — dann erzwingt authStore zwingend Supabase.
   */
  password?: string;
  role: "admin" | "bearbeiter";
}

export interface TenantBrand {
  /** Anzeigename der Kanzlei (Header, Footer, E-Mail). */
  kanzleiName: string;
  /** Kurzes Tagline unter dem Logo. */
  tagline: string;
  /** Pfad zu /public oder externe URL. */
  logoUrl: string | null;
  /** Primärfarbe (HEX). Wird zur CSS-Variable --brand-primary. */
  primary: string;
  /** Akzentfarbe (HEX). --brand-accent. */
  accent: string;
}

export interface TenantLegal {
  impressumUrl: string;
  datenschutzUrl: string;
  /** Sichtbar im Disclaimer: „Ein Anwalt unserer Kanzlei meldet sich…" */
  rueckmeldungInnerhalb: string; // z.B. "24 Stunden (werktags)"
}

export interface TenantConfig {
  brand: TenantBrand;
  legal: TenantLegal;
  /** Reihenfolge bestimmt UI-Reihenfolge. Nur diese Areas sind aktiv. */
  practiceAreas: PracticeAreaId[];
  team: TenantTeamMember[];
  /**
   * Compliance-Toggle: Streitwert-Range im Mandanten-UI anzeigen?
   * Default false — vor Launch durch Anwalt prüfen lassen, dann togglen.
   */
  showStreitwertRangeForClient: boolean;
  /**
   * Pluggable Benachrichtigungs-Channels für eingehende Leads.
   * Beliebig viele parallel: Email + Slack + Teams + Webhook.
   * Sensitive URLs (Slack/Teams Webhook, SMTP-Passwort) gehören in
   * Produktion in Env-Vars; hier nur für die MVP-Demo direkt im Code.
   */
  notifications: NotificationChannelConfig[];
}

/**
 * Demo-Tenant: fiktive Kanzlei „Hartmann & Kollegen".
 *
 * Diese Identität läuft öffentlich auf mandorino.vercel.app und wird in
 * Sales-Demos verwendet. Sie matched die Mock-Kanzlei-Website
 * (hartmann-kollegen-demo.vercel.app) — Header, Embed-Modal und
 * Mandorino-Tool zeigen alle denselben Kanzlei-Namen, damit der
 * Pitch konsistent wirkt.
 *
 * Beim Onboarding einer echten Kanzlei: kompletten Block ersetzen.
 */
export const TENANT: TenantConfig = {
  brand: {
    kanzleiName: "Hartmann & Kollegen",
    tagline: "Rechtsanwälte · Verstehen. Strukturieren. Vertreten.",
    logoUrl: null, // null → Text-Logo-Fallback
    primary: "#13315C", // ink
    accent: "#C9A86A", // gold
  },
  legal: {
    impressumUrl: "/impressum",
    datenschutzUrl: "/datenschutz",
    rueckmeldungInnerhalb: "24 Stunden (werktags)",
  },
  practiceAreas: [
    "arbeitsrecht",
    "verkehrsrecht",
    "digitales",
    "mietrecht",
    "erbrecht",
  ],
  // Demo-Logins für Sales-Pitches.
  // Passwörter sind absichtlich „demo-tauglich": kurz genug zum Live-Tippen,
  // aber nicht offensichtlich Test (kein „kanzlei123"). Vor Production-Launch
  // einer echten Kanzlei: Passwörter raus, Supabase-Auth einsetzen.
  team: [
    {
      id: "user_admin",
      name: "Dr. Thomas Hartmann",
      email: "t.hartmann@hartmann-kollegen.de",
      password: "Demo2026!",
      role: "admin",
    },
    {
      id: "user_assistenz",
      name: "Sandra Bauer",
      email: "s.bauer@hartmann-kollegen.de",
      password: "Demo2026!",
      role: "bearbeiter",
    },
  ],
  showStreitwertRangeForClient: false,
  notifications: [
    // --- Beispiele — pro Kanzlei aktivieren / leeren ---
    // {
    //   kind: "email",
    //   label: "Sekretariat",
    //   to: ["leads@kanzlei-beispiel.de"],
    //   cc: ["partner@kanzlei-beispiel.de"],
    // },
    // {
    //   kind: "slack",
    //   label: "#leads",
    //   webhookUrl: process.env.SLACK_WEBHOOK_URL ?? "",
    // },
    // {
    //   kind: "teams",
    //   label: "Kanzlei-Team",
    //   webhookUrl: process.env.TEAMS_WEBHOOK_URL ?? "",
    // },
    // {
    //   kind: "webhook",
    //   label: "n8n / CRM",
    //   url: process.env.GENERIC_WEBHOOK_URL ?? "",
    //   headers: { "X-Auth": process.env.WEBHOOK_TOKEN ?? "" },
    // },
  ],
};
