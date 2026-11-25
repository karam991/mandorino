import { TENANT } from "@/lib/tenant.config";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
};

/** Absender-Zeichen der Kanzlei im Chat (Initiale in Markenfarbe) — dekorativ. */
export function FirmAvatar({ size = "md", className = "" }: { size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full brand-bg font-semibold text-white ring-2 ring-gold/60 ${SIZES[size]} ${className}`}
      aria-hidden="true"
    >
      {TENANT.brand.kanzleiName.charAt(0)}
    </span>
  );
}
