import { TENANT } from "@/lib/tenant.config";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white mt-16">
      <div className="mx-auto max-w-page px-4 sm:px-6 py-8 text-sm text-muted flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          © {new Date().getFullYear()} {TENANT.brand.kanzleiName}
        </div>
        <div className="flex items-center gap-4">
          <a href={TENANT.legal.impressumUrl} className="hover:text-ink-dark">
            Impressum
          </a>
          <span className="hidden sm:inline">·</span>
          <a href={TENANT.legal.datenschutzUrl} className="hover:text-ink-dark">
            Datenschutz
          </a>
          <span className="hidden sm:inline">·</span>
          <span className="text-xs">
            Vorab-Erfassung mit{" "}
            <span className="font-medium">Mandorino</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
