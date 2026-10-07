import Link from "next/link";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TENANT } from "@/lib/tenant.config";

export default function DankePage() {
  const steps = [
    { t: "Eingang bestätigt", d: "Ihre Angaben sind sicher bei uns angekommen." },
    { t: "Prüfung durch das Team", d: "Eine Anwältin oder ein Anwalt sieht sich Ihre Anfrage an." },
    {
      t: "Persönliche Rückmeldung",
      d: `In der Regel innerhalb ${TENANT.legal.rueckmeldungInnerhalb} — telefonisch oder per E-Mail.`,
    },
  ];
  return (
    <>
      <Header variant="client" />
      <DisclaimerBanner />

      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="card relative overflow-hidden p-8 text-center sm:p-10">
            <div
              className="absolute -top-24 left-1/2 -z-0 h-56 w-56 -translate-x-1/2 rounded-full opacity-25 blur-3xl"
              style={{ background: "radial-gradient(circle, var(--brand-accent), transparent 65%)" }}
              aria-hidden="true"
            />
            <div className="check-pop relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full brand-bg shadow-lift ring-4 ring-[color:var(--brand-accent)]/40">
              <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path className="check-draw" d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h1 className="animate-fade-up delay-1 relative text-3xl font-semibold sm:text-4xl">
              Vielen Dank — Ihre Anfrage ist bei uns eingegangen.
            </h1>
            <p className="animate-fade-up delay-2 relative mx-auto mt-4 max-w-md leading-relaxed text-muted">
              Eine Anwältin oder ein Anwalt von {TENANT.brand.kanzleiName} prüft Ihre Anfrage und
              meldet sich in der Regel innerhalb {TENANT.legal.rueckmeldungInnerhalb} bei Ihnen.
            </p>

            <ol className="relative mx-auto mt-9 max-w-md space-y-5 text-left">
              {steps.map((s, i) => (
                <li key={s.t} className="animate-fade-up flex gap-4" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.07] font-serif text-sm font-semibold text-ink-dark">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink-dark">{s.t}</div>
                    <div className="text-sm text-muted">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>

            <p className="relative mt-8 text-sm text-muted">
              Falls Sie weitere Unterlagen haben, halten Sie diese gerne bereit — wir fragen
              gegebenenfalls gezielt nach.
            </p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/" className="btn-secondary">
                Zur Startseite
              </Link>
              <Link href="/chat" className="btn-primary">
                Weitere Anfrage stellen
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <DisclaimerBanner variant="prominent" />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
