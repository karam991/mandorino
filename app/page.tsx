"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { listPracticeAreas, type PracticeAreaId } from "@/lib/areas/registry";
import { getActivePracticeAreaIds } from "@/lib/tenantOverrides";
import { TENANT } from "@/lib/tenant.config";

/** Kleine, einheitliche Linien-Icons (dekorativ). */
const ICONS = [
  <path key="a" d="M12 3v18M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7Zm14 0-2.5 6a3 3 0 0 0 5 0L19 7Z" />,
  <path key="b" d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6" />,
  <path key="c" d="M8 3h8l4 4v14H4V3h4Zm0 9h8M8 16h5" />,
  <path key="d" d="M4 7h16v12H4V7Zm5-3h6v3H9V4Zm-5 8h16" />,
  <path key="e" d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />,
  <path key="f" d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6l-8-3Zm-3 9 2.2 2.2L15.5 10" />,
];

function Icon({ i }: { i: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[i % ICONS.length]}
    </svg>
  );
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        ok ? "bg-success/12 text-success" : "bg-danger/10 text-danger"
      }`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {ok ? <path d="m4 10.5 4 4 8-9" /> : <path d="m5 5 10 10M15 5 5 15" />}
      </svg>
    </span>
  );
}

export default function HomePage() {
  // Active-Areas dynamisch (kann vom Team im Dashboard umgeschaltet werden).
  const [activeIds, setActiveIds] = useState<PracticeAreaId[]>(() => [
    ...TENANT.practiceAreas,
  ]);
  useEffect(() => {
    setActiveIds(getActivePracticeAreaIds());
  }, []);
  const areas = listPracticeAreas(activeIds);

  return (
    <>
      <Header variant="client" />
      <DisclaimerBanner />

      <main className="flex-1">
        {/* ---- HERO ---- */}
        <section className="relative isolate overflow-hidden brand-bg text-white">
          <div className="hero-grid absolute inset-0 -z-10" aria-hidden="true" />
          <div
            className="absolute -top-40 -right-32 -z-10 h-[520px] w-[520px] rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, var(--brand-accent), transparent 65%)" }}
            aria-hidden="true"
          />
          <div className="mx-auto max-w-page px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
            <div>
              <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/90">
                <span className="h-1.5 w-1.5 rounded-full brand-accent-bg" aria-hidden="true" />
                {TENANT.brand.kanzleiName}
              </span>
              <h1 className="animate-fade-up delay-1 mt-5 text-4xl sm:text-6xl font-semibold leading-[1.05] !text-white">
                Sie haben ein rechtliches Problem.{" "}
                <span className="italic" style={{ color: "var(--brand-accent)" }}>
                  Wir hören zu — und handeln.
                </span>
              </h1>
              <p className="animate-fade-up delay-2 mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                Schildern Sie uns Ihren Fall in einem ruhigen, geführten Gespräch. Wir
                stellen die Fragen, die wir sonst im Erstgespräch stellen würden, und
                melden uns innerhalb {TENANT.legal.rueckmeldungInnerhalb} persönlich bei
                Ihnen zurück.
              </p>
              <p className="animate-fade-up delay-2 mt-3 max-w-xl text-base text-white/65">
                Kein Wartezimmer, kein Termindruck — nehmen Sie sich die Zeit, die Sie brauchen.
              </p>
              <div className="animate-fade-up delay-3 mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/chat"
                  className="btn !bg-[color:var(--brand-accent)] !text-[color:var(--brand-primary)] hover:brightness-110 shadow-glow !px-6 !py-3.5"
                >
                  Anliegen schildern
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="#bereiche"
                  className="btn border border-white/25 text-white hover:bg-white/10 !px-6 !py-3.5"
                >
                  Unsere Rechtsgebiete ansehen
                </Link>
              </div>
              <ul className="animate-fade-up delay-4 mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
                {["Vertraulich", "Kostenlos & unverbindlich", "Persönliche Rückmeldung"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="var(--brand-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m4 10.5 4 4 8-9" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Illustration: Vorschau des geführten Gesprächs (rein dekorativ) */}
            <div className="animate-fade-up delay-3 hidden lg:block" aria-hidden="true">
              <div className="animate-float rounded-2xl border border-white/15 bg-white/[0.07] p-5 shadow-glow backdrop-blur">
                <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full brand-accent-bg text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                    {TENANT.brand.kanzleiName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Geführtes Gespräch</div>
                    <div className="text-xs text-white/60">Schritt 2 von 6</div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/90 px-4 py-2.5 text-ink-dark">
                    Worum geht es in Ihrem Anliegen? Beschreiben Sie es gern in eigenen Worten.
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[color:var(--brand-accent)] px-4 py-2.5 font-medium" style={{ color: "var(--brand-primary)" }}>
                    Ich habe eine Kündigung erhalten.
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/90 px-4 py-2.5 text-ink-dark">
                    Danke. Wann haben Sie das Schreiben erhalten?
                  </div>
                  <div className="flex gap-2 pt-1">
                    {["Diese Woche", "Letzte Woche", "Früher"].map((c) => (
                      <span key={c} className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/85">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---- SO FUNKTIONIERT ES ---- */}
        <section className="mx-auto max-w-page px-4 sm:px-6 py-20">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] brand-text">In 3 Schritten</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">So funktioniert es</h2>
            <p className="mt-3 text-muted leading-relaxed">
              Damit Sie wissen, was Sie erwartet — kein Verkaufsgespräch, keine
              versteckten Kosten, keine Verpflichtung.
            </p>
          </div>
          <ol className="relative grid sm:grid-cols-3 gap-5">
            <div className="absolute left-0 right-0 top-7 hidden sm:block h-px bg-gradient-to-r from-transparent via-line to-transparent" aria-hidden="true" />
            {[
              {
                step: "1",
                title: "Sie schildern Ihr Anliegen",
                body:
                  "Unser Assistent stellt Ihnen Schritt für Schritt freundliche Fragen — in Ihrem Tempo, ohne Fachjargon. Sie können jederzeit pausieren.",
              },
              {
                step: "2",
                title: "Wir bekommen einen klaren Überblick",
                body:
                  "Aus Ihren Angaben entsteht eine strukturierte Zusammenfassung. So sehen wir auf einen Blick, worum es geht — und können sofort einschätzen, wer in unserer Kanzlei am besten helfen kann.",
              },
              {
                step: "3",
                title: "Eine Anwältin oder ein Anwalt meldet sich",
                body: `Innerhalb ${TENANT.legal.rueckmeldungInnerhalb} hören Sie persönlich von uns — telefonisch oder per E-Mail, ganz wie Sie es wünschen.`,
              },
            ].map((s) => (
              <li key={s.step} className="card relative p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl brand-bg font-serif text-2xl text-white shadow-card">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---- RECHTSGEBIETE ---- */}
        <section id="bereiche" className="scroll-mt-20 border-t border-line bg-white">
          <div className="mx-auto max-w-page px-4 sm:px-6 py-20">
            <div className="max-w-2xl mb-12">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] brand-text">Unsere Schwerpunkte</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">In welchem Bereich können wir helfen?</h2>
              <p className="mt-3 text-muted leading-relaxed">
                Wählen Sie Ihr Rechtsgebiet — wir starten direkt mit den passenden Fragen.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {areas.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/chat?area=${encodeURIComponent(a.id)}`}
                  className="group card flex flex-col gap-3 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--brand-accent)] hover:shadow-lift"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper text-ink transition-colors group-hover:brand-bg group-hover:text-white">
                    <Icon i={i} />
                  </span>
                  <h3 className="text-lg font-semibold">{a.label}</h3>
                  <p className="text-sm text-muted leading-relaxed">{a.blurb}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-medium brand-text">
                    Anliegen schildern
                    <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ---- WAS DER CHAT TUT / NICHT TUT ---- */}
        <section className="mx-auto max-w-page px-4 sm:px-6 py-20">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="card p-8">
              <h3 className="text-lg font-semibold text-ink-dark mb-5">Was der Chat tut</h3>
              <ul className="space-y-3 text-sm text-ink-dark/90">
                {[
                  "Ihre Situation strukturiert erfassen",
                  "Wichtige Eckdaten und Dokumente abfragen",
                  "Eine neutrale Zusammenfassung erstellen",
                  "Die Anfrage an unser Team übergeben",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check ok />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-8">
              <h3 className="text-lg font-semibold text-ink-dark mb-5">Was der Chat bewusst nicht tut</h3>
              <ul className="space-y-3 text-sm text-ink-dark/90">
                {[
                  "Erfolgsaussichten einschätzen",
                  "Fristen für Sie bewerten",
                  "Handlungsempfehlungen aussprechen",
                  "Die anwaltliche Beratung ersetzen",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Check ok={false} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-page px-4 sm:px-6 pb-20">
          <DisclaimerBanner variant="prominent" />
        </section>
      </main>

      <Footer />
    </>
  );
}
