"use client";

import { getBrowserSupabase, isSupabaseConfigured } from "./supabaseClient";
import { TENANT, type TenantTeamMember } from "./tenant.config";

const SESSION_KEY = "mandorino.session.v3";

/**
 * Auth — zwei Modi:
 *
 * 1. **Supabase Auth (Produktion):** wird benutzt, sobald
 *    NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY gesetzt sind.
 *    User-Anlage erfolgt einmalig im Supabase-Dashboard (oder via SQL-Snippet,
 *    siehe README). Passwörter werden gehasht in Supabase gespeichert; hier
 *    landen sie nie. Sessions verwalten wir nicht selbst — Supabase Client
 *    schreibt sie in seinen eigenen Storage und refresht den JWT automatisch.
 *
 * 2. **MVP-Fallback (Dev/Demo):** TENANT.team mit Klartext-Passwörtern,
 *    Sitzung im localStorage. Wird nur aktiv, wenn die Supabase-Env-Vars
 *    fehlen — explizit gewollt, damit `npm run dev` ohne Supabase funktioniert.
 *
 * In beiden Fällen ist `TENANT.team` die **Whitelist**: nur Email-Adressen,
 * die in der Tenant-Config stehen, dürfen ins Dashboard. So bleibt die
 * Kanzlei-Hoheit über „wer darf Leads sehen" auch dann erhalten, wenn
 * jemand sich versehentlich in der Supabase-Konsole einen User anlegt.
 */

export type SessionUser = Omit<TenantTeamMember, "password">;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function findTeamMemberByEmail(email: string): TenantTeamMember | null {
  const norm = email.trim().toLowerCase();
  return TENANT.team.find((m) => m.email.toLowerCase() === norm) ?? null;
}

function toSession(member: TenantTeamMember): SessionUser {
  return { id: member.id, name: member.name, email: member.email, role: member.role };
}

// ----------------------------------------------------------------------------
// Login
// ----------------------------------------------------------------------------

/**
 * Versucht Login. Async, weil Supabase Auth einen Netzwerk-Roundtrip braucht.
 * Liefert SessionUser bei Erfolg, sonst Fehlermeldung.
 */
export async function tryLogin(
  email: string,
  password: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const member = findTeamMemberByEmail(email);
  if (!member) {
    return { ok: false, error: "Diese E-Mail ist nicht im Team-Verzeichnis hinterlegt." };
  }

  if (isSupabaseConfigured()) {
    const sb = await getBrowserSupabase();
    if (!sb) {
      return { ok: false, error: "Supabase-Client konnte nicht initialisiert werden." };
    }
    const { error } = await sb.auth.signInWithPassword({
      email: member.email,
      password,
    });
    if (error) {
      return { ok: false, error: "Login fehlgeschlagen. Bitte prüfen Sie E-Mail und Passwort." };
    }
    // Sitzung verwaltet Supabase selbst. Wir cachen nur die Whitelist-Zuordnung
    // (Name/Rolle), damit das UI ohne extra Roundtrip rendern kann.
    if (isBrowser()) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(toSession(member)));
    }
    return { ok: true, user: toSession(member) };
  }

  // ---- MVP-Fallback ----
  if (member.password !== password) {
    return { ok: false, error: "Login fehlgeschlagen. Bitte prüfen Sie E-Mail und Passwort." };
  }
  if (isBrowser()) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(toSession(member)));
  }
  return { ok: true, user: toSession(member) };
}

// ----------------------------------------------------------------------------
// Session abfragen
// ----------------------------------------------------------------------------

/**
 * Synchroner Cache-Read — UI rendert sofort, ohne await.
 * Bei Supabase-Modus prüft `verifySession()` zusätzlich asynchron, ob die
 * Supabase-Session noch gültig ist (z.B. nach Server-seitigem Sign-Out oder
 * abgelaufenem Refresh-Token).
 */
export function getCurrentUser(): SessionUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Prüft im Hintergrund, ob die Supabase-Session noch gültig ist.
 * Nicht-blockierend — Aufrufer entscheiden, ob sie auf das Ergebnis reagieren
 * (z.B. Redirect zum Login, wenn `null`).
 */
export async function verifySession(): Promise<SessionUser | null> {
  const cached = getCurrentUser();
  if (!isSupabaseConfigured()) return cached;
  const sb = await getBrowserSupabase();
  if (!sb) return cached;
  const { data } = await sb.auth.getSession();
  const sbEmail = data.session?.user?.email;
  if (!sbEmail) {
    if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
  const member = findTeamMemberByEmail(sbEmail);
  if (!member) {
    // Supabase-User existiert, ist aber nicht (mehr) auf der Tenant-Whitelist.
    await sb.auth.signOut();
    if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
  return toSession(member);
}

// ----------------------------------------------------------------------------
// Logout
// ----------------------------------------------------------------------------

export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = await getBrowserSupabase();
    if (sb) await sb.auth.signOut();
  }
  if (isBrowser()) {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

// ----------------------------------------------------------------------------
// Team-Anzeige (Zuweisungs-Dropdown)
// ----------------------------------------------------------------------------

export function listTeam(): SessionUser[] {
  return TENANT.team.map(toSession);
}
