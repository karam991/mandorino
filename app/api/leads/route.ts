import { NextRequest, NextResponse } from "next/server";

import { dispatchLead } from "@/lib/notifications/dispatch";
import { PayloadTooLargeError, rateLimit, readJsonLimited } from "@/lib/server/guard";
import { getServerLeadRepo } from "@/lib/repos/supabaseLeadRepo";
import { TENANT } from "@/lib/tenant.config";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs"; // SMTP & längere Webhooks → kein Edge

/**
 * POST /api/leads
 * Body: { lead: Lead }
 *
 * Verteilt einen frisch erstellten Lead an alle in `tenant.config.notifications`
 * konfigurierten Channels (Email/Slack/Teams/Webhook). Die eigentliche
 * Persistenz übernimmt — solange wir noch im localStorage-MVP sind — der
 * Client. Sobald die Supabase-Phase live ist, schreibt diese Route den Lead
 * zusätzlich in die Datenbank.
 */
const MAX_BODY_BYTES = 64 * 1024; // ein Lead ist wenige KB — alles darüber ist Missbrauch
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    // Schutz vor Spam/Missbrauch: ein echter Mandant sendet genau einen Lead.
    if (!rateLimit(req, "leads", 8, 10 * 60 * 1000)) {
      return NextResponse.json(
        { ok: false, error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }

    let body: { lead?: Lead };
    try {
      body = await readJsonLimited<{ lead?: Lead }>(req, MAX_BODY_BYTES);
    } catch (e) {
      const tooLarge = e instanceof PayloadTooLargeError;
      return NextResponse.json(
        { ok: false, error: tooLarge ? "Anfrage zu groß." : "Ungültiger Request." },
        { status: tooLarge ? 413 : 400 },
      );
    }
    const lead = body?.lead;
    if (
      !lead ||
      typeof lead.id !== "string" ||
      lead.id.length === 0 ||
      lead.id.length > 100 ||
      typeof lead.contact?.email !== "string" ||
      lead.contact.email.length > 254 ||
      !EMAIL_RE.test(lead.contact.email)
    ) {
      return NextResponse.json(
        { ok: false, error: "Ungültiger Lead." },
        { status: 400 },
      );
    }

    // Dashboard-Deeplinks brauchen die öffentliche Origin
    const dashboardUrl =
      process.env.MANDORINO_PUBLIC_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Optional: Supabase-Persistenz, falls konfiguriert.
    // Solange keine SUPABASE-Env-Vars gesetzt sind, übernimmt der Client
    // weiterhin localStorage — Lead-Verlust ist trotzdem ausgeschlossen,
    // weil die Notifications den Inhalt an die Kanzlei pushen.
    try {
      const repo = await getServerLeadRepo();
      if (repo) await repo.save(lead);
    } catch (e) {
      console.warn("[supabase] save fehlgeschlagen — Lead nur via Notifications zugestellt:", e);
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

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    console.error("[/api/leads] unhandled", e);
    // Keine internen Fehlermeldungen an den Client — Details stehen im Server-Log.
    return NextResponse.json(
      { ok: false, error: "Interner Fehler. Bitte versuchen Sie es später erneut." },
      { status: 500 },
    );
  }
}
