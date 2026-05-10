import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { DEFAULT_CLAUDE_MODEL } from "@/lib/constants";
import { buildTemplateSummary } from "@/lib/templateSummary";
import type { LeadDraft } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Erzeugt eine neutrale, strukturierte Zusammenfassung des Mandanten-Anliegens
 * für das Anwalts-Dashboard. Verwendet Claude, wenn ANTHROPIC_API_KEY gesetzt
 * ist; sonst Template-Fallback.
 *
 * COMPLIANCE: Der System-Prompt verbietet jegliche rechtliche Bewertung,
 * Empfehlung oder Einschätzung von Erfolgsaussichten. Output muss rein
 * deskriptiv sein und die Mandantenangaben sortiert wiedergeben.
 */

const SYSTEM_PROMPT = `Du bist ein neutraler Assistent, der für eine deutsche Anwaltskanzlei eingehende Mandanten-Anfragen aus einem Online-Chat strukturiert zusammenfasst.

ABSOLUTES VERBOT — du darfst unter keinen Umständen:
- eine rechtliche Bewertung oder Einschätzung des Falles abgeben
- Erfolgsaussichten benennen oder andeuten
- Handlungsempfehlungen aussprechen ("Sie sollten...", "wir empfehlen...", "es wäre ratsam...")
- juristische Begriffe interpretieren oder auslegen
- Fristen rechtlich einordnen ("die 3-Wochen-Frist greift", "noch fristgerecht")
- Vermutungen über die Rechtslage anstellen
- den Mandanten beruhigen oder besorgen ("kein Grund zur Sorge", "kritisch")

DEINE AUFGABE — du sollst:
- die Angaben des Mandanten in einem klaren, sachlichen Fließtext zusammenfassen (max. 6 Sätze)
- ausschließlich Informationen verwenden, die der Mandant tatsächlich gegeben hat
- jede Aussage als Mandantenangabe kennzeichnen ("laut Mandant", "Mandant berichtet", "Mandant gibt an")
- am Ende einen kurzen Satz ergänzen, der klarstellt: "Diese Zusammenfassung enthält keine rechtliche Bewertung."
- die deutsche Sprache, über den Mandanten in dritter Person
- keine Markdown-Formatierung verwenden, nur Fließtext

Wenn Daten fehlen, lasse sie weg — keine Annahmen erfinden.`;

interface SummarizeRequest {
  draft: LeadDraft;
}

interface SummarizeResponse {
  summary: string;
  source: "claude" | "template";
}

export async function POST(req: Request) {
  let body: SummarizeRequest;
  try {
    body = (await req.json()) as SummarizeRequest;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const draft = body.draft;
  if (!draft || typeof draft !== "object") {
    return NextResponse.json({ error: "Feld `draft` fehlt." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json<SummarizeResponse>({
      summary: buildTemplateSummary(draft),
      source: "template",
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_CLAUDE_MODEL;

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: formatDraftForClaude(draft) }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) {
      return NextResponse.json<SummarizeResponse>({
        summary: buildTemplateSummary(draft),
        source: "template",
      });
    }

    return NextResponse.json<SummarizeResponse>({ summary: text, source: "claude" });
  } catch (err) {
    console.error("Claude-Aufruf fehlgeschlagen, nutze Template:", err);
    return NextResponse.json<SummarizeResponse>({
      summary: buildTemplateSummary(draft),
      source: "template",
    });
  }
}

function formatDraftForClaude(draft: LeadDraft): string {
  const lines: string[] = [
    `Mandantenangaben aus dem Online-Chat (Rechtsgebiet: ${draft.areaLabel ?? "—"}). Bitte neutral zusammenfassen.`,
  ];

  for (const [key, value] of Object.entries(draft.areaData)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) lines.push(`- ${key}: ${value.join(", ")}`);
    } else if (typeof value === "string") {
      if (value.trim()) lines.push(`- ${key}: ${value}`);
    } else {
      lines.push(`- ${key}: ${String(value)}`);
    }
  }

  if (draft.urgency) lines.push(`- urgency: ${draft.urgency}`);
  if (draft.insurance) {
    const ins = draft.insurance;
    const provider = ins.provider?.trim() ? ` (${ins.provider})` : "";
    lines.push(`- legalInsurance: ${ins.status}${provider}`);
  }
  if (draft.claimValue) lines.push(`- claimValueBucket: ${draft.claimValue}`);
  if (draft.userNotes) lines.push(`- userNotes: ${draft.userNotes}`);

  return lines.join("\n");
}
