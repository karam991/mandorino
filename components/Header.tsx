import Link from "next/link";

import { Logo } from "./Logo";
import { TeamNav } from "./TeamNav";

interface HeaderProps {
  /** "client" = öffentliche Mandanten-Seite. "team" = internes Anwalts-Dashboard. */
  variant?: "client" | "team";
}

/**
 * Header — Brandfarbe kommt aus CSS-Variable --brand-primary (siehe layout.tsx).
 */
export function Header({ variant = "client" }: HeaderProps) {
  return (
    <header className="brand-bg text-white sticky top-0 z-40 border-b border-white/10">
      <div className="mx-auto max-w-page px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Logo variant="white" hideTagline={variant === "team"} />
          {variant === "team" && (
            <span className="hidden lg:inline-flex whitespace-nowrap items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/15 text-white/90 border border-white/20">
              Mandorino · Team
            </span>
          )}
        </div>
        <nav className="flex shrink-0 items-center gap-1 sm:gap-2 text-sm">
          {variant === "client" ? (
            <>
              <Link href="/" className="hidden sm:inline-block px-3 py-2 rounded-md hover:bg-white/10">
                Start
              </Link>
              <Link href="/chat" className="hidden sm:inline-block px-3 py-2 rounded-md hover:bg-white/10">
                Anliegen schildern
              </Link>
              <Link
                href="/team/login"
                className="touch-target ml-1 inline-flex items-center px-3 py-2 rounded-md border border-white/30 hover:bg-white/10 whitespace-nowrap"
              >
                Team-Login
              </Link>
            </>
          ) : (
            <TeamNav />
          )}
        </nav>
      </div>
    </header>
  );
}
