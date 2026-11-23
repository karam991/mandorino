import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { TENANT } from "@/lib/tenant.config";

export const metadata: Metadata = { title: "Datenschutzerklärung" };

/**
 * Datenschutzerklärung (Entwurf). Beschreibt die tatsächlichen Datenflüsse der
 * App; Empfänger-Abschnitte erscheinen nur, wenn die jeweilige Integration per
 * Umgebungsvariable aktiv ist. Rechtliche Prüfung/Ergänzung durch die Kanzlei nötig.
 */
export default function DatenschutzPage() {
  const p = TENANT.legal.provider;
  const usesMistral = Boolean(process.env.MISTRAL_API_KEY);
  const usesSupabase = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const usesSmtp = Boolean(process.env.SMTP_HOST);

  return (
    <LegalPage title="Datenschutzerklärung">
      <section>
        <h2>1. Verantwortlicher</h2>
        <p>
          {p.name}, {p.street}, {p.postalCity}
          <br />
          E-Mail: <a className="underline" href={`mailto:${p.email}`}>{p.email}</a>, Telefon: {p.phone}
        </p>
      </section>

      <section>
        <h2>2. Welche Daten wir verarbeiten</h2>
        <p>Wenn Sie über das Anfrage-Formular (Chat) Kontakt aufnehmen, verarbeiten wir:</p>
        <ul>
          <li>Ihre Kontaktdaten (Name, E-Mail, Telefon, Postleitzahl; bei Unternehmen Firmenangaben),</li>
          <li>
            die von Ihnen geschilderten Angaben zu Ihrem Anliegen (Rechtsgebiet, Sachverhalt,
            Dringlichkeit, Angaben zu Rechtsschutzversicherung und Streitwert, Anmerkungen),
          </li>
          <li>eine daraus erstellte neutrale Zusammenfassung Ihrer Angaben,</li>
          <li>Zeitpunkt Ihrer Anfrage und Ihre erteilte Einwilligung.</li>
        </ul>
        <p>
          Beim Aufruf der Seite verarbeiten wir technisch notwendige Verbindungsdaten (z. B.
          IP-Adresse). Zum Schutz vor Missbrauch wird die IP-Adresse kurzzeitig im Arbeitsspeicher
          für eine Anfragebegrenzung genutzt und nicht dauerhaft gespeichert.
        </p>
      </section>

      <section>
        <h2>3. Zwecke und Rechtsgrundlagen</h2>
        <ul>
          <li>
            Bearbeitung Ihrer Anfrage und Kontaktaufnahme durch die Kanzlei: Ihre Einwilligung
            (Art. 6 Abs. 1 lit. a DSGVO) sowie die Durchführung vorvertraglicher Maßnahmen auf Ihre
            Anfrage (Art. 6 Abs. 1 lit. b DSGVO).
          </li>
          <li>
            Sicherheit und Missbrauchsschutz des Angebots: berechtigtes Interesse
            (Art. 6 Abs. 1 lit. f DSGVO).
          </li>
        </ul>
        <p>
          Dieses Angebot ersetzt keine Rechtsberatung. Eine rechtliche Bewertung findet erst im
          persönlichen Gespräch mit der Kanzlei statt.
        </p>
      </section>

      <section>
        <h2>4. Empfänger und eingesetzte Dienstleister</h2>
        <ul>
          <li>Hosting der Anwendung: Vercel Inc. [Hosting-Region und Vertragsgrundlage eintragen].</li>
          {usesSupabase && (
            <li>
              Speicherung der Anfragen und Anmeldung des Kanzlei-Teams: Supabase
              [Datenbank-Region und Vertragsgrundlage eintragen].
            </li>
          )}
          {usesMistral && (
            <li>
              Erstellung der neutralen Zusammenfassung Ihrer Angaben: Mistral AI (Frankreich). Dabei
              werden Ihre Angaben zum Anliegen übermittelt, nicht Ihre Kontaktdaten.
            </li>
          )}
          {usesSmtp && (
            <li>Versand der Benachrichtigung an die Kanzlei: [E-Mail-Dienstleister eintragen].</li>
          )}
        </ul>
        <p>Mit den Dienstleistern bestehen, soweit erforderlich, Auftragsverarbeitungsverträge.</p>
      </section>

      <section>
        <h2>5. Speicherdauer</h2>
        <p>{p.retention}</p>
      </section>

      <section>
        <h2>6. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO). Eine erteilte Einwilligung können
          Sie jederzeit mit Wirkung für die Zukunft widerrufen. Wenden Sie sich dazu an{" "}
          <a className="underline" href={`mailto:${p.email}`}>{p.email}</a>.
        </p>
        <p>
          Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.
          Zuständig: {p.supervisoryAuthority}
        </p>
      </section>
    </LegalPage>
  );
}
