"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCurrentUser, tryLogin, verifySession } from "@/lib/authStore";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { TENANT } from "@/lib/tenant.config";

export default function TeamLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Cache-Check sofort, dann optional Supabase-Verify im Hintergrund.
    if (getCurrentUser()) {
      router.replace("/team/dashboard");
      return;
    }
    void verifySession().then((u) => {
      if (u) router.replace("/team/dashboard");
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await tryLogin(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/team/dashboard");
    } finally {
      setBusy(false);
    }
  }

  const supabaseMode = isSupabaseConfigured();
  const demo = TENANT.team.find((t) => t.password); // nur falls noch Demo-Passwort gesetzt

  return (
    <>
      <Header variant="team" />
      <main className="flex-1 bg-paper">
        <section className="mx-auto max-w-md px-4 sm:px-6 py-16">
          <div className="card p-8">
            <h1 className="text-2xl font-bold mb-2">Team-Login</h1>
            <p className="text-sm text-muted mb-6">
              Interner Zugang für das Team von {TENANT.brand.kanzleiName}.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-3">
              <input
                type="email"
                className="input"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                disabled={busy}
              />
              <input
                type="password"
                className="input"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={busy}
              />
              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
                  {error}
                </p>
              )}
              <button type="submit" className="btn-primary mt-2" disabled={busy}>
                {busy ? "Anmelden…" : "Anmelden"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-line text-xs text-muted">
              {supabaseMode ? (
                <>
                  <p className="font-semibold text-ink-dark mb-1">Authentifizierung</p>
                  <p>
                    Sicheres Login über Supabase Auth (gehashte Passwörter, JWT-Sessions).
                    Nur E-Mail-Adressen, die in der Tenant-Konfiguration hinterlegt sind,
                    erhalten Zugriff aufs Dashboard.
                  </p>
                </>
              ) : demo ? (
                <>
                  <p className="font-semibold text-ink-dark mb-1">Demo-Zugang (Dev-Modus)</p>
                  <p>
                    E-Mail: <code className="bg-paper-dark px-1 rounded">{demo.email}</code>
                    <br />
                    Passwort:{" "}
                    <code className="bg-paper-dark px-1 rounded">{demo.password}</code>
                  </p>
                  <p className="mt-2 text-[11px]">
                    Vor Launch <code>NEXT_PUBLIC_SUPABASE_URL</code> +{" "}
                    <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> setzen — dann läuft Login
                    automatisch über Supabase Auth.
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
