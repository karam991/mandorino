"use client";

import { useEffect, useRef } from "react";

import { ChatContainer } from "@/components/ChatContainer";
import { TENANT } from "@/lib/tenant.config";

/**
 * Embed-Page — wird im Iframe der Kanzlei-Website gerendert.
 *
 * Reicht die Innenhöhe per `postMessage` an das Eltern-Fenster, damit
 * `widget.js` (oder ein eigenes Iframe-Setup der Kanzlei) das Iframe
 * automatisch nachjustieren kann.
 *
 * Hinweis: Wir senden absichtlich KEIN spezielles Origin-Filtering,
 * da das Embed pro Kanzlei in deren Domain läuft. Nachrichten an `*`
 * sind unkritisch, weil wir nur Größenangaben senden.
 */
export default function EmbedPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = containerRef.current;
    if (!el) return;

    let last = 0;
    const post = () => {
      const h = Math.ceil(document.documentElement.scrollHeight);
      if (h !== last) {
        last = h;
        window.parent?.postMessage(
          { type: "mandorino:resize", height: h, tenant: TENANT.brand.kanzleiName },
          "*",
        );
      }
    };

    // Initial + bei Mutationen
    post();
    const ro = new ResizeObserver(post);
    ro.observe(document.body);
    const mo = new MutationObserver(post);
    mo.observe(document.body, { subtree: true, childList: true, attributes: true });
    window.addEventListener("resize", post);

    // „ready"-Ping fürs Eltern-Skript
    window.parent?.postMessage(
      { type: "mandorino:ready", tenant: TENANT.brand.kanzleiName },
      "*",
    );

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", post);
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-paper text-ink">
      {/* Kompakter Brand-Streifen statt voller Header */}
      <div className="brand-bg text-white px-4 py-2 text-sm font-medium flex items-center justify-between">
        <span>{TENANT.brand.kanzleiName}</span>
        <span className="text-xs opacity-80">Anfrage · keine Rechtsberatung</span>
      </div>

      <ChatContainer variant="embed" successPath={(id) => `/embed/danke?lead=${encodeURIComponent(id)}`} />
    </div>
  );
}
