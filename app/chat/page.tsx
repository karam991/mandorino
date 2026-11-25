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

      <main id="main" className="flex-1">
      <section className="relative isolate overflow-hidden brand-bg text-white">
        <div className="stage-light absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto flex max-w-page flex-col gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
          <h1 className="animate-fade-up text-2xl font-semibold sm:text-3xl !text-white">
            Schildern Sie uns Ihr{" "}
            <span style={{ color: "var(--accent-on-brand)" }}>
              Anliegen.
            </span>
          </h1>
          <p className="animate-fade-up delay-1 mt-1.5 max-w-xl text-sm text-white/75 sm:text-base">
            Ein ruhiges, geführtes Gespräch — in Ihrem Tempo. Sie können jederzeit pausieren.
          </p>
          </div>
          <ul className="animate-fade-up delay-2 flex shrink-0 flex-wrap gap-x-5 gap-y-1 text-xs text-white/75 sm:text-sm">
            {["Vertraulich", "Unverbindlich", "Rückmeldung durch die Kanzlei"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="var(--accent-on-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m4 10.5 4 4 8-9" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

        <Suspense fallback={<div className="p-8 text-center text-muted">Lade Chat…</div>}>
          <ChatContainer variant="page" />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
