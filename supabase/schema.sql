-- Mandorino — Supabase Schema (Phase „Production-Readiness")
--
-- In der Supabase-Konsole im SQL-Editor ausführen.
-- Ein Mandorino-Deployment = eine Kanzlei = eine Supabase-Instanz.
-- Multi-Tenant (mehrere Kanzleien in einer DB) ist explizit nicht das Modell:
-- Daten-Isolation ist der wichtigste Verkaufspunkt gegenüber Anwälten.

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. tenant_team — Whitelist der berechtigten Team-Mitglieder
-- ============================================================================
-- Spiegel der TENANT.team-Liste in `tenant.config.ts`. Die Doppel-Pflege ist
-- bewusst: Tenant-Config bleibt die UI-/Anzeige-Quelle, diese Tabelle ist die
-- DB-Quelle für RLS-Policies. Beim Onboarding einmal beide befüllen.

create table if not exists public.tenant_team (
  email text primary key,
  name text not null,
  role text not null check (role in ('admin', 'bearbeiter')),
  created_at timestamptz not null default now()
);

-- Beispiel-Seed (anpassen oder im Onboarding-Skript ersetzen):
-- insert into public.tenant_team (email, name, role) values
--   ('anwalt@example.de',       'RA Demo',          'admin'),
--   ('sekretariat@example.de',  'Sekretariat Demo', 'bearbeiter')
-- on conflict (email) do nothing;

-- Helper: ist der eingeloggte JWT-User auf der Team-Whitelist?
create or replace function public.is_team_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_team
    where email = (auth.jwt() ->> 'email')
  );
$$;

-- Helper: ist der eingeloggte JWT-User Admin auf der Team-Whitelist?
create or replace function public.is_team_member_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_team
    where email = (auth.jwt() ->> 'email')
      and role = 'admin'
  );
$$;

-- ============================================================================
-- 2. leads — eingehende Mandanten-Anfragen
-- ============================================================================

create table if not exists public.leads (
  id text primary key,
  created_at timestamptz not null default now(),

  -- Practice-Area (z.B. "arbeitsrecht")
  area_id text not null,
  area_label text not null,

  -- Generische Mandantenangaben — Schema-frei, jedes Area-Modul kennt seine Keys
  area_data jsonb not null default '{}'::jsonb,

  urgency text not null,
  user_notes text,

  -- Rechtsschutz-Versicherung (Selbstauskunft des Mandanten):
  --   { "status": "Ja"|"Nein"|"Weiß ich nicht", "provider"?: string }
  insurance jsonb,

  -- Streitwert-Bucket (grobe Spanne, kein Freitext):
  --   z.B. "10.000 € – 50.000 €" oder "Weiß ich nicht"
  claim_value text,

  -- KI-/Template-Zusammenfassung (neutral, keine rechtliche Bewertung)
  ai_summary text,
  ai_summary_source text check (ai_summary_source in ('claude', 'template')),

  -- Kontaktdaten (denormalisiert in JSONB für einfache Migration)
  contact jsonb not null,

  -- Workflow
  status text not null default 'neu'
    check (status in ('neu','in_bearbeitung','kontaktiert','mandat_angenommen','abgelehnt','erledigt')),
  assigned_to_user_id text,

  -- Audit-Trail
  history jsonb not null default '[]'::jsonb,

  -- Bearbeitungs-Priorität (Sortier-Hilfe — KEIN Erfolgs-Rating)
  priority jsonb not null default '{"tier":"medium","numeric":50,"signals":[]}'::jsonb
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_assigned_idx on public.leads (assigned_to_user_id);
create index if not exists leads_area_idx on public.leads (area_id);

-- ============================================================================
-- 3. Row Level Security
-- ============================================================================
-- Modell:
--   - INSERT auf leads: vom Server (Service-Role) im Namen des anonymen
--     Mandanten via /api/leads. Service-Role umgeht RLS sowieso.
--   - SELECT/UPDATE/DELETE auf leads: nur eingeloggte Team-Mitglieder
--     (JWT vom Browser-Client mit Anon-Key + Supabase Auth Session).
--   - tenant_team: nur lesbar für eingeloggte Team-Mitglieder; Schreibzugriff
--     ausschließlich Service-Role (Onboarding-Skript) oder DB-Admin.

alter table public.leads enable row level security;
alter table public.tenant_team enable row level security;

-- leads ----------------------------------------------------------------------

drop policy if exists "team kann leads lesen" on public.leads;
create policy "team kann leads lesen"
  on public.leads
  for select
  to authenticated
  using ( public.is_team_member() );

drop policy if exists "team kann leads aktualisieren" on public.leads;
create policy "team kann leads aktualisieren"
  on public.leads
  for update
  to authenticated
  using ( public.is_team_member() )
  with check ( public.is_team_member() );

drop policy if exists "team kann leads löschen" on public.leads;
create policy "team kann leads löschen"
  on public.leads
  for delete
  to authenticated
  using ( public.is_team_member() );

-- INSERT bleibt Service-Role-only (kein anon insert), damit niemand die
-- Lead-Tabelle direkt vom Browser aus mit Müll fluten kann. Lead-Eingang
-- läuft über /api/leads → dort prüft der Server (z.B. Honeypot/Rate-Limit)
-- bevor er mit der Service-Role schreibt.

-- tenant_team ----------------------------------------------------------------

drop policy if exists "team kann sich selbst sehen" on public.tenant_team;
create policy "team kann sich selbst sehen"
  on public.tenant_team
  for select
  to authenticated
  using ( public.is_team_member() );

-- ============================================================================
-- 4. tenant_settings — Runtime-Config-Overrides (z.B. aktive Rechtsgebiete)
-- ============================================================================
-- Schema-frei (key/value JSONB), damit künftige Settings ohne Migration ergänzt
-- werden können. Lesen: alle Team-Mitglieder. Schreiben: nur Admins.

create table if not exists public.tenant_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.tenant_settings enable row level security;

drop policy if exists "team kann settings lesen" on public.tenant_settings;
create policy "team kann settings lesen"
  on public.tenant_settings
  for select
  to authenticated
  using ( public.is_team_member() );

drop policy if exists "admin kann settings schreiben" on public.tenant_settings;
create policy "admin kann settings schreiben"
  on public.tenant_settings
  for all
  to authenticated
  using ( public.is_team_member_admin() )
  with check ( public.is_team_member_admin() );

-- ============================================================================
-- 5. User-Anlage (einmalig im Onboarding)
-- ============================================================================
-- Im Supabase-Dashboard:  Authentication → Users → "Add user"
--   → E-Mail + Passwort eintragen → "Auto-confirm email" aktivieren
-- Anschließend:  in tenant_team einfügen (oder beim Onboarding via SQL):
--
--   insert into public.tenant_team (email, name, role)
--   values ('partner@kanzlei.de', 'RA Partner', 'admin');
--
-- Und zusätzlich in TENANT.team in tenant.config.ts ergänzen
-- (für Anzeige/Zuweisungs-Dropdown).
