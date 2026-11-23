import { NextRequest, NextResponse } from "next/server";

import { dispatchLead } from "@/lib/notifications/dispatch";
import { PayloadTooLargeError, rateLimit, readJsonLimited } from "@/lib/server/guard";
import { parseLeadInput } from "@/lib/server/leadInput";
import { getServerLeadRepo } from "@/lib/repos/supabaseLeadRepo";
import { TENANT } from "@/lib/tenant.config";

export const runtime = "nodejs"; // SMTP & längere Webhooks → kein Edge

/**
 * POST /api/leads
 * Body: { lead: <Mandantenangaben>, consentGiven: true }
 *
 * Der Client liefert nur Mandantenangaben. id, Zeitstempel, Status, Historie
 * und Priorität erzeugt der Server (`parseLeadInput`) — Client-Werte dafür
 * werden ignoriert. Danach: Persistenz (Supabase, falls konfiguriert) und
 * Benachrichtigung über alle Channels aus `tenant.config.notifications`.
 *
 * Antwort: { ok: true, id } oder { ok: false, error }. Wurde der Lead weder
 * gespeichert noch an einen Channel zugestellt, antwortet die Route mit 500,
 * damit der Mandant NICHT fälschlich „Erfolg" sieht.
 */
const MAX_BODY_BYTES = 64 * 1024; // ein Lead ist wenige KB — alles darüber ist Missbrauch

export async function POST(req: NextRequest) {
  try {
    // Schutz vor Spam/Missbrauch: ein echter Mandant sendet genau einen Lead.
    if (!rateLimit(req, "leads", 8, 10 * 60 * 1000)) {
      return NextResponse.json(
        { ok: false, error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }

    let body: unknown;
    try {
      body = await readJsonLimited<unknown>(req, MAX_BODY_BYTES);
    } catch (e) {
      const tooLarge = e instanceof PayloadTooLargeError;
      return NextResponse.json(
        { ok: false, error: tooLarge ? "Anfrage zu groß." : "Ungültiger Request." },
        { status: tooLarge ? 413 : 400 },
      );
    }

    const parsed = parseLeadInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }
    const lead = parsed.lead;

    // Zweites, engeres Limit pro Mandanten-E-Mail (gegen Flooding fremder Postfächer).
    if (!rateLimit(req, `leads:${lead.contact.email.toLowerCase()}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json(
        { ok: false, error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }

    // Dashboard-Deeplinks brauchen die öffentliche Origin
    const dashboardUrl =
      process.env.MANDORINO_PUBLIC_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Persistenz, falls Supabase konfiguriert ist.
    let persistenceConfigured = false;
    let persisted = false;
    try {
      const repo = await getServerLeadRepo();
      if (repo) {
        persistenceConfigured = true;
        await repo.save(lead);
        persisted = true;
      }
    } catch (e) {
      console.error("[supabase] save fehlgeschlagen:", e);
    }

    const results = await dispatchLead(lead, {
      channels: TENANT.notifications,
      kanzleiName: TENANT.brand.kanzleiName,
      dashboardUrl,
    });

    // Server-Logging für Monitoring (Vercel/CloudWatch greift das ab)
    for (const r of results) {
      if (!r.ok) {
        console.warn("[notifications] channel failed", r);
      }
    }

    // Verloren = Persistenz wird erwartet (Supabase irgendwo konfiguriert), wurde aber nicht
    // geschrieben UND kein Channel hat zugestellt. Deckt auch Fehlkonfiguration ab
    // (z. B. nur NEXT_PUBLIC_-Variablen gesetzt, Service-Role-Key fehlt).
    const delivered = results.some((r) => r.ok);
    const persistenceExpected =
      persistenceConfigured ||
      Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    if (persistenceExpected && !persisted && !delivered) {
      if (!persistenceConfigured) {
        console.error("[supabase] Persistenz erwartet, aber SUPABASE_SERVICE_ROLE_KEY fehlt.");
      }
      return NextResponse.json(
        { ok: false, error: "Ihre Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (e) {
    console.error("[/api/leads] unhandled", e);
    // Keine internen Fehlermeldungen an den Client — Details stehen im Server-Log.
    return NextResponse.json(
      { ok: false, error: "Interner Fehler. Bitte versuchen Sie es später erneut." },
      { status: 500 },
    );
  }
}
