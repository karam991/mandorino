import { DISCLAIMER } from "@/lib/disclaimer";

interface DisclaimerBannerProps {
  variant?: "subtle" | "prominent";
}

export function DisclaimerBanner({ variant = "subtle" }: DisclaimerBannerProps) {
  if (variant === "prominent") {
    return (
      <div className="card bg-paper-dark border-line p-4 flex gap-3 items-start">
        <span className="pill bg-ink/10 text-ink-dark mt-0.5">Hinweis</span>
        <p className="text-sm text-ink-dark/90 leading-relaxed">
          {DISCLAIMER.fullText}
        </p>
      </div>
    );
  }
  return (
    <div className="bg-paper-dark border-b border-line">
      <div className="mx-auto flex max-w-page items-center justify-center gap-2 px-4 py-2.5 text-xs text-muted sm:px-6 sm:text-sm">
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-gold-dark" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 2.5 4 5v4.5c0 3.6 2.5 6.3 6 8 3.5-1.7 6-4.4 6-8V5l-6-2.5Z" />
          <path d="m7.5 10 2 2 3.5-4" />
        </svg>
        <span className="text-center">{DISCLAIMER.shortBanner}</span>
      </div>
    </div>
  );
}
