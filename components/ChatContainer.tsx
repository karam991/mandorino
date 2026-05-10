"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChatBubble } from "@/components/ChatBubble";
import { MultiChips, QuickReplyChips } from "@/components/QuickReplyChips";
import { getPracticeArea } from "@/lib/areas/registry";
import { ENTRY_STEP, getStep, type StepId } from "@/lib/chatFlow";
import { DISCLAIMER } from "@/lib/disclaimer";
import { buildLeadFromDraft, saveLead } from "@/lib/leadStore";
import { buildTemplateSummary } from "@/lib/templateSummary";
import { getActivePracticeAreaIds } from "@/lib/tenantOverrides";
import { emptyDraft, type LeadDraft } from "@/lib/types";

interface BubbleMsg {
  id: string;
  sender: "bot" | "user";
  text: string;
}

/**
 * Snapshot des Chat-Zustands vor einer User-Antwort.
 * Wird beim Beantworten einer Frage gepusht; „Letzte Antwort ändern"
 * pop't den letzten Snapshot und stellt damit den vorherigen Step wieder her.
 */
interface UndoSnapshot {
  draft: LeadDraft;
  stepId: StepId;
  messageCount: number;
  summary: string | null;
  summarySource: "claude" | "template" | null;
}

interface ChatContainerProps {
  /**
   * "page" = klassische Mandanten-Seite mit normalem Layout.
   * "embed" = Iframe-/Widget-Modus: kompakter, keine zusätzliche Außen-Hülle.
   */
  variant?: "page" | "embed";
  /** Pfad nach Lead-Übermittlung. Für Embed sinnvoll: relativer Pfad bleibt im Iframe. */
  successPath?: (leadId: string) => string;
}

/**
 * Chat-Logik & UI — wird von /chat (mit Header/Footer) und /embed (ohne) gleichermaßen
 * benutzt. Unterscheidung läuft nur über `variant` (Höhen, Padding) und `successPath`.
 */
export function ChatContainer({
  variant = "page",
  successPath = (id) => `/danke?lead=${encodeURIComponent(id)}`,
}: ChatContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [draft, setDraft] = useState<LeadDraft>(() => emptyDraft());
  const [stepId, setStepId] = useState<StepId>(ENTRY_STEP);
  const [messages, setMessages] = useState<BubbleMsg[]>([]);
  const [textInput, setTextInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    postalCode: "",
    companyName: "",
    contactPosition: "",
    vatId: "",
  });
  const [consent, setConsent] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarySource, setSummarySource] = useState<"claude" | "template" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<UndoSnapshot[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const step = getStep(stepId);

  // Initiale Bot-Begrüßung — bei Deep-Link `?area=xxx` direkt mit area_intro starten,
  // sonst klassisch mit dem globalen intro.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const areaParam = searchParams?.get("area") ?? null;
    if (areaParam) {
      const activeIds = getActivePracticeAreaIds();
      const area = getPracticeArea(areaParam);
      if (area && activeIds.includes(area.id as (typeof activeIds)[number])) {
        const seeded: LeadDraft = {
          ...emptyDraft(),
          areaId: area.id,
          areaLabel: area.label,
          areaData: {},
        };
        setDraft(seeded);
        setStepId("area_intro");
        const step = getStep("area_intro");
        if (step) pushBot(step.botMessage(seeded));
        return;
      }
    }

    const intro = getStep(ENTRY_STEP);
    if (intro) pushBot(intro.botMessage(emptyDraft()));
  }, [searchParams]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, stepId, summary]);

  function pushBot(text: string) {
    setMessages((m) => [
      ...m,
      { id: `b_${Date.now()}_${Math.random()}`, sender: "bot", text },
    ]);
  }

  function pushUser(text: string) {
    setMessages((m) => [
      ...m,
      { id: `u_${Date.now()}_${Math.random()}`, sender: "user", text },
    ]);
  }

  /**
   * Kleine, freundliche Bestätigung nach einer User-Eingabe — variiert,
   * damit es nicht roboterhaft wirkt. Bewusst neutral, ohne Bewertung
   * (sonst würde der Bot subtil rechtliche Reaktionen geben).
   */
  const ACKS = [
    "Danke!",
    "Verstanden, danke.",
    "Alles klar.",
    "Super, danke für die Info.",
    "Notiert, vielen Dank.",
    "Danke für Ihre Antwort.",
  ];
  function pushAck() {
    const text = ACKS[Math.floor(Math.random() * ACKS.length)];
    pushBot(text);
  }

  function advance(nextDraft: LeadDraft, nextId: StepId | null, withAck: boolean) {
    if (!nextId) return;
    setDraft(nextDraft);
    setStepId(nextId);
    setTextInput("");
    setDateInput("");
    setMultiSel([]);
    const nextStep = getStep(nextId);
    if (!nextStep) return;
    // Höflichkeit: nur wenn der User wirklich etwas geantwortet hat (nicht bei
    // „Weiter"-Klicks auf Info-Steps) und auch nicht direkt vor der finalen
    // Zusammenfassung (da kommt sowieso ein „Vielen Dank!").
    if (withAck && nextStep.inputType.kind !== "review") {
      pushAck();
    }
    pushBot(nextStep.botMessage(nextDraft));
    if (nextStep.inputType.kind === "review") {
      void requestSummary(nextDraft);
    }
  }

  function snapshot(): UndoSnapshot {
    return {
      draft: { ...draft, areaData: { ...draft.areaData } },
      stepId,
      messageCount: messages.length,
      summary,
      summarySource,
    };
  }

  function handleAnswer(answer: unknown, displayText: string) {
    if (!step) return;
    setHistory((h) => [...h, snapshot()]);
    pushUser(displayText);
    const newDraft: LeadDraft = {
      ...draft,
      areaData: { ...draft.areaData },
    };
    step.apply?.(answer, newDraft);
    advance(newDraft, step.next(newDraft), /* withAck */ true);
  }

  function handleInfoNext() {
    if (!step) return;
    setHistory((h) => [...h, snapshot()]);
    advance(draft, step.next(draft), /* withAck */ false);
  }

  /**
   * Rollt den letzten Antwort-Schritt zurück: stellt Draft + Step wieder her,
   * schneidet die letzten Bot/User-Bubbles ab. Disabled, sobald die Anfrage
   * abgeschickt wurde (done) oder die Historie leer ist.
   */
  function handleUndo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setDraft(prev.draft);
      setStepId(prev.stepId);
      setMessages((m) => m.slice(0, prev.messageCount));
      setSummary(prev.summary);
      setSummarySource(prev.summarySource);
      setTextInput("");
      setDateInput("");
      setMultiSel([]);
      setError(null);
      return h.slice(0, -1);
    });
  }

  /**
   * Chat komplett verlassen: bestätigt vorher (alle Eingaben gehen verloren)
   * und navigiert zur Startseite. Im Embed-Modus wird stattdessen der Chat
   * resettet, weil das umschließende Iframe nicht weiß, wohin.
   */
  function handleLeave() {
    const ok = window.confirm(
      "Chat wirklich verlassen? Ihre bisherigen Angaben gehen dabei verloren und werden nicht an die Kanzlei übermittelt.",
    );
    if (!ok) return;
    if (variant === "embed") {
      setDraft(emptyDraft());
      setStepId(ENTRY_STEP);
      setMessages([]);
      setHistory([]);
      setSummary(null);
      setSummarySource(null);
      setTextInput("");
      setDateInput("");
      setMultiSel([]);
      setContact({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        postalCode: "",
        companyName: "",
        contactPosition: "",
        vatId: "",
      });
      setConsent(false);
      setError(null);
      const intro = getStep(ENTRY_STEP);
      if (intro) pushBot(intro.botMessage(emptyDraft()));
      return;
    }
    router.push("/");
  }

  async function requestSummary(finalDraft: LeadDraft) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: finalDraft }),
      });
      if (!res.ok) throw new Error("API-Antwort nicht ok");
      const data = (await res.json()) as { summary: string; source: "claude" | "template" };
      setSummary(data.summary);
      setSummarySource(data.source);
    } catch {
      setSummary(buildTemplateSummary(finalDraft));
      setSummarySource("template");
    } finally {
      setBusy(false);
    }
  }

  async function submitLead() {
    if (!summary || !summarySource) return;
    try {
      const lead = buildLeadFromDraft(draft, summary, summarySource);
      saveLead(lead);
      // Server-seitig Benachrichtigungen auslösen (Email/Slack/Teams/Webhook).
      // Bewusst NICHT blockierend für die User-Experience — Mandant darf nicht
      // hängen, wenn ein Slack-Webhook der Kanzlei mal Schluckauf hat.
      void fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead }),
      }).catch((err) => {
        // Lead ist trotzdem im Dashboard sichtbar; Notification ist nur „nice to have".
        console.warn("[mandorino] notification dispatch failed", err);
      });
      router.push(successPath(lead.id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Ihre Angaben sind unvollständig — bitte gehen Sie einen Schritt zurück.",
      );
    }
  }

  function handleAdviceQuestion() {
    pushBot(DISCLAIMER.userAskedForAdvice);
  }

  // Layout-Größen je nach Modus
  const wrapperClass =
    variant === "embed"
      ? "flex flex-col gap-3 p-3 sm:p-4 h-full"
      : "mx-auto max-w-2xl px-4 sm:px-6 py-6 flex flex-col gap-4 min-h-[calc(100vh-200px)]";

  const scrollClass =
    variant === "embed"
      ? "card bg-paper-dark/40 border-line p-3 sm:p-4 flex-1 overflow-y-auto min-h-[240px]"
      : "card bg-paper-dark/40 border-line p-4 sm:p-5 flex-1 overflow-y-auto max-h-[60vh] min-h-[300px]";

  return (
    <div className={wrapperClass}>
      <div ref={scrollRef} className={scrollClass}>
        {messages.map((m) => (
          <ChatBubble key={m.id} sender={m.sender}>
            {m.text}
          </ChatBubble>
        ))}
        {busy && stepId === "summary" && (
          <ChatBubble sender="bot">
            Einen Moment — ich fasse Ihre Angaben zusammen…
          </ChatBubble>
        )}
      </div>

      <div className="card p-4 sm:p-5">
        {step ? renderInput() : <p className="text-sm text-muted">Unbekannter Schritt.</p>}
        {error && (
          <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </p>
        )}
      </div>

      {stepId !== "done" && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0 || stepId === "summary"}
            className="text-xs text-muted hover:text-ink-dark underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"
            title={
              stepId === "summary"
                ? 'In der Zusammenfassung können Sie unten „Zusammenfassung neu erstellen" oder hier „Chat verlassen" wählen.'
                : "Setzt nur den letzten Schritt zurück"
            }
          >
            ← Letzte Antwort ändern
          </button>
          {stepId !== "summary" && (
            <button
              type="button"
              onClick={handleAdviceQuestion}
              className="text-xs text-muted hover:text-ink-dark underline"
            >
              Ich brauche eine rechtliche Einschätzung — was ist hier möglich?
            </button>
          )}
          <button
            type="button"
            onClick={handleLeave}
            className="text-xs text-muted hover:text-red-700 underline ml-auto"
          >
            Chat verlassen
          </button>
        </div>
      )}
    </div>
  );

  function renderInput() {
    if (!step) return null;
    const it = step.inputType;

    if (it.kind === "info") {
      return (
        <button type="button" onClick={handleInfoNext} className="btn-primary">
          Weiter
        </button>
      );
    }

    if (it.kind === "choice") {
      return (
        <QuickReplyChips
          options={it.options}
          onSelect={(v) => handleAnswer(v, v)}
          disabled={busy}
        />
      );
    }

    if (it.kind === "multi") {
      const allowEmpty = it.allowEmpty ?? false;
      return (
        <div className="flex flex-col gap-3">
          <MultiChips
            options={it.options}
            selected={multiSel}
            onToggle={(v) =>
              setMultiSel((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]))
            }
            disabled={busy}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={!allowEmpty && multiSel.length === 0}
              onClick={() =>
                handleAnswer(
                  multiSel,
                  multiSel.length === 0 ? "Keine Auswahl" : multiSel.join(", "),
                )
              }
            >
              Weiter
            </button>
            {allowEmpty && multiSel.length === 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleAnswer([], "Keine Auswahl")}
              >
                Überspringen
              </button>
            )}
          </div>
        </div>
      );
    }

    if (it.kind === "date") {
      return (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            className="input flex-1"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={!dateInput}
            onClick={() => handleAnswer(dateInput, new Date(dateInput).toLocaleDateString("de-DE"))}
          >
            Weiter
          </button>
        </div>
      );
    }

    if (it.kind === "text") {
      const optional = it.optional ?? false;
      return (
        <div className="flex flex-col gap-2">
          {it.multiline ? (
            <textarea
              className="input min-h-[100px]"
              placeholder={it.placeholder}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          ) : (
            <input
              type="text"
              className="input"
              placeholder={it.placeholder}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              disabled={!optional && textInput.trim().length === 0}
              onClick={() =>
                handleAnswer(textInput, textInput.trim() || "(keine Angabe)")
              }
            >
              Weiter
            </button>
            {optional && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleAnswer("", "(keine Angabe)")}
              >
                Überspringen
              </button>
            )}
          </div>
        </div>
      );
    }

    if (it.kind === "contact") {
      const isBusiness = draft.clientType === "business";
      const valid =
        contact.firstName.trim() &&
        contact.lastName.trim() &&
        /\S+@\S+\.\S+/.test(contact.email) &&
        contact.phone.trim() &&
        /^\d{4,5}$/.test(contact.postalCode.trim()) &&
        (!isBusiness || contact.companyName.trim().length > 0);
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          {isBusiness && (
            <input
              className="input sm:col-span-2"
              placeholder="Firmenname"
              value={contact.companyName}
              onChange={(e) => setContact({ ...contact, companyName: e.target.value })}
            />
          )}
          <input
            className="input"
            placeholder="Vorname"
            value={contact.firstName}
            onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
          />
          <input
            className="input"
            placeholder="Nachname"
            value={contact.lastName}
            onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
          />
          {isBusiness && (
            <>
              <input
                className="input"
                placeholder="Position im Unternehmen (optional)"
                value={contact.contactPosition}
                onChange={(e) => setContact({ ...contact, contactPosition: e.target.value })}
              />
              <input
                className="input"
                placeholder="USt-ID (optional)"
                value={contact.vatId}
                onChange={(e) => setContact({ ...contact, vatId: e.target.value })}
              />
            </>
          )}
          <input
            className="input sm:col-span-2"
            placeholder="E-Mail"
            type="email"
            value={contact.email}
            onChange={(e) => setContact({ ...contact, email: e.target.value })}
          />
          <input
            className="input"
            placeholder="Telefon"
            value={contact.phone}
            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
          />
          <input
            className="input"
            placeholder="PLZ"
            value={contact.postalCode}
            onChange={(e) => setContact({ ...contact, postalCode: e.target.value })}
          />
          <button
            type="button"
            className="btn-primary sm:col-span-2"
            disabled={!valid}
            onClick={() => {
              const baseDisplay = `${contact.firstName} ${contact.lastName} · ${contact.email} · ${contact.phone} · PLZ ${contact.postalCode}`;
              const display = isBusiness
                ? `${contact.companyName} · ${baseDisplay}`
                : baseDisplay;
              handleAnswer(contact, display);
            }}
          >
            Weiter
          </button>
        </div>
      );
    }

    if (it.kind === "consent") {
      return (
        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-3 text-sm text-ink-dark/90 leading-relaxed">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              Ich willige ein, dass die Kanzlei meine Angaben zur Bearbeitung meiner Anfrage
              verarbeitet. Mir ist bekannt, dass dieser Chat keine Rechtsberatung ist und die
              rechtliche Bewertung im persönlichen Gespräch erfolgt. Ich kann meine Einwilligung
              jederzeit widerrufen.
            </span>
          </label>
          <button
            type="button"
            className="btn-primary self-start"
            disabled={!consent}
            onClick={() => handleAnswer(true, "Einwilligung erteilt")}
          >
            Bestätigen
          </button>
        </div>
      );
    }

    if (it.kind === "review") {
      return (
        <div className="flex flex-col gap-4">
          {summary ? (
            <>
              <div className="bg-paper-dark border border-line rounded-lg p-4 text-sm text-ink-dark/95 leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>
              <p className="text-xs text-muted">
                Quelle:{" "}
                {summarySource === "claude" ? "KI-Reformulierung (Claude)" : "Strukturvorlage"} ·
                ohne rechtliche Bewertung
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button type="button" className="btn-primary" onClick={submitLead}>
                  An die Kanzlei übermitteln
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => requestSummary(draft)}
                  disabled={busy}
                >
                  Zusammenfassung neu erstellen
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Zusammenfassung wird erstellt…</p>
          )}
        </div>
      );
    }

    return null;
  }
}
