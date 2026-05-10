# Mandorino — White-Label Lead-Tool für Anwaltskanzleien

Pro Deployment = **eine Kanzlei**. Mandanten schildern ihren Fall in einem
geführten Chat unter dem Branding der Kanzlei; das Team bearbeitet die
eingehenden Anfragen in einem internen Dashboard mit Status-Workflow,
Zuweisung, Notizen und Bearbeitungs-Priorität.

> **RDG-Compliance:** Mandorino erbringt **keine** Rechtsdienstleistung.
> Es findet keine rechtliche Bewertung, keine Einschätzung von
> Erfolgsaussichten und keine Handlungsempfehlung statt. Die Bewertung
> übernimmt die Kanzlei im Anschluss. Diese Vorgabe ist im Code an mehreren
> Stellen verankert (UI-Disclaimer, Chat-Skript, Claude-System-Prompt,
> Template-Fallback).

## Tech-Stack

- **Next.js 14** (App Router) + **TypeScript**
- **TailwindCSS** mit Brand-Theming via CSS-Variablen aus `tenant.config.ts`
- **Anthropic SDK** (`@anthropic-ai/sdk`) — `claude-opus-4-6` für die
  neutrale Zusammenfassung der Mandantenangaben
- **localStorage** als Persistenzschicht (MVP) — Repository-Funktionen in
  `lib/leadStore.ts` sind so geschrieben, dass später ein Wechsel auf
  Supabase/Postgres ohne UI-Änderungen möglich ist

## Setup

```bash
npm install
cp .env.local.example .env.local   # optional — ohne API-Key läuft Template-Fallback
npm run dev
```

App unter http://localhost:3000.

## White-Label-Konfiguration

Alles, was pro Kanzlei anders ist, lebt in `lib/tenant.config.ts`:

```ts
TENANT = {
  brand: { kanzleiName, tagline, logoUrl, primary, accent },
  legal: { impressumUrl, datenschutzUrl, rueckmeldungInnerhalb },
  practiceAreas: [ "arbeitsrecht", "verkehrsrecht", ... ],
  team: [ { id, name, email, password, role } ],
  showStreitwertRangeForClient: false,  // Compliance-Toggle
}
```

- **Brand-Farben** werden im Layout als CSS-Variablen (`--brand-primary`,
  `--brand-accent`) gesetzt und über die Klassen `brand-bg` / `brand-text` /
  `brand-border` im UI verwendet.
- **Logo:** wenn `logoUrl` gesetzt, wird das Bild geladen, sonst Text-Fallback.
- **Aktive Rechtsgebiete** werden auf der Landing automatisch als Karten
  gerendert und stehen im Chat als Themen-Auswahl zur Verfügung.
- **Team:** mehrere Login-Accounts mit Rolle (`admin` / `bearbeiter`),
  bislang Klartext-Passwörter im MVP — vor Launch durch echtes Auth ersetzen.

## Rechtsgebiete

Jedes Rechtsgebiet ist ein eigenes Modul unter `lib/areas/`:

| Datei | Bereich |
|---|---|
| `arbeitsrecht.ts` | Kündigung, Abmahnung, Aufhebung, Lohn, Zeugnis |
| `verkehrsrecht.ts` | Unfall, Bußgeld, Führerschein, Strafverfahren |
| `digitales.ts` | DSGVO, Abmahnung, Urheberrecht, IT-Verträge |
| `mietrecht.ts` | Kündigung, Mängel, Mieterhöhung, Nebenkosten |
| `erbrecht.ts` | Pflichtteil, Testament, Erbschein, Auseinandersetzung |

Jedes Modul liefert (1) seinen eigenen Chat-Flow mit area-spezifischen Steps,
(2) eine Score-Funktion (`scorePriority`) für die Bearbeitungs-Priorität.
Über `lib/areas/registry.ts` werden die Module per ID adressiert.

### Neue Rechtsgebiete hinzufügen

1. `lib/areas/<neu>.ts` nach Vorlage anlegen.
2. In `lib/areas/registry.ts` den Eintrag ergänzen + `PracticeAreaId`-Typ erweitern.
3. In `tenant.config.ts` unter `practiceAreas` aktivieren.

## Bearbeitungs-Priorität (kein juristisches Erfolgs-Rating)

**Wichtig:** Der Score in `lead.priority` ist **kein Erfolgs-Rating**.
Er ist eine reine Geschäfts-Sortier-Hilfe und basiert auf:

- **Frist-Sensitivität** (z.B. Kündigung im Arbeitsrecht: ≤ 21 Tage seit Erhalt)
- **Dokumenten-Vollständigkeit**
- **Streitwert-Indikatoren** (Beschäftigungsdauer × Gehalt; Sachschadens-Range; Nachlass-Größe)
- **Mandanten-Dringlichkeit** (Eigenangabe)
- **Fit zum Rechtsgebiet** der Kanzlei

Im UI wird das als „Bearbeitungs-Priorität: hoch / mittel / niedrig"
angezeigt, **niemals** als „Erfolgsaussicht".

## Compliance-Architektur

Vier Ebenen halten das Tool von einer Rechtsdienstleistung fern:

1. **UI-Disclaimer** in Banner, Landing und Chat (`components/DisclaimerBanner.tsx`,
   `lib/disclaimer.ts`).
2. **Chat-Skript** — keine `botMessage()` formuliert eine Bewertung. Fragt der
   Mandant nach Einschätzung, antwortet der Bot mit `DISCLAIMER.userAskedForAdvice`.
3. **Claude-System-Prompt** in `app/api/summarize/route.ts` — explizites Verbot
   von Bewertung/Erfolgsaussicht/Empfehlung.
4. **Template-Fallback** (`lib/templateSummary.ts`) — strikt deskriptiv.

> **Vor Launch unbedingt mit Anwalt prüfen:** Die optionale Anzeige der
> Streitwert-Range beim Mandanten (`showStreitwertRangeForClient`) ist per
> Default deaktiviert. Vor Aktivierung muss eine Anwältin/ein Anwalt die
> Formulierung freigeben.

## Demo-Zugänge

### Mandanten-Seite
- `/` → Landing mit Rechtsgebieten
- `/chat` → geführter Chatbot

### Team-Bereich
- `/team/login`
- **Dev-Demo** (ohne Supabase): `anwalt@example.de` / `kanzlei123` bzw.
  `sekretariat@example.de` / `kanzlei123`
- **Produktiv:** Login über Supabase Auth (gehashte Passwörter); Whitelist
  in `tenant_team`-Tabelle + `tenant.config.ts → team`
- `/team/dashboard` → Lead-Liste mit Filter, Sortierung, Status
- `/team/lead/[id]` → Detail mit Status-Wechsel, Zuweisung, Notizen, Historie
- `/team/analytics` → schlanke KPI-Übersicht
- `/team/embed` → Copy-Paste-Snippets für die Kanzlei-Website

Beim ersten Aufruf werden 5 Demo-Leads ins localStorage geschrieben.

## Projekt-Struktur

```
app/
├─ page.tsx                          # Landing (dynamisch aus tenant.config)
├─ chat/page.tsx                     # Chatbot (Mandanten-Seite mit Header/Footer)
├─ embed/                            # Iframe-/Widget-Modus (ohne Header/Footer)
│  ├─ layout.tsx                     # Minimal-Layout
│  ├─ page.tsx                       # Chatbot + postMessage-Resize
│  └─ danke/page.tsx                 # Bestätigung im Embed
├─ danke/page.tsx                    # Bestätigung (Vollseite)
├─ team/
│  ├─ login/page.tsx
│  ├─ dashboard/page.tsx             # Liste, Filter, Sort, Status
│  ├─ lead/[id]/page.tsx             # Detail + Workflow
│  ├─ analytics/page.tsx             # Schlanke KPIs (Platzhalter)
│  └─ embed/page.tsx                 # Copy-Paste-Snippets für Kanzlei-Website
└─ api/
   ├─ summarize/route.ts             # Claude-API + Template-Fallback
   └─ leads/route.ts                 # Lead-POST → Notifications + (opt.) Supabase

public/
└─ widget.js                         # Drop-in-Script (Floating-Button + Overlay)

components/                          # Header, Footer, DisclaimerBanner, Logo,
                                     # ChatBubble, ChatContainer, QuickReplyChips,
                                     # StatusPill

lib/
├─ tenant.config.ts                  # White-Label-Konfig (Brand, Areas, Notif.)
├─ types.ts                          # Lead, LeadDraft, LeadStatus, Historie
├─ chatFlow.ts                       # Globale Steps + Area-Auflösung
├─ leadStore.ts                      # Client-CRUD (localStorage) + Demo-Seed
├─ authStore.ts                      # Multi-User-Login aus Tenant-Config
├─ templateSummary.ts                # Generische Fallback-Zusammenfassung
├─ disclaimer.ts                     # White-Label-Disclaimer-Texte
├─ constants.ts                      # Modell-ID, Schwellwerte
├─ areas/                            # Practice-Area-Plugins
│  ├─ types.ts / _helpers.ts / registry.ts
│  └─ arbeitsrecht.ts / verkehrsrecht.ts / digitales.ts / mietrecht.ts / erbrecht.ts
├─ notifications/                    # Pluggable Channels
│  ├─ types.ts                       # NotificationChannel + Configs
│  ├─ format.ts                      # Gemeinsame Body-Formatierung
│  ├─ dispatch.ts                    # Channel-Builder + Fan-out
│  └─ channels/                      # Email / Slack / Teams / Webhook
└─ repos/                            # Repository-Pattern für Persistenz
   ├─ leadRepo.ts                    # Interface
   └─ supabaseLeadRepo.ts            # Supabase-Impl (lazy import)

supabase/
└─ schema.sql                        # CREATE TABLE leads + Indexe + RLS-Hinweis
```

## Pricing (Arbeits-Annahme)

- **Erste Kanzlei: kostenfrei** gegen Compliance-Check (AGB, Datenschutz,
  AVV, Disclaimer-Review, Score-/Range-Logik).
- Reguläre Kanzleien:
  - **Setup-Fee einmalig: 1.499 €** (Onboarding, Branding, Schulung)
  - **SaaS-Pauschale: 149 €/Monat** (Hosting, Updates, Support, ~100 Leads inkl.)
  - **Über-Volumen: 1 €/Lead** (deckt KI-Token komfortabel)
  - **12-Monats-Mindestlaufzeit** im ersten Jahr

## Einbettung auf der Kanzlei-Website

Mandorino läuft als eigenständige Anwendung (z.B. `kanzlei.mandorino.app`).
Die Kanzlei bindet das Widget auf ihrer eigenen Website auf zwei Arten ein:

**Variante A — Floating-Button (Drop-in-Script):**

```html
<script src="https://kanzlei.mandorino.app/widget.js"
        data-mandorino-base="https://kanzlei.mandorino.app"
        data-button-text="Anliegen schildern"
        data-button-color="#0F4C81"
        data-position="br"
        defer></script>
```

**Variante B — Inline-Iframe** (für eine eigene `/kontakt`-Seite):

```html
<iframe src="https://kanzlei.mandorino.app/embed"
        style="border:0;width:100%;min-height:640px"></iframe>
```

Im Team-Bereich unter `/team/embed` gibt es Copy-Paste-Snippets mit den
brand-spezifischen Farben automatisch eingesetzt. Das Iframe meldet seine
Höhe per `postMessage` zurück, das Drop-in-Script passt es automatisch an.

## Notifications — Email, Slack, Teams, Webhook

Eingehende Leads werden parallel an alle in `tenant.config.notifications`
konfigurierten Channels gepusht. Jede Kanzlei kann beliebig kombinieren:

```ts
notifications: [
  { kind: "email", label: "Sekretariat", to: ["leads@kanzlei.de"] },
  { kind: "slack", label: "#leads",  webhookUrl: process.env.SLACK_WEBHOOK_URL! },
  { kind: "teams", label: "Team",    webhookUrl: process.env.TEAMS_WEBHOOK_URL! },
  { kind: "webhook", label: "n8n",   url: process.env.GENERIC_WEBHOOK_URL! },
]
```

| Channel | Setup |
|---|---|
| **Email (SMTP)** | `SMTP_HOST/PORT/USER/PASS/FROM` in `.env.local`. Outlook: `smtp.office365.com:587`, Gmail: `smtp.gmail.com:587` (App-Password). |
| **Slack** | Slack-App → Incoming Webhooks → Webhook im Ziel-Channel anlegen → URL in Tenant-Config. |
| **Teams** | Channel → "…" → Connectors → Incoming Webhook → URL in Tenant-Config. |
| **Webhook** | Beliebiger HTTP-Endpoint (Zapier, Make, n8n, eigenes CRM). |

**Microsoft Graph** (OAuth-basiert, ohne SMTP-Passwort) ist als zweiter
Email-Transport vorgesehen — kommt nach Launch.

Channel-Fehler sind nicht-blockierend: ein kaputter Slack-Webhook verhindert
nicht, dass der Lead im Dashboard erscheint.

## Persistenz + Auth — localStorage (MVP) ↔ Supabase (Produktiv)

Zwei Modi, automatisch umgeschaltet:

| Modus | Aktivierung | Persistenz | Auth |
|---|---|---|---|
| **MVP** (Dev/Demo) | keine Supabase-Env-Vars | `localStorage` im Browser | Klartext-Passwort aus `tenant.config.ts`, Session in `localStorage` |
| **Produktiv** | `SUPABASE_*` + `NEXT_PUBLIC_SUPABASE_*` gesetzt | Supabase-DB mit RLS | Supabase Auth (gehashte Passwörter, JWT, Auto-Refresh) |

### Setup

```bash
# 1. Supabase-Projekt anlegen (https://supabase.com)
# 2. SQL-Editor öffnen → supabase/schema.sql ausführen
#    → erstellt leads-Tabelle + tenant_team-Whitelist + RLS-Policies
# 3. Settings → API:
#      service_role Key  → SUPABASE_SERVICE_ROLE_KEY (server-only!)
#      anon public Key   → NEXT_PUBLIC_SUPABASE_ANON_KEY
#      Project URL       → SUPABASE_URL + NEXT_PUBLIC_SUPABASE_URL
# 4. npm install @supabase/supabase-js
# 5. Authentication → Users → "Add user" → E-Mail/Passwort jedes
#    Team-Mitglieds anlegen, "Auto-confirm email" aktivieren
# 6. SQL-Editor → tenant_team-Whitelist befüllen (siehe schema.sql Kommentar)
# 7. Dieselben Email/Name/Rolle in tenant.config.ts → TENANT.team eintragen
#    (Passwort weglassen — die Anwesenheit von password im Code aktiviert
#     den MVP-Fallback und unterläuft die Supabase-Auth)
```

### Sicherheitsmodell

- **Mandanten-Eingang** (`/chat`, `/embed`): anonym, schreibt via
  `/api/leads` mit der Service-Role in `leads`. Direkter Anon-INSERT in die
  Tabelle ist per RLS verboten — keine Spam-Flut von außen.
- **Team-Dashboard**: nutzt Browser-Anon-Key + Supabase-JWT. RLS-Policy
  `is_team_member()` prüft, ob die JWT-Email auf der `tenant_team`-Whitelist
  steht. Wer in Supabase Auth einen User anlegt, der nicht in `tenant_team`
  steht, kommt ins Login, aber sieht keine Leads — und wird beim nächsten
  `verifySession()` automatisch ausgeloggt.
- **Service-Role-Key** liegt ausschließlich auf dem Server (Vercel-Env),
  nie im Client-Bundle.

## Spätere Schritte (out-of-scope für diesen MVP)

- **2FA** für Admin-Rolle (Supabase Auth unterstützt TOTP nativ — UI fehlt noch)
- **Microsoft Graph** als zweiter Email-Transport (OAuth, ohne SMTP-Passwort)
- **Datei-Uploads** (Kündigungsschreiben, Fotos, Dokumente) → Supabase Storage
- **Erweiterte Analytics** (Funnel, Reaktionszeiten, Lead-Quellen)
- **Stripe-Subscription** für die SaaS-Pauschale
- **Streitwert-Range-Anzeige** beim Mandanten (nach Anwaltsprüfung)
- **Web-Component-Variante** (Custom Element ohne Iframe) für tiefere Integration
