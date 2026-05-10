"use client";

import { useEffect } from "react";

import { TENANT } from "@/lib/tenant.config";

/**
 * Bestätigungs-Seite für den Embed-Modus. Sendet zusätzlich ein
 * `mandorino:submitted`-Event ans Eltern-Fenster, damit `widget.js`
 * (oder ein eigenes Iframe-Setup der Kanzlei) z.B. auf der eigenen
 * Website ein Conversion-Tracking auslösen kann.
 */
export default function EmbedDankePage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.parent?.postMessage(
      { type: "mandorino:submitted", tenant: TENANT.brand.kanzleiName },
      "*",
    );
    const post = () => {
      const h = Math.ceil(document.documentElement.scrollHeight);
      window.parent?.postMessage({ type: "mandorino:resize", height: h }, "*");
    };
    post();
    const ro = new ResizeObserver(post);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="bg-paper">
      <div className="brand-bg text-white px-4 py-2 text-sm font-medium">
        {TENANT.brand.kanzleiName}
      </div>
      <div className="p-6 text-center">
        <div className="w-12 h-12 rounded-full brand-bg text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">
          ✓
        </div>
        <h1 className="text-xl font-bold mb-2">Vielen Dank — Ihre Anfrage ist eingegangen.</h1>
        <p className="text-sm text-muted leading-relaxed">
          Die Kanzlei {TENANT.brand.kanzleiName} meldet sich in der Regel innerhalb{" "}
          {TENANT.legal.rueckmeldungInnerhalb} bei Ihnen.
        </p>
        <p className="text-xs text-muted mt-4">
          Dieses Widget ist keine Rechtsberatung. Die rechtliche Bewertung erfolgt durch die Kanzlei.
        </p>
      </div>
    </div>
  );
}
