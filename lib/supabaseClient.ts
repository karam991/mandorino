"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-Singleton-Supabase-Client (Anon-Key).
 * Wird für Auth (Sign-In/Sign-Out) und für RLS-geschützte Reads genutzt.
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
    const { createClient } = await import("@supabase/supabase-js");
    cached = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "mandorino.sb.auth",
      },
    });
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
