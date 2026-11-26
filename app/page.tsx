"use client";

import { Briefcase, Car, ChevronRight, Home, Laptop, Scale, ScrollText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { FirmAvatar } from "@/components/FirmAvatar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Mandarin } from "@/components/Mandarin";
import { Reveal } from "@/components/Reveal";
import { listPracticeAreas, type PracticeAreaId } from "@/lib/areas/registry";
import { getActivePracticeAreaIds } from "@/lib/tenantOverrides";
import { TENANT } from "@/lib/tenant.config";

/** Icons pro Rechtsgebiet (dekorativ); Fallback für neue Gebiete: Waage. */
const AREA_ICONS: Record<string, LucideIcon> = {
  arbeitsrecht: Briefcase,
  verkehrsrecht: Car,
  digitales: Laptop,
  mietrecht: Home,
  erbrecht: ScrollText,
};

function Icon({ id }: { id: string }) {
  const C = AREA_ICONS[id] ?? Scale;
  return <C className="h-5 w-5" strokeWidth={1.6} aria-hidden />;
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        ok ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
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

      <main id="main" className="flex-1">
        {/* ---- HERO ---- */}
        <section className="relative isolate overflow-hidden brand-bg text-white">
          <div className="stage-light absolute inset-0 -z-10" aria-hidden="true" />
          <div className="mx-auto max-w-page px-4 sm:px-6 py-8 sm:py-20 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-12 items-center">
            <div className="flex flex-col">
              <span className="animate-fade-up inline-flex self-start items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                <span className="h-1.5 w-1.5 rounded-full brand-accent-bg" aria-hidden="true" />
                {TENANT.brand.kanzleiName}
              </span>
              <h1 className="animate-fade-up delay-1 mt-5 text-display font-semibold !text-white">
                Sie haben ein rechtliches Problem.{" "}
                <span style={{ color: "var(--accent-on-brand)" }}>
                  Wir hören zu — und handeln.
                </span>
              </h1>
              <p className="animate-fade-up delay-2 mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/80">
                Schildern Sie uns Ihren Fall in einem ruhigen, geführten Gespräch. Wir
                stellen die Fragen, die wir sonst im Erstgespräch stellen würden, und
                melden uns innerhalb {TENANT.legal.rueckmeldungInnerhalb} persönlich bei
                Ihnen zurück.
              </p>
              <p className="animate-fade-up delay-2 order-1 mt-6 sm:order-none sm:mt-3 max-w-xl text-base text-white/70">
                Kein Wartezimmer, kein Termindruck — nehmen Sie sich die Zeit, die Sie brauchen.
              </p>
              <div className="animate-fade-up delay-3 mt-6 sm:mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/chat"
                  className="btn-accent"
                >
                  Anliegen schildern
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="#bereiche"
                  className="btn-on-dark"
                >
                  Unsere Rechtsgebiete ansehen
                </Link>
              </div>
              <ul className="animate-fade-up delay-4 order-2 mt-6 sm:order-none sm:mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
                {["Vertraulich", "Unverbindlich", "Persönliche Rückmeldung"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="var(--accent-on-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m4 10.5 4 4 8-9" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Illustration: Vorschau des geführten Gesprächs (rein dekorativ) */}
            <div className="animate-fade-up delay-3 relative hidden lg:block" aria-hidden="true">
              {TENANT.brand.mascot === true && (
                <Mandarin className="pointer-events-none absolute -top-40 -right-6 z-10 h-36 w-32" />
              )}
              <div className="surface-raised rounded-2xl p-5 text-ink-dark">
                <div className="mb-4 flex items-center gap-3 border-b border-line pb-4">
                  <FirmAvatar />
                  <div>
                    <div className="text-sm font-semibold">Geführtes Gespräch</div>
                    <div className="text-xs text-muted">Schritt 2 von 6</div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-line bg-white px-4 py-2.5 shadow-soft">
                    Worum geht es in Ihrem Anliegen? Beschreiben Sie es gern in eigenen Worten.
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm brand-bg px-4 py-2.5 text-white shadow-card">
                    Ich habe eine Kündigung erhalten.
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-line bg-white px-4 py-2.5 shadow-soft">
                    Danke. Wann haben Sie das Schreiben erhalten?
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {["Diese Woche", "Letzte Woche", "Früher"].map((c) => (
                      <span key={c} className="rounded-full border border-line bg-white px-3 py-1 text-xs">
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
        <section className="mx-auto max-w-page px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <span className="text-sm font-semibold brand-text">In 3 Schritten</span>
            <h2 className="mt-3 text-title font-semibold">So funktioniert es</h2>
            <p className="mt-3 text-muted leading-relaxed">
              Damit Sie wissen, was Sie erwartet — kein Verkaufsgespräch, keine
              versteckten Kosten, keine Verpflichtung.
            </p>
          </div>
          <Reveal><ol className="grid md:grid-cols-3 md:gap-10">
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
              <li key={s.step} className="timeline-step relative flex gap-5 pb-10 last:pb-0 md:block md:pb-0">
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full brand-bg font-serif text-2xl text-white shadow-card ring-4 ring-paper md:mb-6">
                  {s.step}
                </div>
                <div className="pt-1.5 md:pt-0">
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="max-w-[48ch] text-base text-muted leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol></Reveal>
        </section>

        {/* ---- RECHTSGEBIETE ---- */}
        <section id="bereiche" className="scroll-mt-20 border-t border-line bg-white">
          <div className="mx-auto grid max-w-page gap-10 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <span className="text-sm font-semibold brand-text">Unsere Schwerpunkte</span>
              <h2 className="mt-3 text-title font-semibold">In welchem Bereich können wir helfen?</h2>
              <p className="mt-3 max-w-md text-muted leading-relaxed">
                Wählen Sie Ihr Rechtsgebiet — wir starten direkt mit den passenden Fragen.
              </p>
              <Link href="/chat" className="btn-primary mt-7">
                Anliegen schildern
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            {/* Verzeichnis: eine Zeile je Gebiet, die ganze Zeile ist der Link */}
            <Reveal>
              <ul className="divide-y divide-line border-y border-line">
                {areas.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/chat?area=${encodeURIComponent(a.id)}`}
                      className="group flex items-center gap-4 px-2 py-5 transition-colors duration-200 ease-out hover:bg-paper active:bg-paper-dark sm:gap-5 sm:px-4"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-full bg-paper text-ink transition-colors group-hover:bg-white">
                        <Icon id={a.id} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold">{a.label}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{a.blurb}</p>
                      </div>
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-ink"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ---- WAS DER CHAT TUT / NICHT TUT ---- */}
        <section className="mx-auto max-w-page px-4 sm:px-6 py-16 sm:py-20">
          <Reveal><div className="card grid divide-y divide-line md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="p-7 sm:p-10">
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
            <div className="rounded-b-2xl bg-paper/60 p-7 sm:p-10 md:rounded-bl-none md:rounded-r-2xl">
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
          </div></Reveal>
        </section>

        {/* ---- FAQ ---- */}
        <section className="mx-auto max-w-page px-4 sm:px-6 pt-4 pb-20 sm:pb-28">
          <Reveal className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-12">
            <div>
              <span className="text-sm font-semibold brand-text">Häufige Fragen</span>
              <h2 className="mt-3 text-title font-semibold">Gut zu wissen</h2>
            </div>
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
              {[
                {
                  q: "Ersetzt der Chat eine Rechtsberatung?",
                  a: "Nein. Der Chat erfasst Ihr Anliegen vorab. Eine rechtliche Bewertung, eine Einschätzung der Erfolgsaussichten oder eine Handlungsempfehlung erfolgt dort nicht — das übernimmt die Kanzlei im persönlichen Gespräch.",
                },
                {
                  q: "Was passiert mit meinen Angaben?",
                  a: "Vor dem Absenden willigen Sie ausdrücklich ein, dass die Kanzlei Ihre Angaben zur Bearbeitung Ihrer Anfrage verarbeitet. Diese Einwilligung können Sie jederzeit widerrufen.",
                },
                {
                  q: "Wie schnell erhalte ich eine Rückmeldung?",
                  a: `Eine Anwältin oder ein Anwalt meldet sich in der Regel innerhalb ${TENANT.legal.rueckmeldungInnerhalb} persönlich bei Ihnen — telefonisch oder per E-Mail.`,
                },
                {
                  q: "Kann ich eine Antwort ändern oder pausieren?",
                  a: "Ja. Mit „Letzte Antwort ändern“ gehen Sie einen Schritt zurück, und Sie bestimmen Ihr Tempo selbst.",
                },
              ].map((f) => (
                <details key={f.q} className="group px-6 py-5">
                  <summary className="flex items-center justify-between gap-4 font-medium text-ink-dark">
                    {f.q}
                    <svg className="faq-chevron h-5 w-5 shrink-0 text-muted transition-transform duration-300" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m5 8 5 5 5-5" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---- ABSCHLUSS-CTA ---- */}
        <section className="mx-auto max-w-page px-4 sm:px-6 pb-8">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-3xl brand-bg px-8 py-12 text-center text-white sm:px-14 sm:py-16">
              <div className="stage-light absolute inset-0 -z-10" aria-hidden="true" />
              <h2 className="text-title font-semibold !text-white">
                Bereit, Ihr Anliegen{" "}
                <span style={{ color: "var(--accent-on-brand)" }}>zu schildern?</span>
              </h2>
              <p className="mx-auto mt-3 max-w-md text-white/75">
                Nehmen Sie sich die Zeit, die Sie brauchen. Wir hören zu.
              </p>
              <Link
                href="/chat"
                className="btn-accent mt-8"
              >
                Anliegen schildern <span aria-hidden="true">→</span>
              </Link>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-page px-4 sm:px-6 pb-4">
          <DisclaimerBanner variant="prominent" />
        </section>
      </main>

      <Footer />
    </>
  );
}
