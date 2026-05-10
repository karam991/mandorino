import { NextRequest, NextResponse } from "next/server";

import { dispatchLead } from "@/lib/notifications/dispatch";
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
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { lead?: Lead };
    const lead = body?.lead;
    if (!lead || typeof lead.id !== "string" || !lead.contact?.email) {
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
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" },
      { status: 500 },
    );
  }
}
