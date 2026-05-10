import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";

export function StatusPill({ status }: { status: LeadStatus }) {
  return <span className={`status-${status}`}>{LEAD_STATUS_LABELS[status]}</span>;
}

export function PriorityPill({ tier }: { tier: "high" | "medium" | "low" }) {
  const label = tier === "high" ? "Hohe Priorität" : tier === "medium" ? "Mittel" : "Niedrig";
  return <span className={`prio-${tier}`}>{label}</span>;
}
