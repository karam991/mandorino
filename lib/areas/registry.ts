import { ARBEITSRECHT } from "./arbeitsrecht";
import { DIGITALES } from "./digitales";
import { ERBRECHT } from "./erbrecht";
import { MIETRECHT } from "./mietrecht";
import { VERKEHRSRECHT } from "./verkehrsrecht";
import type { PracticeArea } from "./types";

export type PracticeAreaId =
  | "arbeitsrecht"
  | "verkehrsrecht"
  | "digitales"
  | "mietrecht"
  | "erbrecht";

const REGISTRY: Record<PracticeAreaId, PracticeArea> = {
  arbeitsrecht: ARBEITSRECHT,
  verkehrsrecht: VERKEHRSRECHT,
  digitales: DIGITALES,
  mietrecht: MIETRECHT,
  erbrecht: ERBRECHT,
};

export function getPracticeArea(id: string): PracticeArea | null {
  return (REGISTRY as Record<string, PracticeArea | undefined>)[id] ?? null;
}

export function listPracticeAreas(ids: readonly PracticeAreaId[]): PracticeArea[] {
  return ids.map((id) => REGISTRY[id]).filter(Boolean);
}
