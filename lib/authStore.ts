"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getBrowserSupabase, isDemoMode, isSupabaseConfigured } from "./supabaseClient";
import { TENANT, type TenantTeamMember } from "./tenant.config";

const SESSION_KEY = "mandorino.session.v3";

/**
 * Auth — zwei Modi:
 *
 * 1. **Supabase Auth (Produktion):** aktiv, sobald NEXT_PUBLIC_SUPABASE_URL +
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY gesetzt sind. Die Session liegt in Cookies
 *    (`@supabase/ssr`), `middleware.ts` schützt /team/* serverseitig.
 *    **Wer rein darf, entscheidet die DB-Tabelle `tenant_team`** (gleiche Quelle
 *    wie die RLS-Policies). `TENANT.team` dient nur noch als Anzeige-Fallback
 *    und zur Zuordnung bestehender User-IDs.
 *
 * 2. **Demo-Modus:** nur mit explizitem `NEXT_PUBLIC_DEMO_MODE=1` und ohne
 *    Supabase. Alle Einträge aus `TENANT.team` melden sich mit dem
 *    gemeinsamen `NEXT_PUBLIC_DEMO_PASSWORD` an (bewusst öffentlich, nur für
 *    Sales-Demos mit Fake-Daten). Ohne Flag und ohne Supabase ist kein Login möglich.
 *
 * Der localStorage-Eintrag ist nur ein UI-Cache (Name/Rolle). Er gewährt
 * keinen Zugriff — den erzwingen Middleware und RLS.
 */

export type SessionUser = Omit<TenantTeamMember, "password">;

const GENERIC_LOGIN_ERROR = "Login fehlgeschlagen. Bitte prüfen Sie E-Mail und Passwort.";

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

function cacheSession(user: SessionUser): void {
  if (isBrowser()) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession(): void {
  if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
}

/**
 * Liest das Team-Mitglied aus `tenant_team` (RLS: nur für Mitglieder lesbar →
 * kein Treffer = nicht berechtigt). Bestehende IDs aus TENANT.team bleiben
 * erhalten, damit Zuweisungen alter Leads gültig bleiben.
 */
async function fetchTeamMember(sb: SupabaseClient, email: string): Promise<SessionUser | null> {
  const { data, error } = await sb
    .from("tenant_team")
    .select("email, name, role")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error || !data) return null;
  const legacy = findTeamMemberByEmail(data.email);
  return {
    id: legacy?.id ?? data.email,
    name: data.name,
    email: data.email,
    role: data.role === "admin" ? "admin" : "bearbeiter",
  };
}

// ----------------------------------------------------------------------------
// Login
// ----------------------------------------------------------------------------

export async function tryLogin(
  email: string,
  password: string,
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  if (isSupabaseConfigured()) {
    const sb = await getBrowserSupabase();
    if (!sb) return { ok: false, error: "Supabase-Client konnte nicht initialisiert werden." };

    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, error: GENERIC_LOGIN_ERROR };

    const user = await fetchTeamMember(sb, email);
    if (!user) {
      // Gültiger Supabase-User, aber nicht auf der Team-Whitelist → sofort wieder abmelden.
      await sb.auth.signOut();
      return { ok: false, error: GENERIC_LOGIN_ERROR };
    }
    cacheSession(user);
    return { ok: true, user };
  }

  if (isDemoMode()) {
    const member = findTeamMemberByEmail(email);
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
    if (!member || !demoPassword || password !== demoPassword) {
      return { ok: false, error: GENERIC_LOGIN_ERROR };
    }
    const user = toSession(member);
    cacheSession(user);
    return { ok: true, user };
  }

  return {
    ok: false,
    error: "Login ist nicht konfiguriert. Bitte Supabase einrichten oder den Demo-Modus aktivieren.",
  };
}

// ----------------------------------------------------------------------------
// Session abfragen
// ----------------------------------------------------------------------------

/** Synchroner Cache-Read — nur für schnelles UI-Rendering, KEIN Berechtigungsnachweis. */
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
 * Prüft die echte Session (Supabase) bzw. den Demo-Cache und liefert den
 * Nutzer oder `null`. Aktualisiert den UI-Cache aus der Datenbank.
 */
export async function verifySession(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return isDemoMode() ? getCurrentUser() : null;

  const sb = await getBrowserSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  const email = data.user?.email;
  if (!email) {
    clearSession();
    return null;
  }
  const user = await fetchTeamMember(sb, email);
  if (!user) {
    await sb.auth.signOut();
    clearSession();
    return null;
  }
  cacheSession(user);
  return user;
}

// ----------------------------------------------------------------------------
// Logout
// ----------------------------------------------------------------------------

export async function logout(): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = await getBrowserSupabase();
    if (sb) await sb.auth.signOut();
  }
  clearSession();
}

// ----------------------------------------------------------------------------
// Team-Anzeige (Zuweisungs-Dropdown)
// ----------------------------------------------------------------------------

export function listTeam(): SessionUser[] {
  return TENANT.team.map(toSession);
}
