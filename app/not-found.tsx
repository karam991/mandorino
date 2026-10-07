import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header variant="client" />
      <main id="main" className="flex flex-1 items-center">
        <section className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
          <div className="font-serif text-8xl font-semibold brand-text opacity-90">404</div>
          <h1 className="mt-4 text-3xl font-semibold">Diese Seite gibt es nicht.</h1>
          <p className="mt-3 text-muted">
            Der Link ist veraltet oder wurde falsch eingegeben. Von hier aus finden Sie zurück.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn-secondary">Zur Startseite</Link>
            <Link href="/chat" className="btn-primary">Anliegen schildern</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
