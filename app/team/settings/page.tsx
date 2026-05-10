"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCurrentUser, verifySession, type SessionUser } from "@/lib/authStore";
import { listPracticeAreas, type PracticeAreaId } from "@/lib/areas/registry";
import { TENANT } from "@/lib/tenant.config";
import {
  getActivePracticeAreaIds,
  hydrateActivePracticeAreaIdsFromSupabase,
  persistActivePracticeAreaIds,
  resetActivePracticeAreaIds,
} from "@/lib/tenantOverrides";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

/**
 * Einstellungs-Seite für das Kanzlei-Team.
 *
 * Aktuell: Auswahl der aktiven Rechtsgebiete (kleinere Kanzleien wollen
 * vielleicht nur 2 Bereiche anbieten, größere alle 5).
 *
 * Bewusst nur für `admin`-Rolle freigeschaltet — die Bearbeiter:innen
 * sollen nicht versehentlich Schwerpunkte abklemmen.
 */
type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved-cloud"; at: number }
  | { kind: "saved-local"; at: number; reason: string };

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [active, setActive] = useState<Set<PracticeAreaId>>(new Set());
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cur = getCurrentUser();
    if (!cur) {
      router.replace("/team/login");
      return;
    }
    setUser(cur);
    setActive(new Set(getActivePracticeAreaIds()));
    void verifySession().then((u) => {
      if (!u) router.replace("/team/login");
    });
    // Hintergrund: aus Supabase nachladen, falls dort eine andere Auswahl liegt
    void hydrateActivePracticeAreaIdsFromSupabase().then((updated) => {
      if (updated) setActive(new Set(getActivePracticeAreaIds()));
      setHydrated(true);
    });
  }, [router]);

  // Vollständiger Katalog: alle im Code verfügbaren Areas (auch wenn aktuell deaktiviert)
  const allAreas = useMemo(() => listPracticeAreas(TENANT.practiceAreas), []);

  if (!user) return null;

  const isAdmin = user.role === "admin";

  function toggle(id: PracticeAreaId) {
    if (!isAdmin) return;
    setActive((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    if (!isAdmin) return;
    // Reihenfolge wie in TENANT.practiceAreas erhalten
    const ordered = TENANT.practiceAreas.filter((id) => active.has(id));
    if (ordered.length === 0) {
      alert("Mindestens ein Rechtsgebiet muss aktiv bleiben.");
      return;
    }
    setStatus({ kind: "saving" });
    const result = await persistActivePracticeAreaIds(ordered);
    if (result.ok) {
      setStatus({ kind: "saved-cloud", at: Date.now() });
    } else {
      const reasonText = (() => {
        switch (result.reason) {
          case "no-supabase":
            return "Supabase nicht konfiguriert";
          case "auth":
            return "Session abgelaufen — bitte neu einloggen";
          case "rls":
            return "Keine Schreib-Berechtigung (Admin-Rolle erforderlich)";
          default:
            return result.message ?? "Unbekannter Fehler";
        }
      })();
      setStatus({ kind: "saved-local", at: Date.now(), reason: reasonText });
    }
  }

  async function reset() {
    if (!isAdmin) return;
    resetActivePracticeAreaIds();
    setActive(new Set(TENANT.practiceAreas));
    // Auch in Supabase: alle Areas wieder aktiv (entspricht Tenant-Default)
    setStatus({ kind: "saving" });
    const result = await persistActivePracticeAreaIds([...TENANT.practiceAreas]);
    if (result.ok) {
      setStatus({ kind: "saved-cloud", at: Date.now() });
    } else {
      setStatus({
        kind: "saved-local",
        at: Date.now(),
        reason: result.message ?? "Synchronisierung fehlgeschlagen",
      });
    }
  }

  return (
    <>
      <Header variant="team" />
      <main className="flex-1 bg-paper">
        <section className="mx-auto max-w-page px-4 sm:px-6 py-6">
          <div className="mb-6">
            <span className="pill bg-ink/10 text-ink-dark mb-2">Kanzlei-Einstellungen</span>
            <h1 className="text-2xl font-bold">Schwerpunkte verwalten</h1>
            <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">
              Wählen Sie aus, welche Rechtsgebiete auf Ihrer Mandanten-Seite und im
              Chat angeboten werden. Deaktivierte Bereiche verschwinden sofort aus der
              Landing-Page und der Auswahl im Chatbot.
            </p>
          </div>

          {!isAdmin && (
            <div className="card p-4 mb-4 bg-paper-dark/40 border-dashed text-sm text-ink-dark/90">
              Diese Einstellungen können nur Admin-Konten ändern. Sie sind als{" "}
              <strong>{user.role}</strong> eingeloggt.
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-sm font-semibold text-ink-dark uppercase tracking-wide mb-4">
              Verfügbare Rechtsgebiete
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {allAreas.map((a) => {
                const checked = active.has(a.id as PracticeAreaId);
                return (
                  <li key={a.id}>
                    <label
                      className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition ${
                        checked
                          ? "border-ink/40 bg-paper-dark/60"
                          : "border-line bg-white hover:border-ink/20"
                      } ${isAdmin ? "" : "opacity-60 cursor-not-allowed"}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-current"
                        checked={checked}
                        disabled={!isAdmin}
                        onChange={() => toggle(a.id as PracticeAreaId)}
                      />
                      <div>
                        <div className="font-semibold text-ink-dark">{a.label}</div>
                        <div className="text-xs text-muted leading-relaxed mt-1">
                          {a.blurb}
                        </div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap gap-3 mt-6 items-center">
              <button
                type="button"
                className="btn-primary"
                onClick={() => void save()}
                disabled={!isAdmin || status.kind === "saving"}
              >
                {status.kind === "saving" ? "Speichere…" : "Auswahl speichern"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void reset()}
                disabled={!isAdmin || status.kind === "saving"}
              >
                Auf Tenant-Default zurücksetzen
              </button>
              {status.kind === "saved-cloud" && (
                <span className="text-sm text-emerald-700">
                  ✓ Gespeichert &amp; synchronisiert um{" "}
                  {new Date(status.at).toLocaleTimeString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}
              {status.kind === "saved-local" && (
                <span className="text-sm text-amber-700">
                  Lokal gespeichert (Cloud-Sync fehlgeschlagen: {status.reason})
                </span>
              )}
            </div>

            <p className="text-xs text-muted mt-4 leading-relaxed">
              {isSupabaseConfigured() ? (
                hydrated ? (
                  <>Synchronisiert mit Supabase — Änderungen werden für alle Team-Geräte übernommen.</>
                ) : (
                  <>Lade Cloud-Stand…</>
                )
              ) : (
                <>
                  Supabase ist in dieser Umgebung nicht konfiguriert — die Auswahl
                  gilt nur für diesen Browser.
                </>
              )}
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
