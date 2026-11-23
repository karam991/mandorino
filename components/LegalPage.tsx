import type { ReactNode } from "react";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TENANT } from "@/lib/tenant.config";

/** true, solange in den Anbieter-Angaben noch „[…]"-Platzhalter stehen. */
export function hasPlaceholders(): boolean {
  return Object.values(TENANT.legal.provider).some((v) => v.includes("["));
}

/** Gemeinsamer Rahmen für Impressum/Datenschutz. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Header variant="client" />
      <main id="main" className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          {hasPlaceholders() && (
            <div
              role="note"
              className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              <strong>Entwurf:</strong> Diese Seite enthält noch nicht ausgefüllte Angaben und ist
              nicht rechtlich geprüft. Vor dem Produktivbetrieb Platzhalter in{" "}
              <code>lib/tenant.config.ts</code> ersetzen und den Text anwaltlich prüfen lassen.
            </div>
          )}
          <h1 className="text-3xl font-semibold">{title}</h1>
          <div className="mt-6 space-y-5 leading-relaxed text-ink-dark/90 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
