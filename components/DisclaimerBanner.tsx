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
      <div className="mx-auto max-w-page px-4 sm:px-6 py-2.5 text-xs sm:text-sm text-muted text-center">
        {DISCLAIMER.shortBanner}
      </div>
    </div>
  );
}
