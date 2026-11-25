/**
 * Leitet die Farb-Tokens (`ink`, `gold` in Tailwind) aus den Tenant-Farben ab,
 * damit eine Kanzlei mit anderen Farben überall dieselbe Marke sieht.
 * Format "R G B", damit Tailwind-Deckkraft (`bg-ink/10`) funktioniert.
 *
 * Annahme: Die Primärfarbe ist dunkel (weiße Schrift darauf bleibt lesbar).
 */
function channels(hex: string): number[] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

/** Mischt `hex` anteilig mit Schwarz (target 0) oder Weiß (target 255). */
function mix(hex: string, target: 0 | 255, amount: number): string {
  return channels(hex)
    .map((c) => Math.round(c + (target - c) * amount))
    .join(" ");
}

export function brandTokens(primary: string, accent: string): Record<string, string> {
  return {
    "--brand-primary": primary,
    "--brand-accent": accent,
    "--ink": mix(primary, 0, 0),
    "--ink-dark": mix(primary, 0, 0.38),
    "--ink-light": mix(primary, 255, 0.06),
    "--gold": mix(accent, 0, 0),
    "--gold-dark": mix(accent, 0, 0.18),
  };
}
