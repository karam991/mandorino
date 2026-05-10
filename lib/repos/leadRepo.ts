import type { Lead, LeadStatus } from "@/lib/types";

/**
 * Repository-Interface für Leads.
 *
 * Ziel: dieselbe API für localStorage (MVP) und Supabase/Postgres (Produktiv).
 * Die UI ruft niemals direkt eine Implementierung auf — sie geht über
 * `lib/leadStore.ts` (Client) bzw. `getServerLeadRepo()` (Server).
 *
 * Die Schnittstelle ist absichtlich klein. Filter/Sortierung passieren
 * weiterhin in der UI, weil das MVP nur ein paar Hundert Leads pro
 * Kanzlei erwartet.
 */
export interface LeadRepo {
  list(): Promise<Lead[]>;
  get(id: string): Promise<Lead | null>;
  save(lead: Lead): Promise<void>;
  updateStatus(id: string, status: LeadStatus): Promise<Lead | null>;
  updateAssignee(id: string, assigneeId: string | null): Promise<Lead | null>;
  appendHistory(id: string, entry: Lead["history"][number]): Promise<Lead | null>;
}
