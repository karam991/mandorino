"use client";

import { BarChart3, Code2, Inbox, Menu, Settings, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TEAM_LINKS = [
  { href: "/team/dashboard", label: "Leads", Icon: Inbox },
  { href: "/team/analytics", label: "Auswertung", Icon: BarChart3 },
  { href: "/team/embed", label: "Einbettung", Icon: Code2 },
  { href: "/team/settings", label: "Einstellungen", Icon: Settings },
];

/** Navigation des Team-Bereichs: Icons + aktive Seite (aria-current). */
export function TeamNav() {
  const pathname = usePathname() ?? "";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`) ||
    (href === "/team/dashboard" && pathname.startsWith("/team/lead"));

  return (
    <>
      {/* Desktop */}
      <div className="hidden items-center gap-1 md:flex">
        {TEAM_LINKS.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 transition-colors hover:bg-white/10 ${
              isActive(href) ? "bg-white/15 font-medium" : "text-white/85"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        ))}
        <Link
          href="/"
          className="ml-1 inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-white/30 px-3 py-2 transition-colors hover:bg-white/10"
        >
          <Store className="h-4 w-4" aria-hidden />
          Mandanten-Ansicht
        </Link>
      </div>

      {/* Mobil: natives <details>, kein JS nötig */}
      <details className="relative md:hidden">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border border-white/30 px-3 py-2 hover:bg-white/10 [&::-webkit-details-marker]:hidden">
          <Menu className="h-4 w-4" aria-hidden />
          Menü
        </summary>
        <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-line bg-white p-1.5 text-ink-dark shadow-soft">
          {TEAM_LINKS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-paper ${
                isActive(href) ? "bg-paper font-medium" : ""
              }`}
            >
              <Icon className="h-4 w-4 text-muted" aria-hidden />
              {label}
            </Link>
          ))}
          <Link
            href="/"
            className="mt-1 flex items-center gap-3 rounded-lg border-t border-line px-3 py-2.5 text-sm text-muted hover:bg-paper"
          >
            <Store className="h-4 w-4" aria-hidden />
            Mandanten-Ansicht
          </Link>
        </div>
      </details>
    </>
  );
}
