"use client";

import { CalendarDays, CalendarRange, CircleDot, Percent, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCurrentUser, verifySession, type SessionUser } from "@/lib/authStore";
import { listLeads } from "@/lib/clientLeads";
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
    listLeads()
      .then(setLeads)
      .catch((e) => console.error("[analytics] Leads konnten nicht geladen werden", e));
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
      <main id="main" className="flex-1 bg-paper">
        <section className="mx-auto max-w-page px-4 sm:px-6 py-6">
          <div className="mb-6">
            <span className="pill bg-ink/10 text-ink-dark mb-2">Auswertung</span>
            <h1 className="text-2xl font-bold">Lead-Übersicht</h1>
            <p className="text-sm text-muted mt-1">
              Kennzahlen zu den eingegangenen Anfragen.
            </p>
          </div>

          {/* Vier KPIs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Kpi Icon={CalendarDays} label="Leads (7 Tage)" value={String(stats.last7)} />
            <Kpi Icon={CalendarRange} label="Leads (30 Tage)" value={String(stats.last30)} />
            <Kpi Icon={CircleDot} label="Offen" value={String(stats.open)} />
            <Kpi
              Icon={Percent}
              label="Mandate / Entschiedene"
              value={`${stats.conversion}%`}
              hint="Mandate angenommen vs. Mandate angenommen + abgelehnt"
            />
          </div>

          {/* Verteilung pro Rechtsgebiet */}
          <div className="card p-6 mb-6">
            <h2 className="text-base font-semibold text-ink-dark mb-4">
              Leads pro Rechtsgebiet
            </h2>
            {stats.areaRows.length === 0 ? (
              <p className="text-sm text-muted">Noch keine Daten.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.areaRows.map(([label, count]) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-28 truncate text-sm text-ink-dark sm:w-40">{label}</div>
                    <div className="flex-1 bg-paper-dark h-3 rounded-full overflow-hidden">
                      <div
                        className="brand-bg h-full rounded-full transition-[width] duration-700 ease-out"
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

function Kpi({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[color:var(--brand-accent)] to-transparent"
        aria-hidden="true"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-muted">{label}</div>
        <Icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      </div>
      <div className="mt-2 font-serif text-4xl font-semibold tabular-nums text-ink-dark">{value}</div>
      {hint && <div className="mt-1 text-xs leading-snug text-muted">{hint}</div>}
    </div>
  );
}
