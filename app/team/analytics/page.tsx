"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCurrentUser, verifySession, type SessionUser } from "@/lib/authStore";
import { getAllLeads, seedDemoLeadsIfEmpty } from "@/lib/leadStore";
import type { Lead } from "@/lib/types";

/**
 * Analytics-Platzhalter — bewusst minimal gehalten (Token-/Aufwands-Sparen).
 * Vier KPIs + ein einfaches Bar-Chart pro Rechtsgebiet, alles aus dem
 * localStorage gerechnet. Echte Auswertung (Conversion-Funnel,
 * Bearbeitungszeiten pro User, Lead-Quellen) folgt nach Launch.
 */

export default function AnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      router.replace("/team/login");
      return;
    }
    setUser(cur);
    seedDemoLeadsIfEmpty();
    setLeads(getAllLeads());
    void verifySession().then((u) => {
      if (!u) router.replace("/team/login");
    });
  }, [router]);

  const stats = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 86400000;
    const thirtyDays = 30 * 86400000;

    const last7 = leads.filter(
      (l) => now - new Date(l.createdAt).getTime() <= sevenDays,
    ).length;
    const last30 = leads.filter(
      (l) => now - new Date(l.createdAt).getTime() <= thirtyDays,
    ).length;

    const open = leads.filter(
      (l) => l.status === "neu" || l.status === "in_bearbeitung" || l.status === "kontaktiert",
    ).length;

    const accepted = leads.filter((l) => l.status === "mandat_angenommen").length;
    const decided = leads.filter(
      (l) => l.status === "mandat_angenommen" || l.status === "abgelehnt",
    ).length;
    const conversion = decided === 0 ? 0 : Math.round((accepted / decided) * 100);

    // Verteilung pro Area
    const byArea: Record<string, number> = {};
    for (const l of leads) {
      byArea[l.areaLabel] = (byArea[l.areaLabel] ?? 0) + 1;
    }
    const areaRows = Object.entries(byArea).sort((a, b) => b[1] - a[1]);
    const maxArea = areaRows[0]?.[1] ?? 1;

    return { last7, last30, open, conversion, areaRows, maxArea };
  }, [leads]);

  if (!user) return null;

  return (
    <>
      <Header variant="team" />
      <main className="flex-1 bg-paper">
        <section className="mx-auto max-w-page px-4 sm:px-6 py-6">
          <div className="mb-6">
            <span className="pill bg-ink/10 text-ink-dark mb-2">Auswertung</span>
            <h1 className="text-2xl font-bold">Lead-Übersicht</h1>
            <p className="text-sm text-muted mt-1">
              Schlanke Auswertung — wird nach Launch um Funnel-, Reaktionszeit- und
              Quellen-Kennzahlen erweitert.
            </p>
          </div>

          {/* Vier KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Kpi label="Leads (7 Tage)" value={String(stats.last7)} />
            <Kpi label="Leads (30 Tage)" value={String(stats.last30)} />
            <Kpi label="Offen" value={String(stats.open)} />
            <Kpi
              label="Mandate / Entschiedene"
              value={`${stats.conversion}%`}
              hint="Mandate angenommen vs. Mandate angenommen + abgelehnt"
            />
          </div>

          {/* Verteilung pro Rechtsgebiet */}
          <div className="card p-6 mb-6">
            <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-4">
              Leads pro Rechtsgebiet
            </h2>
            {stats.areaRows.length === 0 ? (
              <p className="text-sm text-muted">Noch keine Daten.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.areaRows.map(([label, count]) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-40 text-sm text-ink-dark truncate">{label}</div>
                    <div className="flex-1 bg-paper-dark h-3 rounded-full overflow-hidden">
                      <div
                        className="brand-bg h-full"
                        style={{ width: `${Math.round((count / stats.maxArea) * 100)}%` }}
                      />
                    </div>
                    <div className="w-10 text-right text-sm font-medium tabular-nums">
                      {count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TODO-Platzhalter */}
          <div className="card p-6 bg-paper-dark/50 border-dashed">
            <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-3">
              Geplant — nach Launch
            </h2>
            <ul className="text-sm text-muted space-y-1">
              <li>· Funnel: Anfrage → Kontaktiert → Mandat (Conversion-Stufen)</li>
              <li>· Median-Reaktionszeit pro Bearbeiter:in</li>
              <li>· Lead-Quellen (UTM, Direktzugriff, Re-Targeting)</li>
              <li>· Verlauf über Zeit (Wochenkurve, saisonale Muster)</li>
            </ul>
            <p className="text-xs text-muted mt-3">
              TODO: Diese Auswertungen brauchen Server-seitige Persistenz (kein localStorage).
              Mit Supabase/Postgres als Backend in 1–2 Tagen umsetzbar.
            </p>
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

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint && <div className="text-[11px] text-muted mt-1 leading-snug">{hint}</div>}
    </div>
  );
}
