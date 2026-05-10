import Link from "next/link";

import { Logo } from "./Logo";

interface HeaderProps {
  /** "client" = öffentliche Mandanten-Seite. "team" = internes Anwalts-Dashboard. */
  variant?: "client" | "team";
}

/**
 * Header — Brandfarbe kommt aus CSS-Variable --brand-primary (siehe layout.tsx).
 */
export function Header({ variant = "client" }: HeaderProps) {
  return (
    <header className="brand-bg text-white">
      <div className="mx-auto max-w-page px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo variant="white" />
          {variant === "team" && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider bg-white/15 text-white/90 border border-white/20">
              Mandorino · Team
            </span>
          )}
        </div>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          {variant === "client" ? (
            <>
              <Link href="/" className="px-3 py-2 rounded-md hover:bg-white/10">
                Start
              </Link>
              <Link href="/chat" className="px-3 py-2 rounded-md hover:bg-white/10">
                Anliegen schildern
              </Link>
              <Link
                href="/team/login"
                className="ml-1 px-3 py-2 rounded-md border border-white/30 hover:bg-white/10"
              >
                Team-Login
              </Link>
            </>
          ) : (
            <>
              <Link href="/team/dashboard" className="px-3 py-2 rounded-md hover:bg-white/10">
                Leads
              </Link>
              <Link href="/team/analytics" className="px-3 py-2 rounded-md hover:bg-white/10">
                Auswertung
              </Link>
              <Link href="/team/embed" className="px-3 py-2 rounded-md hover:bg-white/10">
                Einbettung
              </Link>
              <Link href="/team/settings" className="px-3 py-2 rounded-md hover:bg-white/10">
                Einstellungen
              </Link>
              <Link
                href="/"
                className="ml-1 px-3 py-2 rounded-md border border-white/30 hover:bg-white/10"
              >
                Mandanten-Ansicht
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
