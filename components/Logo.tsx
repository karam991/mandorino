import Link from "next/link";

import { TENANT } from "@/lib/tenant.config";

interface LogoProps {
  variant?: "default" | "white";
  size?: "sm" | "md";
}

/**
 * Tenant-Logo. Wenn `tenant.brand.logoUrl` gesetzt ist, zeigen wir das Bild;
 * sonst Text-Fallback mit Kanzleiname + Tagline.
 */
export function Logo({ variant = "default", size = "md" }: LogoProps) {
  const big = size === "md";
  const textColor = variant === "white" ? "text-white" : "text-ink-dark";
  const subColor = variant === "white" ? "text-white/70" : "text-muted";

  if (TENANT.brand.logoUrl) {
    return (
      <Link href="/" className="inline-flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TENANT.brand.logoUrl}
          alt={TENANT.brand.kanzleiName}
          className={big ? "h-10 w-auto" : "h-7 w-auto"}
        />
      </Link>
    );
  }

  return (
    <Link href="/" className="inline-flex flex-col gap-0.5">
      <span
        className={`font-semibold tracking-tight ${textColor} ${big ? "text-xl" : "text-base"}`}
      >
        {TENANT.brand.kanzleiName}
      </span>
      <span
        className={`uppercase tracking-widest ${subColor} ${big ? "text-[10px]" : "text-[9px]"}`}
      >
        {TENANT.brand.tagline}
      </span>
    </Link>
  );
}
