"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCurrentUser, verifySession, type SessionUser } from "@/lib/authStore";
import { TENANT } from "@/lib/tenant.config";

/**
 * Team-Setup-Seite: zeigt der Kanzlei zwei Code-Schnipsel zum Einbauen
 * auf ihrer eigenen Website.
 *
 * 1) Floating-Widget (Drop-in-Script + Button-Overlay)
 * 2) Inline-Iframe (für eigene „Kontakt"-Seite)
 */
export default function EmbedSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      router.replace("/team/login");
      return;
    }
    setUser(cur);
    if (typeof window !== "undefined") setOrigin(window.location.origin);
    void verifySession().then((u) => {
      if (!u) router.replace("/team/login");
    });
  }, [router]);

  const widgetSnippet = useMemo(() => {
    const o = origin || "https://IHRE-MANDORINO-INSTANZ.de";
    return `<!-- Mandorino Widget — ${TENANT.brand.kanzleiName} -->
<script src="${o}/widget.js"
        data-mandorino-base="${o}"
        data-button-text="Anliegen schildern"
        data-button-color="${TENANT.brand.primary}"
        data-position="br"
        defer></script>`;
  }, [origin]);

  const iframeSnippet = useMemo(() => {
    const o = origin || "https://IHRE-MANDORINO-INSTANZ.de";
    return `<!-- Mandorino Inline-Iframe — ${TENANT.brand.kanzleiName} -->
<iframe
  src="${o}/embed"
  title="Anfrage ${TENANT.brand.kanzleiName}"
  style="border:0;width:100%;min-height:640px;border-radius:12px;background:transparent"
  loading="lazy"
></iframe>
<script>
  // Höhen-Anpassung (optional, aber empfohlen)
  window.addEventListener("message", function (e) {
    if (e.origin !== "${o}") return;
    var msg = e.data;
    if (msg && msg.type === "mandorino:resize" && typeof msg.height === "number") {
      var f = document.querySelector('iframe[src^="${o}/embed"]');
      if (f) f.style.height = (msg.height + 8) + "px";
    }
  });
</script>`;
  }, [origin]);

  if (!user) return null;

  return (
    <>
      <Header variant="team" />
      <main className="flex-1 bg-paper">
        <section className="mx-auto max-w-page px-4 sm:px-6 py-6">
          <div className="mb-6">
            <span className="pill bg-ink/10 text-ink-dark mb-2">Einbettung</span>
            <h1 className="text-2xl font-bold">Widget auf Ihrer Kanzlei-Website</h1>
            <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">
              Mandorino läuft als eigenständige Anwendung unter{" "}
              <code className="bg-paper-dark px-1 rounded">{origin || "Ihre-Instanz"}</code>. Auf
              Ihrer Kanzlei-Website binden Sie es entweder als <strong>Floating-Button</strong>{" "}
              (öffnet ein Overlay) oder als <strong>Inline-Iframe</strong> auf einer eigenen
              Kontakt-Seite ein.
            </p>
          </div>

          <Snippet
            title="Variante A — Floating-Button (empfohlen)"
            description="Ein Skript, ein Button in der Ecke, Overlay öffnet sich auf Klick. Funktioniert auf jeder Seite Ihrer Domain."
            code={widgetSnippet}
            previewHref="/embed"
          />

          <Snippet
            title="Variante B — Inline-Iframe"
            description="Direkt eingebettet auf einer eigenen Seite (z.B. /kontakt). Das Iframe meldet seine Höhe automatisch zurück."
            code={iframeSnippet}
            previewHref="/embed"
          />

          <div className="card p-6 bg-paper-dark/40 border-dashed mt-6">
            <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-2">
              Hinweise zur Einbindung
            </h2>
            <ul className="text-sm text-ink-dark/90 space-y-1 list-disc pl-5">
              <li>
                Beide Varianten laden das Widget aus Ihrer Mandorino-Instanz. Brand-Farben, Logo
                und Texte stammen aus <code className="bg-paper-dark px-1 rounded">tenant.config.ts</code>.
              </li>
              <li>
                Das Iframe sendet keinerlei Tracking. Für Conversion-Tracking lauschen Sie
                optional auf das DOM-Event <code className="bg-paper-dark px-1 rounded">window.addEventListener("mandorino:submitted", …)</code>.
              </li>
              <li>
                Sie können <code className="bg-paper-dark px-1 rounded">data-position</code>{" "}
                (br/bl/tr/tl), <code className="bg-paper-dark px-1 rounded">data-button-text</code>
                {" "}und <code className="bg-paper-dark px-1 rounded">data-button-color</code> frei anpassen.
              </li>
              <li>
                CSP-Hinweis: Erlauben Sie auf Ihrer Domain in <code className="bg-paper-dark px-1 rounded">frame-src</code>{" "}
                und <code className="bg-paper-dark px-1 rounded">script-src</code> die Origin{" "}
                <code className="bg-paper-dark px-1 rounded">{origin || "Ihre-Mandorino-Origin"}</code>.
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <Link href="/team/dashboard" className="btn-secondary">
              Zurück zur Lead-Übersicht
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Snippet({
  title,
  description,
  code,
  previewHref,
}: {
  title: string;
  description: string;
  code: string;
  previewHref: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback ignore — Browser ohne Clipboard-API
    }
  }

  return (
    <div className="card p-6 mb-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-dark">{title}</h2>
          <p className="text-sm text-muted mt-1 max-w-2xl">{description}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-sm"
          >
            Vorschau öffnen
          </a>
          <button type="button" onClick={copy} className="btn-primary text-sm">
            {copied ? "✓ Kopiert" : "Code kopieren"}
          </button>
        </div>
      </div>
      <pre className="bg-ink/95 text-paper rounded-md p-4 overflow-x-auto text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
