import { TENANT } from "./tenant.config";

/**
 * Zentrale Disclaimer-Texte für das White-Label-Setup.
 *
 * Wichtig: Das Widget wird unter Kanzlei-Branding ausgespielt — der Nutzer
 * darf trotzdem nicht den Eindruck einer fertigen Erstberatung gewinnen.
 * Daher: klare Trennung zwischen „Erfassung durch Tool" und
 * „rechtliche Bewertung durch die Kanzlei im Anschluss".
 *
 * RDG-Compliance: keine Bewertung, keine Erfolgsaussichten, keine
 * Handlungsempfehlung im Bot — die Kanzlei übernimmt.
 */
export const DISCLAIMER = {
  shortBanner:
    `Dieser Chat erfasst Ihr Anliegen vorab — die rechtliche Bewertung übernimmt ${TENANT.brand.kanzleiName} im Gespräch.`,

  fullText:
    `${TENANT.brand.kanzleiName} nutzt diesen digitalen Vorab-Erfassungs-Assistenten, um Ihr Anliegen zu strukturieren. ` +
    `Der Chat selbst stellt keine Rechtsdienstleistung im Sinne des Rechtsdienstleistungsgesetzes (RDG) dar und ersetzt keine anwaltliche Beratung. ` +
    `Eine individuelle rechtliche Bewertung Ihres Falles, Aussagen zu Erfolgsaussichten oder konkrete Handlungsempfehlungen erfolgen ausschließlich im persönlichen Gespräch mit einer Anwältin oder einem Anwalt der Kanzlei. ` +
    `Eine Rückmeldung erhalten Sie in der Regel innerhalb ${TENANT.legal.rueckmeldungInnerhalb}.`,

  preChatNotice:
    "Bevor wir starten: Wir stellen Ihnen einige Fragen zu Ihrer Situation. " +
    "Wir hören zu und ordnen Ihre Angaben — wir bewerten Ihren Fall jedoch nicht. " +
    "Diese Aufgabe übernimmt anschließend die Kanzlei.",

  /** Standardisierte Antwort, falls Nutzer im Chat nach Einschätzung/Beratung fragen. */
  userAskedForAdvice:
    "Diese Frage darf ich Ihnen nicht beantworten — eine rechtliche Bewertung darf nur eine Anwältin oder ein Anwalt der Kanzlei vornehmen. " +
    "Ich notiere Ihre Frage aber für das Erst-Gespräch.",
} as const;
