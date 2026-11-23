"use client";

import { buildSupabaseLeadRepo } from "./repos/supabaseLeadRepo";
import * as local from "./leadStore";
import { getBrowserSupabase, isSupabaseConfigured } from "./supabaseClient";
import type { Lead, LeadHistoryEntry, LeadStatus } from "./types";
import type { LeadRepo } from "./repos/leadRepo";

/**
 * Async Lead-Zugriff für das Team-Dashboard.
 *
 * - Supabase konfiguriert → Reads/Writes laufen mit dem JWT des eingeloggten
 *   Team-Mitglieds gegen die Datenbank; RLS (`is_team_member()`) entscheidet.
 * - Sonst (Demo-Modus) → localStorage über `leadStore`.
 *
 * Die UI ruft nur noch diese Funktionen auf, nie `leadStore` direkt.
 */

interface Actor {
  userId: string;
  userName: string;
}

async function remoteRepo(): Promise<LeadRepo | null> {
  if (!isSupabaseConfigured()) return null;
  const sb = await getBrowserSupabase();
  return sb ? buildSupabaseLeadRepo(sb) : null;
}

function entry(actor: Actor, type: LeadHistoryEntry["type"], message: string): LeadHistoryEntry {
  return {
    at: new Date().toISOString(),
    byUserId: actor.userId,
    byUserName: actor.userName,
    type,
    message,
  };
}

export async function listLeads(): Promise<Lead[]> {
  const repo = await remoteRepo();
  if (!repo) {
    local.seedDemoLeadsIfEmpty();
    return local.getAllLeads();
  }
  return repo.list();
}

export async function getLead(id: string): Promise<Lead | null> {
  const repo = await remoteRepo();
  return repo ? repo.get(id) : local.getLeadById(id);
}

export async function changeStatus(
  id: string,
  status: LeadStatus,
  actor: Actor,
): Promise<Lead | null> {
  const repo = await remoteRepo();
  if (!repo) return local.changeStatus(id, status, actor);
  const current = await repo.get(id);
  if (!current || current.status === status) return current;
  await repo.updateStatus(id, status);
  return repo.appendHistory(
    id,
    entry(actor, "status", `Status geändert: ${current.status} → ${status}`),
  );
}

export async function assignLead(
  id: string,
  assigneeId: string | null,
  assigneeName: string | null,
  actor: Actor,
): Promise<Lead | null> {
  const repo = await remoteRepo();
  if (!repo) return local.assignLead(id, assigneeId, assigneeName, actor);
  await repo.updateAssignee(id, assigneeId);
  return repo.appendHistory(
    id,
    entry(
      actor,
      "assign",
      assigneeId ? `Zugewiesen an ${assigneeName ?? assigneeId}` : "Zuweisung entfernt",
    ),
  );
}

export async function addNote(id: string, text: string, actor: Actor): Promise<Lead | null> {
  const trimmed = text.trim();
  const repo = await remoteRepo();
  if (!repo) return local.addNote(id, trimmed, actor);
  if (!trimmed) return repo.get(id);
  return repo.appendHistory(id, entry(actor, "note", trimmed));
}
