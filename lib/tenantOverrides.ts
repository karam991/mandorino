import { TENANT } from "./tenant.config";
import type { PracticeAreaId } from "./areas/registry";
import { getBrowserSupabase } from "./supabaseClient";

/**
 * Tenant-Overrides — Werte, die das Team im laufenden Betrieb anpassen kann,
 * ohne in `tenant.config.ts` zu greifen.
 *
 * Zwei-Schichten-Modell:
 *   1. localStorage = Cache (sofort verfügbar, sync API)
 *   2. Supabase `tenant_settings` = Source of Truth (geteilt zwischen Geräten)
 *
 * Lesen ist sync (aus Cache). Hydratisierung aus Supabase passiert beim Mount
 * der Settings-Seite und füllt den Cache neu. Schreiben aktualisiert Cache
 * sofort und persistiert anschließend in Supabase (asynchron).
 */

const KEY = "mandorino.tenant.activeAreas.v1";
const SETTINGS_KEY_AREAS = "active_practice_areas";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function filterToAllowed(input: unknown): PracticeAreaId[] | null {
  if (!Array.isArray(input)) return null;
  const allowed = new Set<string>(TENANT.practiceAreas);
  const filtered = (input as unknown[]).filter(
    (id): id is PracticeAreaId =>
      typeof id === "string" && allowed.has(id),
  );
  return filtered.length > 0 ? filtered : null;
}

/**
 * Liefert die aktuell aktiven Rechtsgebiete (sync, aus Cache).
 * - Im Browser: localStorage-Override (falls gesetzt), sonst TENANT-Default.
 * - Server-seitig (SSR/Build): immer TENANT-Default.
 */
export function getActivePracticeAreaIds(): PracticeAreaId[] {
  if (!isBrowser()) return [...TENANT.practiceAreas];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [...TENANT.practiceAreas];
    const parsed = JSON.parse(raw);
    const filtered = filterToAllowed(parsed);
    return filtered ?? [...TENANT.practiceAreas];
  } catch {
    return [...TENANT.practiceAreas];
  }
}

/** Schreibt nur in den lokalen Cache. Für Supabase-Persistenz: persistActivePracticeAreaIds(). */
export function setActivePracticeAreaIds(ids: PracticeAreaId[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Quota voll o.ä. — wir schlucken still
  }
}

export function resetActivePracticeAreaIds(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/**
 * Hydratisiert den lokalen Cache aus Supabase. Best-effort: bei Fehler
 * (Supabase nicht konfiguriert, RLS-Block, Tabelle leer, …) bleibt der
 * Cache unverändert.
 *
 * Rückgabe: true, wenn der Cache aus Supabase aktualisiert wurde.
 */
export async function hydrateActivePracticeAreaIdsFromSupabase(): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    const sb = await getBrowserSupabase();
    if (!sb) return false;
    const { data, error } = await sb
      .from("tenant_settings")
      .select("value")
      .eq("key", SETTINGS_KEY_AREAS)
      .maybeSingle();
    if (error || !data) return false;
    const filtered = filterToAllowed(data.value);
    if (!filtered) return false;
    window.localStorage.setItem(KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

export type PersistResult =
  | { ok: true }
  | { ok: false; reason: "no-browser" | "no-supabase" | "auth" | "rls" | "unknown"; message?: string };

/**
 * Persistiert die aktiven Rechtsgebiete in Supabase. Schreibt zusätzlich in
 * den lokalen Cache, damit beide Schichten konsistent bleiben.
 *
 * Voraussetzung: eingeloggter Admin (RLS-Policy "admin kann settings schreiben").
 */
export async function persistActivePracticeAreaIds(
  ids: PracticeAreaId[],
): Promise<PersistResult> {
  if (!isBrowser()) return { ok: false, reason: "no-browser" };

  // Cache zuerst — UI bleibt responsiv, falls Supabase träge antwortet
  setActivePracticeAreaIds(ids);

  try {
    const sb = await getBrowserSupabase();
    if (!sb) return { ok: false, reason: "no-supabase" };

    const { data: userData } = await sb.auth.getUser();
    const email = userData.user?.email ?? null;

    const { error } = await sb.from("tenant_settings").upsert(
      {
        key: SETTINGS_KEY_AREAS,
        value: ids,
        updated_at: new Date().toISOString(),
        updated_by: email,
      },
      { onConflict: "key" },
    );
    if (error) {
      // Postgres RLS-Verstoß → 42501; Supabase mappt das auf einen Fehler
      // mit Code "42501" oder Message-Substring "row-level security"
      const msg = error.message ?? "";
      if (msg.toLowerCase().includes("row-level security") || error.code === "42501") {
        return { ok: false, reason: "rls", message: msg };
      }
      if (!email) return { ok: false, reason: "auth", message: "Nicht eingeloggt" };
      return { ok: false, reason: "unknown", message: msg };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: "unknown",
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
