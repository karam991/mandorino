export const APP_NAME = "Mandorino";

/** Default-Modell für die KI-Zusammenfassung. */
export const DEFAULT_CLAUDE_MODEL = "claude-opus-4-6";

/**
 * Mindestens diese Felder müssen Mandant-Notizen enthalten,
 * bevor wir eine Claude-Anfrage stellen (Sicherheit gegen Müll-Prompts).
 */
export const SUMMARY_MIN_FIELDS = 2;
