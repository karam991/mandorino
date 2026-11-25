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

function toHex(rgb: number[]): string {
  return "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

function blend(hex: string, target: 0 | 255, amount: number): string {
  return toHex(channels(hex).map((c) => c + (target - c) * amount));
}

/** Kontrastverhältnis nach WCAG 2.x (1 bis 21). */
export function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = channels(hex).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;

/**
 * Lesbare Schrift auf einer Akzentfläche: zuerst die Primärfarbe selbst,
 * sonst eine abgedunkelte Variante, sonst Weiß bzw. Schwarz.
 */
function textOnAccent(primary: string, accent: string): string {
  const candidates = [primary, blend(primary, 0, 0.5), blend(primary, 0, 0.75), "#ffffff"];
  return candidates.find((c) => contrast(c, accent) >= AA) ?? "#000000";
}

/**
 * Akzentfarbe als Schrift auf der Markenfläche: unverändert, wenn lesbar,
 * sonst schrittweise aufgehellt. Gemessen gegen die um 8 % aufgehellte
 * Primärfarbe, weil das Lichtverlauf-Overlay (`stage-light`) sie heller macht.
 */
function accentOnBrand(primary: string, accent: string): string {
  const surface = blend(primary, 255, 0.08);
  for (let step = 0; step <= 20; step++) {
    const candidate = step === 0 ? accent : blend(accent, 255, step / 20);
    if (contrast(candidate, surface) >= AA) return candidate;
  }
  return "#ffffff";
}

export function brandTokens(primary: string, accent: string): Record<string, string> {
  return {
    "--brand-primary": primary,
    "--brand-accent": accent,
    "--on-accent": textOnAccent(primary, accent),
    "--accent-on-brand": accentOnBrand(primary, accent),
    "--ink": mix(primary, 0, 0),
    "--ink-dark": mix(primary, 0, 0.38),
    "--ink-light": mix(primary, 255, 0.06),
    "--gold": mix(accent, 0, 0),
    "--gold-dark": mix(accent, 0, 0.18),
  };
}
