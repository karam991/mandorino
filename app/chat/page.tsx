import { Suspense } from "react";
import { ChatContainer } from "@/components/ChatContainer";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/**
 * Mandanten-Seite: Chatbot-Aufnahme. UI-Logik liegt komplett in
 * `components/ChatContainer` — diese Seite stellt nur Header / Footer /
 * DisclaimerBanner-Hülle bereit (was im Embed-Modus weggelassen wird).
 */
export default function ChatPage() {
  return (
    <>
      <Header variant="client" />
      <DisclaimerBanner />

      <section className="relative isolate overflow-hidden brand-bg text-white">
        <div className="hero-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div
          className="absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--brand-accent), transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="mx-auto max-w-page px-4 py-9 sm:px-6 sm:py-12">
          <h1 className="animate-fade-up text-3xl font-semibold sm:text-4xl !text-white">
            Schildern Sie uns Ihr{" "}
            <span className="italic" style={{ color: "var(--brand-accent)" }}>
              Anliegen.
            </span>
          </h1>
          <p className="animate-fade-up delay-1 mt-3 max-w-xl text-white/75">
            Ein ruhiges, geführtes Gespräch — in Ihrem Tempo. Sie können jederzeit pausieren.
          </p>
          <ul className="animate-fade-up delay-2 mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            {["Vertraulich", "Kostenlos & unverbindlich", "Rückmeldung durch die Kanzlei"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="var(--brand-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m4 10.5 4 4 8-9" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-muted">Lade Chat…</div>}>
          <ChatContainer variant="page" />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
