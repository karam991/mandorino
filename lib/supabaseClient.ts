"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-Singleton-Supabase-Client (Anon-Key).
 * Wird für Auth (Sign-In/Sign-Out) und für RLS-geschützte Reads genutzt.
 *
 * Nutzt `@supabase/ssr` → die Session liegt in Cookies statt localStorage,
 * damit `middleware.ts` /team/* serverseitig schützen kann.
 *
 * Lazy import — solange Supabase nicht installiert ist, schmeißt der Aufruf,
 * was vom UI als „nicht konfiguriert" interpretiert werden kann.
 */

let cached: SupabaseClient | null | undefined;

export async function getBrowserSupabase(): Promise<SupabaseClient | null> {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    cached = null;
    return null;
  }
  try {
    const { createBrowserClient } = await import("@supabase/ssr");
    cached = createBrowserClient(url, anon);
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Demo-Modus: localStorage-Leads + einfacher Login, KEIN Supabase.
 * Wird nur aktiv, wenn explizit `NEXT_PUBLIC_DEMO_MODE=1` gesetzt ist UND
 * Supabase nicht konfiguriert ist. Fehlende Env-Vars schalten also nicht
 * mehr stillschweigend einen unsicheren Modus frei.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "1" && !isSupabaseConfigured();
}
