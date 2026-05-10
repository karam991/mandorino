"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { listPracticeAreas, type PracticeAreaId } from "@/lib/areas/registry";
import { getActivePracticeAreaIds } from "@/lib/tenantOverrides";
import { TENANT } from "@/lib/tenant.config";

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
        <section className="bg-gradient-to-b from-paper to-paper-dark">
          <div className="mx-auto max-w-page px-4 sm:px-6 py-16 sm:py-24">
            <div className="max-w-3xl">
              <span className="pill bg-ink/10 text-ink-dark mb-4">
                {TENANT.brand.kanzleiName}
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
                Sie haben ein rechtliches Problem.{" "}
                <span className="brand-text">Wir hören zu — und handeln.</span>
              </h1>
              <p className="text-lg text-muted leading-relaxed mb-3">
                Schildern Sie uns Ihren Fall in einem ruhigen, geführten Gespräch.
                Wir stellen die Fragen, die wir sonst im Erstgespräch stellen würden,
                und melden uns innerhalb {TENANT.legal.rueckmeldungInnerhalb} persönlich
                bei Ihnen zurück.
              </p>
              <p className="text-base text-ink-dark/90 leading-relaxed mb-8">
                Kein Wartezimmer, kein Termindruck — nehmen Sie sich die Zeit, die Sie brauchen.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/chat" className="btn-primary">
                  Anliegen schildern
                </Link>
                <Link href="#bereiche" className="btn-secondary">
                  Unsere Rechtsgebiete ansehen
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---- SO FUNKTIONIERT ES ---- */}
        <section className="mx-auto max-w-page px-4 sm:px-6 py-16">
          <div className="max-w-2xl mb-10">
            <span className="pill bg-ink/10 text-ink-dark mb-3">In 3 Schritten</span>
            <h2 className="text-3xl font-bold mb-3">So funktioniert es</h2>
            <p className="text-muted leading-relaxed">
              Damit Sie wissen, was Sie erwartet — kein Verkaufsgespräch, keine
              versteckten Kosten, keine Verpflichtung.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
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
              <div key={s.step} className="card p-6">
                <div className="w-10 h-10 rounded-full brand-bg text-white text-base font-semibold flex items-center justify-center mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- RECHTSGEBIETE ---- */}
        <section id="bereiche" className="mx-auto max-w-page px-4 sm:px-6 py-16 border-t border-line">
          <div className="max-w-2xl mb-10">
            <span className="pill bg-ink/10 text-ink-dark mb-3">Unsere Schwerpunkte</span>
            <h2 className="text-3xl font-bold mb-3">In welchem Bereich können wir helfen?</h2>
            <p className="text-muted leading-relaxed">
              Wählen Sie Ihr Rechtsgebiet — wir starten direkt mit den passenden Fragen.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {areas.map((a) => (
              <Link
                key={a.id}
                href={`/chat?area=${encodeURIComponent(a.id)}`}
                className="card p-6 hover:border-ink/40 hover:shadow-md transition-all flex flex-col gap-2 group"
              >
                <h3 className="text-lg font-semibold group-hover:brand-text transition-colors">
                  {a.label}
                </h3>
                <p className="text-sm text-muted leading-relaxed">{a.blurb}</p>
                <span className="text-sm brand-text font-medium mt-auto pt-3">
                  Anliegen schildern →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ---- WAS DER CHAT TUT / NICHT TUT ---- */}
        <section className="mx-auto max-w-page px-4 sm:px-6 py-12 border-t border-line">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-ink-dark mb-3">Was der Chat tut</h3>
              <ul className="space-y-2 text-sm text-ink-dark/90">
                <li>· Ihre Situation strukturiert erfassen</li>
                <li>· Wichtige Eckdaten und Dokumente abfragen</li>
                <li>· Eine neutrale Zusammenfassung erstellen</li>
                <li>· Die Anfrage an unser Team übergeben</li>
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-ink-dark mb-3">
                Was der Chat bewusst nicht tut
              </h3>
              <ul className="space-y-2 text-sm text-ink-dark/90">
                <li>· Erfolgsaussichten einschätzen</li>
                <li>· Fristen für Sie bewerten</li>
                <li>· Handlungsempfehlungen aussprechen</li>
                <li>· Die anwaltliche Beratung ersetzen</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-page px-4 sm:px-6 pb-16">
          <DisclaimerBanner variant="prominent" />
        </section>
      </main>

      <Footer />
    </>
  );
}
