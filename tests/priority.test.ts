import { describe, expect, it } from "vitest";

import { getPracticeArea } from "@/lib/areas/registry";
import { emptyDraft } from "@/lib/types";

describe("scorePriority", () => {
  it.each(["arbeitsrecht", "verkehrsrecht", "digitales", "mietrecht", "erbrecht"])(
    "%s liefert gültigen Tier und numerischen Score",
    (id) => {
      const area = getPracticeArea(id)!;
      const res = area.scorePriority({
        ...emptyDraft(),
        areaId: id,
        areaLabel: area.label,
        urgency: "So schnell wie möglich",
      });
      expect(["high", "medium", "low"]).toContain(res.tier);
      expect(Number.isFinite(res.numeric)).toBe(true);
      expect(Array.isArray(res.signals)).toBe(true);
    },
  );
});
