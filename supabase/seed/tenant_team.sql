-- Alternative zum CSV-Import: im Supabase SQL Editor ausführen.
-- "on conflict do nothing" → bereits vorhandene Zeilen werden übersprungen, nichts geht kaputt.
insert into public.tenant_team (email, name, role) values
  ('t.hartmann@hartmann-kollegen.de', 'Dr. Thomas Hartmann', 'admin'),
  ('admin@hartmann-kollegen.de',      'Admin',               'admin'),
  ('s.bauer@hartmann-kollegen.de',    'Sandra Bauer',        'bearbeiter')
on conflict (email) do nothing;
