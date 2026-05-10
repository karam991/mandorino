import Link from "next/link";

import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TENANT } from "@/lib/tenant.config";

export default function DankePage() {
  return (
    <>
      <Header variant="client" />
      <DisclaimerBanner />

      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
          <div className="card p-8 text-center">
            <div className="w-12 h-12 rounded-full brand-bg text-white flex items-center justify-center mx-auto mb-5 text-xl font-bold">
              ✓
            </div>
            <h1 className="text-2xl font-bold mb-3">
              Vielen Dank — Ihre Anfrage ist bei uns eingegangen.
            </h1>
            <p className="text-muted leading-relaxed mb-6">
              Eine Anwältin oder ein Anwalt von {TENANT.brand.kanzleiName} prüft Ihre Anfrage und
              meldet sich in der Regel innerhalb {TENANT.legal.rueckmeldungInnerhalb} bei Ihnen.
            </p>
            <p className="text-sm text-muted mb-8">
              Falls Sie weitere Unterlagen haben, halten Sie diese gerne bereit — wir fragen
              gegebenenfalls gezielt nach.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
