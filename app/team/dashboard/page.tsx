"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PriorityPill, StatusPill } from "@/components/StatusPill";
import { getCurrentUser, listTeam, logout, verifySession, type SessionUser } from "@/lib/authStore";
import { getAllLeads, seedDemoLeadsIfEmpty } from "@/lib/leadStore";
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
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <span className="pill bg-ink/10 text-ink-dark mb-2">Lead-Übersicht</span>
              <h1 className="text-2xl font-bold">Eingegangene Anfragen</h1>
              <p className="text-sm text-muted mt-1">
                Angemeldet als {user.name} ({user.role}) · {TENANT.brand.kanzleiName}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/team/analytics" className="btn-secondary">
                Auswertung
              </Link>
              <button type="button" onClick={handleLogout} className="btn-secondary">
                Abmelden
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            <Kpi label="Leads gesamt" value={counts.total} />
            <Kpi label="Offen (neu / in Bearbeitung / kontaktiert)" value={counts.open} />
            <Kpi label="Mir zugewiesen" value={counts.mine} />
          </div>

          {/* Filter-Leiste */}
          <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
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
            <div className="card p-8 text-center text-muted">
              Keine Leads für diese Filter-Kombination.
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-paper-dark text-left text-xs uppercase tracking-wide text-muted">
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
                      <tr key={l.id} className="border-t border-line hover:bg-paper-dark/40">
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
                            className="text-xs brand-text underline"
                          >
                            Öffnen →
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
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
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
