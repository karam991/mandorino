import { TENANT } from "@/lib/tenant.config";

export function Footer() {
  return (
    <footer className="mt-16 brand-bg text-white/75">
      <div className="mx-auto flex max-w-page flex-col items-center justify-between gap-4 px-4 py-10 text-sm sm:flex-row sm:px-6">
        <div>
          <div className="font-semibold tracking-tight text-white">{TENANT.brand.kanzleiName}</div>
          <div className="mt-0.5 text-xs text-white/55">
            © {new Date().getFullYear()} · {TENANT.brand.tagline}
          </div>
        </div>
        <div className="flex items-center gap-5">
          <a href={TENANT.legal.impressumUrl} className="transition-colors hover:text-white">
            Impressum
          </a>
          <a href={TENANT.legal.datenschutzUrl} className="transition-colors hover:text-white">
            Datenschutz
          </a>
          <span className="hidden text-xs text-white/50 sm:inline">
            Vorab-Erfassung mit <span className="font-medium text-white/80">Mandorino</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
