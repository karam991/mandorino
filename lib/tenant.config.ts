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
  /** Mandarinen-Maskottchen auf den öffentlichen Seiten der Kanzlei zeigen (Standard: aus). */
  mascot?: boolean;
}

export interface TenantLegal {
  impressumUrl: string;
  datenschutzUrl: string;
  /** Sichtbar im Disclaimer: „Ein Anwalt unserer Kanzlei meldet sich…" */
  rueckmeldungInnerhalb: string; // z.B. "24 Stunden (werktags)"
  /**
   * Angaben für /impressum und /datenschutz (Anbieterkennzeichnung + Verantwortlicher).
   * Alles, was noch in eckigen Klammern steht („[…]"), gilt als nicht ausgefüllt —
   * die Seiten zeigen dann einen sichtbaren „Entwurf"-Hinweis.
   */
  provider: {
    /** Name der Kanzlei inkl. Rechtsform, z.B. „Hartmann & Kollegen Rechtsanwälte PartG mbB". */
    name: string;
    street: string;
    postalCity: string;
    email: string;
    phone: string;
    /** Vertretungsberechtigte Person(en). */
    representative: string;
    /** Berufsbezeichnung + Staat der Verleihung. */
    professionalTitle: string;
    /** Zuständige Rechtsanwaltskammer inkl. Anschrift/URL. */
    chamber: string;
    /** USt-IdNr. oder Platzhalter, falls vorhanden. */
    vatId: string;
    /** Zuständige Datenschutz-Aufsichtsbehörde. */
    supervisoryAuthority: string;
    /** Aufbewahrungs-/Löschfrist für Anfragen, die nicht zum Mandat führen. */
    retention: string;
  };
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
    mascot: true, // nur Demo-Kanzlei; ohne diesen Wert bleibt die Mandarine auf Landing/Danke aus
  },
  legal: {
    impressumUrl: "/impressum",
    datenschutzUrl: "/datenschutz",
    rueckmeldungInnerhalb: "24 Stunden (werktags)",
    // Fiktive Demo-Angaben. Beim Onboarding einer echten Kanzlei komplett ersetzen.
    provider: {
      name: "Hartmann & Kollegen Rechtsanwälte (Demo)",
      street: "Musterstraße 12",
      postalCity: "10115 Berlin",
      email: "kontakt@hartmann-kollegen.de",
      phone: "+49 30 0000000",
      representative: "Dr. Thomas Hartmann",
      professionalTitle: "Rechtsanwalt (verliehen in der Bundesrepublik Deutschland)",
      chamber: "[Zuständige Rechtsanwaltskammer eintragen]",
      vatId: "[USt-IdNr. eintragen oder Zeile streichen]",
      supervisoryAuthority: "[Zuständige Datenschutz-Aufsichtsbehörde eintragen]",
      retention: "[Löschfrist für nicht mandatierte Anfragen eintragen]",
    },
  },
  practiceAreas: [
    "arbeitsrecht",
    "verkehrsrecht",
    "digitales",
    "mietrecht",
    "erbrecht",
  ],
  // Team-Verzeichnis für Anzeige/Zuweisung. KEINE Passwörter hier — die Zugriffs-
  // berechtigung kommt aus der DB-Tabelle `tenant_team` + Supabase Auth.
  // Demo-Modus: gemeinsames Passwort über NEXT_PUBLIC_DEMO_PASSWORD (siehe authStore).
  team: [
    {
      id: "user_admin",
      name: "Dr. Thomas Hartmann",
      email: "t.hartmann@hartmann-kollegen.de",
      role: "admin",
    },
    {
      // Der Supabase-Auth-User wird im Supabase-Dashboard angelegt
      // (Authentication > Users > Add user) und in `tenant_team` eingetragen.
      id: "user_admin_demo",
      name: "Admin",
      email: "admin@hartmann-kollegen.de",
      role: "admin",
    },
    {
      id: "user_assistenz",
      name: "Sandra Bauer",
      email: "s.bauer@hartmann-kollegen.de",
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
