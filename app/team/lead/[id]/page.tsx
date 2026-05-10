"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PriorityPill, StatusPill } from "@/components/StatusPill";
import {
  addNote,
  assignLead,
  changeStatus,
  getLeadById,
} from "@/lib/leadStore";
import { getCurrentUser, listTeam, verifySession, type SessionUser } from "@/lib/authStore";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type Lead,
  type LeadStatus,
} from "@/lib/types";

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const leadId = params?.id;

  const [user, setUser] = useState<SessionUser | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      router.replace("/team/login");
      return;
    }
    setUser(cur);
    if (typeof leadId === "string") {
      setLead(getLeadById(leadId));
    }
    setLoading(false);
    void verifySession().then((u) => {
      if (!u) router.replace("/team/login");
    });
  }, [leadId, router]);

  const team = useMemo(() => listTeam(), []);

  if (loading || !user) return null;

  if (!lead) {
    return (
      <>
        <Header variant="team" />
        <main className="flex-1 bg-paper">
          <section className="mx-auto max-w-2xl px-4 sm:px-6 py-16 text-center">
            <h1 className="text-2xl font-bold mb-3">Lead nicht gefunden</h1>
            <Link href="/team/dashboard" className="btn-primary">
              Zurück zur Übersicht
            </Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const actor = { userId: user.id, userName: user.name };

  function onStatusChange(s: LeadStatus) {
    if (!lead) return;
    const updated = changeStatus(lead.id, s, actor);
    if (updated) setLead(updated);
  }

  function onAssign(value: string) {
    if (!lead) return;
    const assigneeId = value === "" ? null : value;
    const name = assigneeId ? team.find((t) => t.id === assigneeId)?.name ?? null : null;
    const updated = assignLead(lead.id, assigneeId, name, actor);
    if (updated) setLead(updated);
  }

  function onAddNote() {
    if (!lead || !noteDraft.trim()) return;
    const updated = addNote(lead.id, noteDraft, actor);
    if (updated) {
      setLead(updated);
      setNoteDraft("");
    }
  }

  return (
    <>
      <Header variant="team" />
      <main className="flex-1 bg-paper">
        <section className="mx-auto max-w-page px-4 sm:px-6 py-6">
          <Link
            href="/team/dashboard"
            className="text-sm brand-text underline mb-4 inline-block"
          >
            ← Zurück zur Übersicht
          </Link>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Hauptspalte */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="card p-6">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="pill bg-paper-dark text-ink-dark">{lead.areaLabel}</span>
                      {lead.clientType === "business" && (
                        <span
                          className="pill bg-indigo-50 text-indigo-800 border border-indigo-200"
                          title="Anfrage im Auftrag eines Unternehmens / Selbstständig"
                        >
                          B2B
                        </span>
                      )}
                    </div>
                    {lead.clientType === "business" && lead.contact.business?.companyName && (
                      <p className="text-sm font-semibold text-ink-dark">
                        {lead.contact.business.companyName}
                      </p>
                    )}
                    <h1 className="text-2xl font-bold leading-tight">
                      {lead.contact.firstName} {lead.contact.lastName}
                    </h1>
                    <p className="text-sm text-muted mt-1">
                      Eingegangen am {new Date(lead.createdAt).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusPill status={lead.status} />
                    <PriorityPill tier={lead.priority.tier} />
                  </div>
                </div>

                {/* Kontakt */}
                <div className="border-t border-line mt-5 pt-4">
                  <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-3">
                    Kontakt
                  </h2>
                  <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {lead.clientType === "business" && lead.contact.business && (
                      <>
                        <Field label="Firma">{lead.contact.business.companyName}</Field>
                        {lead.contact.business.contactPosition && (
                          <Field label="Position">{lead.contact.business.contactPosition}</Field>
                        )}
                        {lead.contact.business.vatId && (
                          <Field label="USt-ID">{lead.contact.business.vatId}</Field>
                        )}
                      </>
                    )}
                    <Field label="E-Mail">
                      <a
                        className="brand-text underline truncate"
                        href={`mailto:${lead.contact.email}`}
                      >
                        {lead.contact.email}
                      </a>
                    </Field>
                    <Field label="Telefon">
                      <a className="brand-text underline" href={`tel:${lead.contact.phone}`}>
                        {lead.contact.phone}
                      </a>
                    </Field>
                    <Field label="PLZ">{lead.contact.postalCode}</Field>
                    <Field label="Dringlichkeit">{lead.urgency}</Field>
                  </dl>
                </div>

                {/* Wirtschaftlicher Rahmen — Versicherung + Streitwert */}
                <CommercialFrameView lead={lead} />

                {/* KI-Zusammenfassung */}
                {lead.aiSummary && (
                  <div className="border-t border-line mt-5 pt-4">
                    <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-2">
                      Zusammenfassung
                    </h2>
                    <p className="text-sm text-ink-dark/95 leading-relaxed bg-paper-dark/50 border border-line rounded-md p-3 whitespace-pre-wrap">
                      {lead.aiSummary}
                    </p>
                    <p className="text-xs text-muted mt-2">
                      {lead.aiSummarySource === "claude"
                        ? "KI-Reformulierung (Claude)"
                        : "Strukturvorlage"}{" "}
                      · ohne rechtliche Bewertung
                    </p>
                  </div>
                )}

                {/* Dokumente — eigene Karte, prominent */}
                <DocumentsView data={lead.areaData} />

                {/* Sachdaten */}
                <div className="border-t border-line mt-5 pt-4">
                  <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-3">
                    Mandantenangaben
                  </h2>
                  <AreaDataView data={lead.areaData} />
                  {lead.userNotes && (
                    <div className="mt-3">
                      <p className="text-xs text-muted">Eigene Ergänzung des Mandanten:</p>
                      <p className="text-sm text-ink-dark/95 italic">„{lead.userNotes}"</p>
                    </div>
                  )}
                </div>

                {/* Priorität-Signale */}
                {lead.priority.signals.length > 0 && (
                  <div className="border-t border-line mt-5 pt-4">
                    <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-3">
                      Bearbeitungs-Priorität — Begründung
                    </h2>
                    <ul className="text-sm text-ink-dark/90 space-y-1">
                      {lead.priority.signals.map((s, i) => (
                        <li key={i}>· {s.label}</li>
                      ))}
                    </ul>
                    {lead.priority.estimatedValueRange && (
                      <p className="text-xs text-muted mt-3 italic">
                        {lead.priority.estimatedValueRange.label} (interne Geschäfts-Schätzung,
                        keine rechtliche Bewertung)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Notizen + Historie */}
              <div className="card p-6">
                <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-3">
                  Bearbeitungs-Notizen
                </h2>
                <div className="flex flex-col gap-2 mb-4">
                  <textarea
                    className="input min-h-[80px]"
                    placeholder="Interne Notiz hinzufügen…"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-primary self-start"
                    disabled={!noteDraft.trim()}
                    onClick={onAddNote}
                  >
                    Notiz speichern
                  </button>
                </div>

                <h3 className="text-xs uppercase tracking-wide text-muted mb-2">Historie</h3>
                <ul className="space-y-2">
                  {[...lead.history].reverse().map((h, i) => (
                    <li
                      key={i}
                      className="text-sm border-l-2 border-line pl-3 py-1"
                    >
                      <div className="text-xs text-muted">
                        {new Date(h.at).toLocaleString("de-DE")} · {h.byUserName}
                      </div>
                      <div className="text-ink-dark/95">{h.message}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="flex flex-col gap-4">
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-3">
                  Status
                </h2>
                <div className="flex flex-col gap-2">
                  {LEAD_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onStatusChange(s)}
                      disabled={lead.status === s}
                      className={`text-left px-3 py-2 rounded-md border text-sm transition ${
                        lead.status === s
                          ? "border-ink bg-ink/5 text-ink-dark font-medium"
                          : "border-line hover:bg-paper-dark"
                      }`}
                    >
                      {LEAD_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-3">
                  Zuweisung
                </h2>
                <select
                  className="input"
                  value={lead.assignedToUserId ?? ""}
                  onChange={(e) => onAssign(e.target.value)}
                >
                  <option value="">— Nicht zugewiesen —</option>
                  {team.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="card p-5 text-xs text-muted leading-relaxed">
                <p className="font-semibold text-ink-dark mb-1 text-sm">Hinweis</p>
                Die Bearbeitungs-Priorität ist eine interne Sortier-Hilfe (Frist-Sensitivität,
                Vollständigkeit, Streitwert-Indikatoren) — keine rechtliche Bewertung der
                Erfolgsaussichten.
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink-dark">{children}</dd>
    </>
  );
}

/**
 * Eigene Karte für „Dokumente" — diese Liste benennt, welche Unterlagen der
 * Mandant nach eigener Aussage bereit hat (Selbstauskunft, keine Datei-Uploads
 * im MVP). Sie wird hervorgehoben, weil sie für die Erstbearbeitung am
 * wichtigsten ist: Fehlt das Kündigungsschreiben, lohnt sich kein Anruf.
 */
function DocumentsView({ data }: { data: Record<string, unknown> }) {
  const docs = data.documents;
  if (!Array.isArray(docs) || docs.length === 0) {
    return (
      <div className="border-t border-line mt-5 pt-4">
        <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-2">
          Dokumente (nach Mandantenangabe)
        </h2>
        <p className="text-sm text-muted">
          Mandant:in hat keine vorhandenen Unterlagen genannt.
        </p>
      </div>
    );
  }
  return (
    <div className="border-t border-line mt-5 pt-4">
      <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-2 flex items-center gap-2">
        Dokumente (nach Mandantenangabe)
        <span className="pill bg-paper-dark text-ink-dark text-[10px]">
          {docs.length}
        </span>
      </h2>
      <ul className="grid sm:grid-cols-2 gap-2">
        {(docs as string[]).map((d, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-ink-dark/95 bg-paper-dark/40 border border-line rounded-md px-3 py-2"
          >
            <span aria-hidden className="brand-text font-bold leading-5">✓</span>
            <span>{d}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted mt-2 italic">
        Hinweis: Datei-Uploads sind noch nicht aktiv — bitte beim Erstkontakt nachfragen
        und die Unterlagen anfordern.
      </p>
    </div>
  );
}

/** Generischer Renderer für die area-spezifischen `areaData`. */
function AreaDataView({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([k, v]) => {
    // documents werden in DocumentsView eigens dargestellt — hier ausblenden.
    if (k === "documents") return false;
    if (v === undefined || v === null) return false;
    if (typeof v === "string" && v.trim() === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });
  if (entries.length === 0) {
    return <p className="text-sm text-muted">Keine weiteren Angaben.</p>;
  }
  return (
    <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {entries.map(([key, value]) => (
        <Field key={key} label={prettifyKey(key)}>
          {Array.isArray(value)
            ? (value as string[]).join(", ")
            : typeof value === "string"
              ? key.toLowerCase().includes("date")
                ? safeDateFormat(value)
                : value
              : String(value)}
        </Field>
      ))}
    </dl>
  );
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
    documents: "Dokumente",
  };
  return map[key] ?? key;
}

function safeDateFormat(v: string): string {
  try {
    return new Date(v).toLocaleDateString("de-DE");
  } catch {
    return v;
  }
}

/**
 * Wirtschaftlicher Rahmen — die zwei Felder, die der Anwalt vor dem
 * Erstkontakt sehen will: Rechtsschutz (zahlt jemand?) und Streitwert
 * (wie groß ist das Mandat?). Bewusst keine rechtliche Bewertung, nur
 * die Selbst-Auskunft des Mandanten als Sortier-Hilfe.
 */
function CommercialFrameView({ lead }: { lead: Lead }) {
  if (!lead.insurance && !lead.claimValue) return null;

  const insTone = (() => {
    if (!lead.insurance) return "muted";
    switch (lead.insurance.status) {
      case "Ja":
        return "ok";
      case "Nein":
        return "warn";
      default:
        return "muted";
    }
  })();

  const insClass =
    insTone === "ok"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : insTone === "warn"
        ? "bg-amber-50 border-amber-200 text-amber-900"
        : "bg-paper-dark/40 border-line text-ink-dark/90";

  return (
    <div className="border-t border-line mt-5 pt-4">
      <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-3">
        Wirtschaftlicher Rahmen
        <span className="ml-2 text-[10px] uppercase tracking-wider text-muted font-normal">
          Selbstauskunft Mandant
        </span>
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {lead.insurance && (
          <div className={`rounded-md border px-3 py-3 ${insClass}`}>
            <div className="text-[10px] uppercase tracking-wider opacity-75">
              Rechtsschutz-Versicherung
            </div>
            <div className="text-sm font-semibold mt-0.5">
              {lead.insurance.status}
            </div>
            {lead.insurance.provider && (
              <div className="text-xs mt-0.5 opacity-90">
                Versicherer: {lead.insurance.provider}
              </div>
            )}
          </div>
        )}
        {lead.claimValue && (
          <div className="rounded-md border border-line bg-paper-dark/40 px-3 py-3">
            <div className="text-[10px] uppercase tracking-wider text-muted">
              Streitwert / Sachwert (Mandantenschätzung)
            </div>
            <div className="text-sm font-semibold text-ink-dark mt-0.5">
              {lead.claimValue}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
