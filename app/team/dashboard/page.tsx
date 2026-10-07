"use client";

import { useEffect as useEffectK, useState as useStateK } from "react";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PriorityPill, StatusPill } from "@/components/StatusPill";
import { getCurrentUser, listTeam, logout, verifySession, type SessionUser } from "@/lib/authStore";
import { getAllLeads, seedDemoLeadsIfEmpty } from "@/lib/leadStore";
import { downloadAllLeadsCsv } from "@/lib/exportLead";
import { TENANT } from "@/lib/tenant.config";
import { getActivePracticeAreaIds } from "@/lib/tenantOverrides";
import { listPracticeAreas } from "@/lib/areas/registry";
import { LEAD_STATUSES, type InsuranceInfo, type Lead, type LeadStatus } from "@/lib/types";

type SortKey = "newest" | "priority";
type StatusFilter = LeadStatus | "alle" | "offen";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("offen");
  const [areaFilter, setAreaFilter] = useState<string>("alle");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("alle");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("priority");

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      router.replace("/team/login");
      return;
    }
    setUser(cur);
    seedDemoLeadsIfEmpty();
    setLeads(getAllLeads());
    // Asynchrone Bestätigung der Session bei Supabase im Hintergrund
    void verifySession().then((u) => {
      if (!u) router.replace("/team/login");
    });
  }, [router]);

  const team = useMemo(() => listTeam(), []);
  const activeAreas = useMemo(() => listPracticeAreas(getActivePracticeAreaIds()), [user]);

  const filtered = useMemo(() => {
    let list = leads;

    // Status
    if (statusFilter === "offen") {
      list = list.filter(
        (l) => l.status === "neu" || l.status === "in_bearbeitung" || l.status === "kontaktiert",
      );
    } else if (statusFilter !== "alle") {
      list = list.filter((l) => l.status === statusFilter);
    }

    // Area
    if (areaFilter !== "alle") {
      list = list.filter((l) => l.areaId === areaFilter);
    }

    // Assignee
    if (assigneeFilter === "unassigned") {
      list = list.filter((l) => !l.assignedToUserId);
    } else if (assigneeFilter === "mine" && user) {
      list = list.filter((l) => l.assignedToUserId === user.id);
    } else if (assigneeFilter !== "alle") {
      list = list.filter((l) => l.assignedToUserId === assigneeFilter);
    }

    // Suche
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((l) => {
        const hay = [
          l.contact.firstName,
          l.contact.lastName,
          l.contact.email,
          l.contact.postalCode,
          l.areaLabel,
          l.aiSummary ?? "",
          l.userNotes ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortKey === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // priority: numeric desc, dann newest
      const diff = b.priority.numeric - a.priority.numeric;
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [leads, statusFilter, areaFilter, assigneeFilter, search, sortKey, user]);

  if (!user) return null;

  const counts = {
    total: leads.length,
    open: leads.filter(
      (l) => l.status === "neu" || l.status === "in_bearbeitung" || l.status === "kontaktiert",
    ).length,
    mine: leads.filter((l) => l.assignedToUserId === user.id).length,
  };

  async function handleLogout() {
    await logout();
    router.push("/team/login");
  }

  return (
    <>
      <Header variant="team" />
      <main className="flex-1 bg-paper">
        <section className="mx-auto max-w-page px-4 sm:px-6 py-6">
          {/* Top-Leiste */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7 animate-fade-up">
            <div>
              <span className="pill bg-ink/10 text-ink-dark mb-2">Lead-Übersicht</span>
              <h1 className="text-3xl sm:text-4xl font-semibold">Eingegangene Anfragen</h1>
              <p className="text-sm text-muted mt-1">
                Angemeldet als {user.name} ({user.role}) · {TENANT.brand.kanzleiName}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => downloadAllLeadsCsv(filtered, statusFilter)}
                disabled={filtered.length === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Aktuelle gefilterte Lead-Liste als CSV exportieren (Excel-kompatibel)"
              >
                Export CSV ({filtered.length})
              </button>
              <Link href="/team/analytics" className="btn-secondary">
                Auswertung
              </Link>
              <button type="button" onClick={handleLogout} className="btn-secondary">
                Abmelden
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6 animate-fade-up delay-1">
            <Kpi label="Leads gesamt" value={counts.total} />
            <Kpi label="Offen (neu / in Bearbeitung / kontaktiert)" value={counts.open} />
            <Kpi label="Mir zugewiesen" value={counts.mine} />
          </div>

          {/* Filter-Leiste */}
          <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end animate-fade-up delay-2">
            <FilterField label="Status">
              <select
                className="input py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="offen">Offen (alle aktiven)</option>
                <option value="alle">Alle Status</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {labelFor(s)}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Rechtsgebiet">
              <select
                className="input py-2"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              >
                <option value="alle">Alle</option>
                {activeAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Bearbeiter:in">
              <select
                className="input py-2"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                <option value="alle">Alle</option>
                <option value="mine">Mir zugewiesen</option>
                <option value="unassigned">Nicht zugewiesen</option>
                {team.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label="Suche">
              <input
                className="input py-2"
                placeholder="Name, E-Mail, PLZ, Stichwort…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </FilterField>

            <FilterField label="Sortierung">
              <select
                className="input py-2"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="priority">Bearbeitungs-Priorität</option>
                <option value="newest">Neueste zuerst</option>
              </select>
            </FilterField>
          </div>

          {/* Liste */}
          {filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-paper text-ink">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 5h16v11H8l-4 4V5Z" />
                </svg>
              </div>
              <p className="font-serif text-xl font-semibold text-ink-dark">Keine Anfragen gefunden</p>
              <p className="mt-1 text-sm text-muted">Für diese Filter-Kombination gibt es aktuell keine Leads.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto animate-fade-up delay-3">
              <table className="w-full text-sm">
                <thead className="bg-paper text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3">Eingang</th>
                    <th className="px-4 py-3">Mandant</th>
                    <th className="px-4 py-3">Rechtsgebiet</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priorität</th>
                    <th className="px-4 py-3">RS</th>
                    <th className="px-4 py-3">Streitwert</th>
                    <th className="px-4 py-3">Dok.</th>
                    <th className="px-4 py-3">Bearbeiter:in</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => {
                    const assignedName =
                      team.find((t) => t.id === l.assignedToUserId)?.name ?? "—";
                    const docs = (l.areaData as Record<string, unknown>)?.documents;
                    const docCount = Array.isArray(docs) ? docs.length : 0;
                    return (
                      <tr key={l.id} className="group border-t border-line transition-colors hover:bg-paper/70">
                        <td className="px-4 py-3 whitespace-nowrap text-muted">
                          {new Date(l.createdAt).toLocaleString("de-DE", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full brand-bg text-[10px] font-semibold text-white" aria-hidden="true">
                              {(l.contact.firstName?.[0] ?? "") + (l.contact.lastName?.[0] ?? "")}
                            </span>
                            <span className="font-medium text-ink-dark">
                              {l.contact.firstName} {l.contact.lastName}
                            </span>
                            {l.clientType === "business" && (
                              <span
                                className="pill bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px]"
                                title="Anfrage im Auftrag eines Unternehmens / Selbstständig"
                              >
                                B2B
                              </span>
                            )}
                          </div>
                          {l.clientType === "business" && l.contact.business?.companyName && (
                            <div className="text-xs text-ink-dark/80 truncate max-w-[220px]">
                              {l.contact.business.companyName}
                            </div>
                          )}
                          <div className="text-xs text-muted">PLZ {l.contact.postalCode}</div>
                        </td>
                        <td className="px-4 py-3">{l.areaLabel}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={l.status} />
                        </td>
                        <td className="px-4 py-3">
                          <PriorityPill tier={l.priority.tier} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <InsurancePill insurance={l.insurance} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-dark/90">
                          {l.claimValue ?? <span className="text-muted">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {docCount > 0 ? (
                            <span
                              className="inline-flex items-center gap-1 pill bg-paper-dark text-ink-dark"
                              title={`${docCount} Unterlage(n) genannt`}
                            >
                              <span aria-hidden>📎</span>
                              {docCount}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted">{assignedName}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/team/lead/${l.id}`}
                            className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition-all group-hover:border-ink/40 group-hover:shadow-soft"
                          >
                            Öffnen <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">→</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  const [shown, setShown] = useStateK(0);
  useEffectK(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (now: number) => {
      const k = Math.min((now - start) / dur, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="card relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[color:var(--brand-accent)] to-transparent" aria-hidden="true" />
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-2 font-serif text-4xl font-semibold tabular-nums text-ink-dark">{shown}</div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 min-w-[160px] flex-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

function InsurancePill({ insurance }: { insurance?: InsuranceInfo }) {
  if (!insurance) return <span className="text-xs text-muted">—</span>;
  if (insurance.status === "Ja") {
    return (
      <span
        className="inline-flex items-center gap-1 pill bg-emerald-50 text-emerald-800 border border-emerald-200"
        title={insurance.provider ? `Versicherer: ${insurance.provider}` : "Versicherer nicht genannt"}
      >
        Ja
      </span>
    );
  }
  if (insurance.status === "Nein") {
    return (
      <span className="pill bg-amber-50 text-amber-800 border border-amber-200">
        Nein
      </span>
    );
  }
  return (
    <span className="pill bg-paper-dark text-ink-dark/80" title="Mandant unsicher">
      ?
    </span>
  );
}

function labelFor(s: LeadStatus): string {
  switch (s) {
    case "neu":
      return "Neu";
    case "in_bearbeitung":
      return "In Bearbeitung";
    case "kontaktiert":
      return "Kontaktiert";
    case "mandat_angenommen":
      return "Mandat angenommen";
    case "abgelehnt":
      return "Abgelehnt";
    case "erledigt":
      return "Erledigt";
  }
}
