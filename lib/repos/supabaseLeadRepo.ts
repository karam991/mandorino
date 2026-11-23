import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ClaimValueBucket,
  ClientType,
  InsuranceInfo,
  Lead,
  LeadHistoryEntry,
  LeadStatus,
} from "@/lib/types";

import type { LeadRepo } from "./leadRepo";

/**
 * Supabase-Implementierung des Lead-Repositorys.
 *
 * Lazy import von `@supabase/supabase-js`, damit das Paket optional bleibt:
 * Solange keine SUPABASE-Env-Vars gesetzt sind, wird der Server-Fallback
 * (`noopLeadRepo`) genutzt und das Paket nie geladen.
 *
 * Schema siehe `supabase/schema.sql`. Eine Tabelle `leads` mit JSONB-Spalten
 * für `area_data`, `priority`, `history` — pragmatisch und schemafrei genug,
 * um neue Practice-Areas ohne Migrations einzubauen.
 */

interface SupabaseLeadRow {
  id: string;
  created_at: string;
  area_id: string;
  area_label: string;
  client_type: ClientType;
  area_data: Record<string, unknown>;
  urgency: string;
  user_notes: string | null;
  insurance: InsuranceInfo | null;
  claim_value: ClaimValueBucket | null;
  ai_summary: string | null;
  ai_summary_source: "claude" | "template" | null;
  contact: Lead["contact"];
  status: LeadStatus;
  assigned_to_user_id: string | null;
  history: LeadHistoryEntry[];
  priority: Lead["priority"];
}

function rowToLead(r: SupabaseLeadRow): Lead {
  return {
    id: r.id,
    createdAt: r.created_at,
    areaId: r.area_id,
    areaLabel: r.area_label,
    clientType: r.client_type ?? "private",
    areaData: r.area_data,
    urgency: r.urgency as Lead["urgency"],
    userNotes: r.user_notes ?? undefined,
    insurance: r.insurance ?? undefined,
    claimValue: r.claim_value ?? undefined,
    aiSummary: r.ai_summary ?? undefined,
    aiSummarySource: r.ai_summary_source ?? undefined,
    contact: r.contact,
    status: r.status,
    assignedToUserId: r.assigned_to_user_id ?? undefined,
    history: r.history,
    priority: r.priority,
  };
}

function leadToRow(lead: Lead): SupabaseLeadRow {
  return {
    id: lead.id,
    created_at: lead.createdAt,
    area_id: lead.areaId,
    area_label: lead.areaLabel,
    client_type: lead.clientType,
    area_data: lead.areaData,
    urgency: lead.urgency,
    user_notes: lead.userNotes ?? null,
    insurance: lead.insurance ?? null,
    claim_value: lead.claimValue ?? null,
    ai_summary: lead.aiSummary ?? null,
    ai_summary_source: lead.aiSummarySource ?? null,
    contact: lead.contact,
    status: lead.status,
    assigned_to_user_id: lead.assignedToUserId ?? null,
    history: lead.history,
    priority: lead.priority,
  };
}

export function serverSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || undefined;
}

export async function createSupabaseLeadRepo(): Promise<LeadRepo> {
  // Die Projekt-URL ist öffentlich und identisch — Fallback auf die NEXT_PUBLIC-Variante,
  // damit nicht „Browser konfiguriert, Server stumm" entsteht.
  const url = serverSupabaseUrl();
  // Service-Role-Key — nur server-seitig; mit aktiviertem RLS in Produktion
  // sollte der Server diesen Key benutzen, der Client niemals.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase nicht konfiguriert (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }

  const { createClient } = await import("@supabase/supabase-js");
  return buildSupabaseLeadRepo(createClient(url, key, { auth: { persistSession: false } }));
}

/**
 * Baut das Repo auf einem beliebigen Supabase-Client auf.
 * - Server: Service-Role-Client (umgeht RLS) → siehe `createSupabaseLeadRepo`.
 * - Browser: Anon-Key + JWT des eingeloggten Team-Mitglieds → RLS entscheidet,
 *   wer Leads sehen/ändern darf (siehe `lib/clientLeads.ts`).
 */
export function buildSupabaseLeadRepo(sb: SupabaseClient): LeadRepo {
  return {
    async list() {
      const { data, error } = await sb
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => rowToLead(r as SupabaseLeadRow));
    },

    async get(id) {
      const { data, error } = await sb.from("leads").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? rowToLead(data as SupabaseLeadRow) : null;
    },

    async save(lead) {
      // Bewusst insert statt upsert: eine bekannte ID darf einen bestehenden Lead
      // nicht überschreiben (der Server nutzt die Service-Role, RLS greift dort nicht).
      const { error } = await sb.from("leads").insert(leadToRow(lead));
      if (error) throw error;
    },

    async updateStatus(id, status) {
      const { data, error } = await sb
        .from("leads")
        .update({ status })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data ? rowToLead(data as SupabaseLeadRow) : null;
    },

    async updateAssignee(id, assigneeId) {
      const { data, error } = await sb
        .from("leads")
        .update({ assigned_to_user_id: assigneeId })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data ? rowToLead(data as SupabaseLeadRow) : null;
    },

    async appendHistory(id, entry) {
      // Atomar per SQL-Funktion (siehe supabase/schema.sql) — kein Read-Modify-Write.
      const { data, error } = await sb.rpc("append_lead_history", { p_id: id, p_entry: entry });
      if (error) throw error;
      const row = data as SupabaseLeadRow | null;
      return row && row.id ? rowToLead(row) : null;
    },
  };
}

/**
 * Server-seitige Helfer-Funktion: gibt den konfigurierten Repo zurück oder
 * `null`, wenn Supabase nicht konfiguriert ist (dann läuft alles weiter im
 * localStorage-MVP).
 */
let cached: LeadRepo | null | undefined;
export async function getServerLeadRepo(): Promise<LeadRepo | null> {
  if (cached !== undefined) return cached;
  if (!serverSupabaseUrl() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    cached = null;
    return null;
  }
  try {
    cached = await createSupabaseLeadRepo();
    return cached;
  } catch (e) {
    console.warn("[supabase] Repo-Init fehlgeschlagen — fallback auf localStorage-MVP:", e);
    cached = null;
    return null;
  }
}
