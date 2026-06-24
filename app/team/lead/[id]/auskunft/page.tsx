"use client";

import { Fragment, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/authStore";
import { getLeadById } from "@/lib/leadStore";
import { TENANT } from "@/lib/tenant.config";
import { LEAD_STATUS_LABELS, type Lead } from "@/lib/types";

/**
 * Druckansicht für DSGVO-Auskunftsersuchen (Art. 15 DSGVO).
 *
 * Bewusst eigene Route ohne Header/Footer der App, damit der Browser-Print
 * direkt ein sauberes PDF erzeugt. Der Anwalt klickt „Drucken / Als PDF
 * speichern" und kann das Dokument dem Mandanten zusenden.
 *
 * Wir generieren kein PDF mit einer Library — Browser-Print spart eine
 * 200-KB-Dependency und liefert bessere Typografie.
 */
export default function AuskunftPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/team/login");
      return;
    }
    if (typeof params?.id === "string") {
      setLead(getLeadById(params.id));
    }
    setLoading(false);
  }, [params, router]);

  if (loading) return null;

  if (!lead) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-xl font-bold">Lead nicht gefunden</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 text-sm underline text-muted"
        >
          ← Zurück
        </button>
      </main>
    );
  }

  const ad = lead.areaData as Record<string, unknown>;
  const docs = Array.isArray(ad.documents) ? (ad.documents as string[]) : [];
  const sachdaten = Object.entries(ad).filter(([k, v]) => {
    if (k === "documents") return false;
    if (v === undefined || v === null) return false;
    if (typeof v === "string" && v.trim() === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { box-shadow: none !important; }
        }
        @page { margin: 2cm; size: A4; }
      `}</style>
      <main className="mx-auto max-w-3xl px-6 py-10 bg-white text-ink-dark min-h-screen print:py-0 print:px-0">
        {/* Steuerung — nicht im Druck */}
        <div className="no-print mb-8 flex items-center justify-between gap-3 border-b border-line pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-muted hover:underline"
          >
            ← Zurück
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              Tipp: Im Druckdialog „Als PDF speichern" wählen
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary text-sm"
            >
              Drucken / Als PDF speichern
            </button>
          </div>
        </div>

        {/* Briefkopf */}
        <header className="border-b border-line pb-4 mb-6">
          <div className="text-xs uppercase tracking-wider text-muted">
            {TENANT.brand.kanzleiName}
          </div>
          <h1 className="text-2xl font-bold mt-2 leading-tight">
            Auskunft über gespeicherte personenbezogene Daten
          </h1>
          <div className="text-xs text-muted mt-1">
            Nach Art. 15 DSGVO · Erstellt am{" "}
            {new Date().toLocaleDateString("de-DE")}
          </div>
        </header>

        <Section title="1. Über diese Auskunft">
          <p>
            Diese Auskunft dokumentiert die zu Ihrer Person bei{" "}
            {TENANT.brand.kanzleiName} über das Online-Anfrageformular erhobenen
            personenbezogenen Daten. Sie wird Ihnen auf Anfrage nach Art. 15
            DSGVO erteilt.
          </p>
        </Section>

        <Section title="2. Vorgang">
          <Dl>
            <Dt>Vorgangsnummer</Dt>
            <Dd>{lead.id}</Dd>
            <Dt>Eingang</Dt>
            <Dd>{new Date(lead.createdAt).toLocaleString("de-DE")}</Dd>
            <Dt>Aktueller Bearbeitungs-Status</Dt>
            <Dd>{LEAD_STATUS_LABELS[lead.status]}</Dd>
          </Dl>
        </Section>

        <Section title="3. Kontaktdaten">
          <Dl>
            <Dt>Mandantentyp</Dt>
            <Dd>
              {lead.clientType === "business"
                ? "Unternehmen / Selbstständig"
                : "Privatperson"}
            </Dd>
            {lead.contact.business && (
              <>
                <Dt>Firma</Dt>
                <Dd>{lead.contact.business.companyName}</Dd>
                {lead.contact.business.contactPosition && (
                  <>
                    <Dt>Position</Dt>
                    <Dd>{lead.contact.business.contactPosition}</Dd>
                  </>
                )}
                {lead.contact.business.vatId && (
                  <>
                    <Dt>USt-ID</Dt>
                    <Dd>{lead.contact.business.vatId}</Dd>
                  </>
                )}
              </>
            )}
            <Dt>Vorname</Dt>
            <Dd>{lead.contact.firstName}</Dd>
            <Dt>Nachname</Dt>
            <Dd>{lead.contact.lastName}</Dd>
            <Dt>E-Mail</Dt>
            <Dd>{lead.contact.email}</Dd>
            <Dt>Telefon</Dt>
            <Dd>{lead.contact.phone}</Dd>
            <Dt>Postleitzahl</Dt>
            <Dd>{lead.contact.postalCode}</Dd>
          </Dl>
        </Section>

        <Section title="4. Anliegen">
          <Dl>
            <Dt>Rechtsgebiet</Dt>
            <Dd>{lead.areaLabel}</Dd>
            <Dt>Dringlichkeit (Angabe)</Dt>
            <Dd>{lead.urgency}</Dd>
            {lead.insurance && (
              <>
                <Dt>Rechtsschutz-Versicherung</Dt>
                <Dd>
                  {lead.insurance.status}
                  {lead.insurance.provider
                    ? ` — ${lead.insurance.provider}`
                    : ""}
                </Dd>
              </>
            )}
            {lead.claimValue && (
              <>
                <Dt>Streitwert (Selbstauskunft)</Dt>
                <Dd>{lead.claimValue}</Dd>
              </>
            )}
          </Dl>
        </Section>

        {sachdaten.length > 0 && (
          <Section title="5. Angaben zum Sachverhalt">
            <Dl>
              {sachdaten.map(([k, v]) => (
                <Fragment key={k}>
                  <Dt>{prettifyKey(k)}</Dt>
                  <Dd>
                    {Array.isArray(v)
                      ? (v as string[]).join(", ")
                      : String(v)}
                  </Dd>
                </Fragment>
              ))}
            </Dl>
            {lead.userNotes && (
              <p className="mt-3 italic text-sm">
                Eigene Ergänzung: „{lead.userNotes}"
              </p>
            )}
          </Section>
        )}

        {docs.length > 0 && (
          <Section title="6. Genannte Dokumente">
            <ul className="list-disc pl-5 space-y-1">
              {docs.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
            <p className="text-xs text-muted mt-2 italic">
              Nach Selbstauskunft des Mandanten vorhanden. Im aktuellen Vorgang
              sind keine Datei-Uploads gespeichert.
            </p>
          </Section>
        )}

        {lead.aiSummary && (
          <Section title="7. Strukturierte Zusammenfassung">
            <p className="whitespace-pre-wrap">{lead.aiSummary}</p>
            <p className="text-xs text-muted mt-2 italic">
              Automatisch strukturierte Wiedergabe der Angaben des Mandanten —
              enthält keine rechtliche Bewertung.
            </p>
          </Section>
        )}

        <Section title="8. Bearbeitungs-Historie">
          <ul className="space-y-1 text-sm">
            {lead.history.map((h, i) => (
              <li key={i}>
                <span className="text-muted">
                  {new Date(h.at).toLocaleString("de-DE")}
                </span>{" "}
                <span className="text-muted">·</span> {h.message}
                {h.byUserName && h.byUserId !== "system" && (
                  <span className="text-muted"> ({h.byUserName})</span>
                )}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Ihre Rechte">
          <p className="text-sm">
            Sie haben jederzeit Recht auf Berichtigung, Löschung, Einschränkung
            der Verarbeitung, Datenübertragbarkeit sowie Widerspruch. Eine
            Beschwerde bei der zuständigen Datenschutz-Aufsichtsbehörde ist
            möglich. Anfragen richten Sie bitte an {TENANT.brand.kanzleiName}.
          </p>
        </Section>

        <footer className="border-t border-line pt-4 mt-10 text-xs text-muted">
          {TENANT.brand.kanzleiName} · Auskunft generiert am{" "}
          {new Date().toLocaleString("de-DE")} · Vorgang {lead.id}
        </footer>
      </main>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 print:break-inside-avoid">
      <h2 className="text-base font-bold mb-2 text-ink-dark">{title}</h2>
      <div className="text-sm leading-relaxed text-ink-dark">{children}</div>
    </section>
  );
}

function Dl({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-[180px_1fr] gap-x-3 gap-y-1">{children}</dl>
  );
}
function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-muted">{children}</dt>;
}
function Dd({ children }: { children: React.ReactNode }) {
  return <dd className="text-ink-dark">{children}</dd>;
}

function prettifyKey(key: string): string {
  const map: Record<string, string> = {
    topic: "Anliegen",
    role: "Rolle",
    party: "Partei",
    relation: "Verhältnis",
    incidentDate: "Datum",
    deathDate: "Datum Erbfall",
    terminationType: "Kündigungsart",
    terminationReason: "Kündigungsgrund (Mandantenangabe)",
    employmentDuration: "Beschäftigungsdauer",
    companySize: "Unternehmensgröße",
    salaryRange: "Bruttogehalt",
    fault: "Schuldfrage (Mandantensicht)",
    injury: "Personenschäden",
    damageRange: "Sachschaden",
    rentRange: "Miete",
    estateRange: "Nachlass",
    testament: "Testament",
    description: "Schilderung",
  };
  return map[key] ?? key;
}
