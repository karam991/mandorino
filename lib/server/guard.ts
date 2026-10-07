/**
 * Leichtgewichtiger API-Schutz: Rate-Limit pro IP + Body-Größenlimit.
 *
 * Hinweis (ehrlich): Das Rate-Limit liegt im Speicher der jeweiligen Serverless-
 * Instanz. Auf Vercel ist es damit "best effort" — es bremst Skripte und
 * versehentliche Schleifen, ersetzt aber keinen verteilten Limiter (z. B. Upstash
 * Redis) oder eine WAF. Für echte Last: dort austauschen, Schnittstelle bleibt gleich.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 5000;

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** true = Anfrage erlaubt, false = Limit überschritten. */
export function rateLimit(req: Request, scope: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    if (buckets.size > MAX_BUCKETS) buckets.clear();
  }
  const key = `${scope}:${clientIp(req)}`;
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

/** Liest JSON mit hartem Größenlimit. Wirft bei Überschreitung oder ungültigem JSON. */
export async function readJsonLimited<T>(req: Request, maxBytes: number): Promise<T> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new PayloadTooLargeError();
  const text = await req.text();
  if (text.length > maxBytes) throw new PayloadTooLargeError();
  return JSON.parse(text) as T;
}

export class PayloadTooLargeError extends Error {
  constructor() {
    super("payload too large");
  }
}
