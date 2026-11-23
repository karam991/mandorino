"use client";

import { useEffect, useRef } from "react";

interface MandarinProps {
  className?: string;
  /** Neigt die Frucht leicht zum Mauszeiger (3D-Eindruck). Respektiert prefers-reduced-motion. */
  interactive?: boolean;
}

/**
 * Halb-realistische 3D-Mandarine als reines SVG (keine Abhängigkeit, ~3 KB).
 * Räumlichkeit entsteht durch Licht: Radialverläufe (Körper), feDiffuseLighting
 * auf feiner Turbulenz (Poren der Schale), Glanzlicht, Rand-Rückstrahlung und
 * einen weichen Bodenschatten. Dekorativ → aria-hidden.
 */
export function Mandarin({ className = "", interactive = true }: MandarinProps) {
  const tilt = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interactive) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = tilt.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        el.style.transform = `rotateY(${(dx * 26).toFixed(2)}deg) rotateX(${(-dy * 22).toFixed(2)}deg)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [interactive]);

  return (
    <div className={`mandarin-scene ${className}`} aria-hidden="true">
      <div ref={tilt} className="mandarin-tilt">
        <div className="mandarin-float">
          <svg viewBox="0 0 260 270" className="h-full w-full overflow-visible" role="presentation">
            <defs>
              {/* Körper: Licht von links oben */}
              <radialGradient id="mdBody" cx="36%" cy="30%" r="78%">
                <stop offset="0" stopColor="#FFD36B" />
                <stop offset="0.28" stopColor="#FFA21F" />
                <stop offset="0.68" stopColor="#F26A0F" />
                <stop offset="1" stopColor="#B5400A" />
              </radialGradient>
              {/* Rückstrahlung unten rechts (Umgebungslicht) */}
              <radialGradient id="mdBounce" cx="78%" cy="88%" r="42%">
                <stop offset="0" stopColor="#FFB347" stopOpacity="0.55" />
                <stop offset="1" stopColor="#FFB347" stopOpacity="0" />
              </radialGradient>
              {/* Vertiefung um den Stielansatz */}
              <radialGradient id="mdDimple" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#7A2A04" stopOpacity="0.85" />
                <stop offset="0.55" stopColor="#B5400A" stopOpacity="0.45" />
                <stop offset="1" stopColor="#B5400A" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="mdLeaf" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7DB94B" />
                <stop offset="0.6" stopColor="#3F8A2E" />
                <stop offset="1" stopColor="#245C1F" />
              </linearGradient>
              <linearGradient id="mdLeaf2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#6AA83D" />
                <stop offset="1" stopColor="#1F5320" />
              </linearGradient>
              <radialGradient id="mdShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#000" stopOpacity="0.45" />
                <stop offset="1" stopColor="#000" stopOpacity="0" />
              </radialGradient>
              <clipPath id="mdClip">
                <ellipse cx="130" cy="150" rx="98" ry="90" />
              </clipPath>
              {/* Schalenporen: Turbulenz → Höhenkarte → Licht */}
              <filter id="mdPeel" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
                <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.4 -0.2" result="h" />
                <feDiffuseLighting in="h" surfaceScale="2.2" diffuseConstant="1.05" lightingColor="#fff" result="l">
                  <feDistantLight azimuth="235" elevation="55" />
                </feDiffuseLighting>
                <feComposite in="l" in2="SourceGraphic" operator="in" />
              </filter>
              <filter id="mdBlur" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <filter id="mdBlurSm" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.2" />
              </filter>
            </defs>

            {/* Bodenschatten */}
            <ellipse className="mandarin-shadow" cx="130" cy="255" rx="78" ry="11" fill="url(#mdShadow)" />

            {/* Körper (leicht gedrückt wie eine echte Mandarine) */}
            <ellipse cx="130" cy="150" rx="98" ry="90" fill="url(#mdBody)" />
            {/* Poren-Struktur, multipliziert über den Körper */}
            <g clipPath="url(#mdClip)" style={{ mixBlendMode: "multiply" }} opacity="0.55">
              <ellipse cx="130" cy="150" rx="98" ry="90" fill="#fff" filter="url(#mdPeel)" />
            </g>
            <ellipse cx="130" cy="150" rx="98" ry="90" fill="url(#mdBounce)" />
            {/* Terminator: sanfte Abdunklung zur Schattenseite */}
            <ellipse cx="130" cy="150" rx="98" ry="90" fill="none" stroke="#8C2F05" strokeOpacity="0.35" strokeWidth="6" filter="url(#mdBlurSm)" clipPath="url(#mdClip)" />

            {/* Stielgrube */}
            <ellipse cx="128" cy="66" rx="30" ry="12" fill="url(#mdDimple)" />

            {/* Blätter */}
            <path d="M128 64 C 146 24, 196 14, 214 30 C 200 62, 160 74, 128 64 Z" fill="url(#mdLeaf)" />
            <path d="M128 64 C 158 50, 186 40, 206 32" fill="none" stroke="#B6E08A" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M126 66 C 104 38, 66 34, 50 48 C 62 74, 98 82, 126 66 Z" fill="url(#mdLeaf2)" />
            <path d="M126 66 C 100 56, 76 50, 58 48" fill="none" stroke="#A5D274" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
            {/* Kelchblätter */}
            <path d="M128 66 l-16 6 l9 -10 z M128 66 l16 6 l-9 -10 z M128 66 l-4 12 l8 -2 z" fill="#4F9A35" />
            {/* Stiel */}
            <path d="M128 68 C 128 54, 131 42, 137 32" fill="none" stroke="#5B3A1A" strokeWidth="6" strokeLinecap="round" />
            <path d="M128 68 C 128 54, 131 42, 137 32" fill="none" stroke="#9A6B38" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />

            {/* Glanzlicht: weich + scharfer Glint */}
            <ellipse cx="88" cy="110" rx="34" ry="22" fill="#fff" opacity="0.55" filter="url(#mdBlur)" transform="rotate(-32 88 110)" />
            <ellipse cx="80" cy="104" rx="9" ry="5" fill="#fff" opacity="0.9" transform="rotate(-32 80 104)" />
            {/* feines Gegenlicht am Rand unten rechts */}
            <path d="M196 188 C 186 214, 160 232, 130 236" fill="none" stroke="#FFD08A" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" filter="url(#mdBlurSm)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
