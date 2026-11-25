"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Mandarin } from "@/components/Mandarin";
import { getCurrentUser, tryLogin, verifySession } from "@/lib/authStore";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabaseClient";
import { TENANT } from "@/lib/tenant.config";

/** Mischt die Akzentfarbe mit Weiß/Schwarz → Metall-Verlauf in Markenfarbe. */
const tone = (mixWith: "white" | "black", pct: number) => ({
  stopColor: `color-mix(in srgb, var(--brand-accent), ${mixWith} ${pct}%)`,
});

/** Animierte Waage (Justitia) als gebürstetes Metall — dekorativ. */
function Scales() {
  return (
    <svg viewBox="0 0 200 200" className="h-56 w-56 drop-shadow-[0_16px_18px_rgba(0,0,0,0.4)] sm:h-64 sm:w-64" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <defs>
        {/* userSpaceOnUse: waagerechte/senkrechte Linien haben sonst keine Verlaufsfläche */}
        <linearGradient id="scMetal" gradientUnits="userSpaceOnUse" x1="30" y1="30" x2="170" y2="190">
          <stop offset="0" style={tone("white", 55)} />
          <stop offset="0.35" style={tone("white", 5)} />
          <stop offset="0.55" style={tone("white", 38)} />
          <stop offset="1" style={tone("black", 42)} />
        </linearGradient>
        <linearGradient id="scPan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={tone("white", 45)} />
          <stop offset="0.25" style={tone("black", 8)} />
          <stop offset="1" style={tone("black", 55)} />
        </linearGradient>
      </defs>
      {/* Sockel */}
      <ellipse cx="100" cy="186" rx="46" ry="6" fill="url(#scPan)" />
      <ellipse cx="100" cy="181" rx="28" ry="4.5" fill="url(#scPan)" />
      <path className="draw" d="M100 180V46" stroke="url(#scMetal)" strokeWidth="6" />
      <circle className="draw draw-2" cx="100" cy="40" r="7" stroke="url(#scMetal)" strokeWidth="4" />
      <g className="origin-[100px_62px] animate-swing">
        <path className="draw draw-2" d="M34 62h132" stroke="url(#scMetal)" strokeWidth="5" />
        <path className="draw draw-3" d="M44 62 22 122M44 62l22 60M156 62l-22 60M156 62l22 60" stroke="url(#scMetal)" strokeWidth="1.4" />
        <path d="M16 122q28 34 56 0Z" fill="url(#scPan)" />
        <path d="M128 122q28 34 56 0Z" fill="url(#scPan)" />
        <path className="draw draw-3" d="M16 122h56M128 122h56" stroke="url(#scMetal)" strokeWidth="2.4" />
        <circle cx="44" cy="62" r="3.5" fill="url(#scPan)" />
        <circle cx="156" cy="62" r="3.5" fill="url(#scPan)" />
      </g>
    </svg>
  );
}

export default function TeamLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errKey, setErrKey] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Demo-Modus: Cache reicht. Supabase-Modus: nur die echte Session zählt —
    // ein veralteter Cache würde sonst mit der Middleware in eine Redirect-Schleife laufen.
    if (!isSupabaseConfigured() && getCurrentUser()) {
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
        setErrKey((k) => k + 1);
        return;
      }
      router.push("/team/dashboard");
    } finally {
      setBusy(false);
    }
  }

  const supabaseMode = isSupabaseConfigured();
  // Demo-Hinweis nur im expliziten Demo-Modus (NEXT_PUBLIC_DEMO_MODE=1 + NEXT_PUBLIC_DEMO_PASSWORD).
  const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;
  const demo = isDemoMode() && demoPassword ? { email: TENANT.team[0]?.email ?? "", password: demoPassword } : null;

  return (
    <main id="main" className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr] bg-paper">
      {/* ---- Linke Seite: Markenwelt ---- */}
      <section className="relative isolate hidden overflow-hidden brand-bg text-white lg:flex flex-col justify-between p-12">
        <div className="stage-light absolute inset-0 -z-10" aria-hidden="true" />
        <div className="animate-fade-up">
          <div className="text-xl font-semibold tracking-tight">{TENANT.brand.kanzleiName}</div>
          <div className="mt-0.5 text-xs text-white/60">{TENANT.brand.tagline}</div>
        </div>

        <div className="flex flex-col items-start gap-8">
          <Scales />
          <div className="animate-fade-up delay-3 max-w-md">
            <h2 className="font-serif text-4xl font-semibold leading-[1.1] !text-white">
              Jede Anfrage verdient{" "}
              <span style={{ color: "var(--accent-on-brand)" }}>
                Ihre volle Aufmerksamkeit.
              </span>
            </h2>
            <p className="mt-4 text-white/70 leading-relaxed">
              Neue Anfragen, klare Prioritäten, strukturierte Zusammenfassungen — alles an einem Ort.
            </p>
          </div>
        </div>

        {/* Vorschau-Karte (rein dekorativ, fiktive Daten) */}
        <div className="animate-fade-up delay-4 relative max-w-sm" aria-hidden="true">
          <Mandarin className="pointer-events-none absolute -bottom-3 left-full z-10 -ml-10 h-32 w-28 xl:ml-0 xl:h-40 xl:w-36" />
          <div className="surface-raised max-w-sm rounded-2xl p-4 text-ink-dark">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>Neue Anfrage</span>
              <span className="rounded-full bg-[color:var(--brand-accent)] px-2 py-0.5 font-medium" style={{ color: "var(--on-accent)" }}>
                Hoch
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold">Beispiel · Arbeitsrecht</div>
            <div className="mt-1 text-xs text-muted">Kündigung erhalten · Rückmeldung innerhalb 24 Std.</div>
            <div className="mt-3 flex gap-2">
              {["Neu", "In Bearbeitung"].map((t, i) => (
                <span key={t} className={`rounded-full px-2.5 py-1 text-xs ${i === 0 ? "brand-bg text-white" : "border border-line bg-white"}`}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Rechte Seite: Login ---- */}
      <section className="relative flex flex-col justify-center px-6 py-12 sm:px-12">
        <Link href="/" className="touch-target absolute left-6 top-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink-dark sm:left-12">
          <span aria-hidden="true">←</span> Zur Website
        </Link>

        <div className="mx-auto w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <div className="text-lg font-semibold tracking-tight">{TENANT.brand.kanzleiName}</div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.07] px-3 py-1 text-xs font-medium text-ink-dark">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="9" width="12" height="8" rx="2" />
              <path d="M7 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            Geschützter Bereich
          </span>
          <h1 className="mt-4 text-4xl font-semibold">Willkommen zurück.</h1>
          <p className="mt-2 text-sm text-muted">
            Interner Zugang für das Team von {TENANT.brand.kanzleiName}.
          </p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="label">E-Mail</label>
              <input
                id="email"
                type="email"
                className="input !py-3.5 transition-shadow"
                placeholder="name@kanzlei.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                disabled={busy}
              />
            </div>
            <div>
              <label htmlFor="pw" className="label">Passwort</label>
              <div className="relative">
                <input
                  id="pw"
                  type={showPw ? "text" : "password"}
                  className="input !py-3.5 !pr-16 transition-shadow"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="touch-target absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-muted hover:text-ink-dark"
                  aria-label={showPw ? "Passwort verbergen" : "Passwort anzeigen"}
                  aria-pressed={showPw}
                >
                  {showPw ? "Verbergen" : "Zeigen"}
                </button>
              </div>
            </div>

            {error && (
              <p key={errKey} role="alert" className="animate-shake rounded-lg border border-danger/25 bg-danger/[0.06] px-3.5 py-2.5 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary group mt-1 !py-3.5 text-base"
            >
              {busy ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Anmelden…
                </>
              ) : (
                <>
                  Anmelden
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-line pt-5 text-xs leading-relaxed text-muted">
            {supabaseMode ? (
              <p>
                Verschlüsselte Anmeldung über Supabase Auth. Nur freigegebene E-Mail-Adressen
                erhalten Zugriff auf das Dashboard.
              </p>
            ) : demo ? (
              <>
                <p className="mb-1 font-semibold text-ink-dark">Demo-Zugang (Dev-Modus)</p>
                <p>
                  E-Mail: <code className="rounded bg-paper-dark px-1">{demo.email}</code>
                  <br />
                  Passwort: <code className="rounded bg-paper-dark px-1">{demo.password}</code>
                </p>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
