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

      <main className="flex-1 bg-paper">
        <Suspense fallback={<div className="p-8 text-center text-muted">Lade Chat…</div>}>
          <ChatContainer variant="page" />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}