import type { CompatibilityRule } from "@/lib/compatibility/types";
import { createIssue, evidence } from "@/lib/compatibility/rules/shared";

export const storageRule: CompatibilityRule = {
  id: "storage",
  run: ({ selected }) => {
    const motherboard = selected.motherboard;
    const ssd = selected.ssd;

    if (motherboard?.specs.kind !== "motherboard" || ssd?.specs.kind !== "ssd") return [];
    if (ssd.specs.formFactor !== "M.2") return [];
    if (motherboard.specs.m2Slots === undefined) {
      return [
        createIssue({
          code: "M2_SLOT_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "메인보드 M.2 슬롯 수를 확인하지 못했습니다.",
          userAction: "구매 전 메인보드 M.2 슬롯 수와 SSD 장착 위치를 확인하세요.",
          targetParts: ["motherboard", "ssd"],
          targetPartIds: [motherboard.id, ssd.id],
          evidence: [evidence("normalized-db", "motherboard.m2Slots", motherboard.specs.m2Slots, "low")],
        }),
      ];
    }
    if (motherboard.specs.m2Slots > 0) return [];

    return [
      createIssue({
        code: "M2_SLOT_INSUFFICIENT",
        status: "blocked",
        severity: "critical",
        message: "메인보드에 M.2 SSD 장착 슬롯이 부족합니다.",
        userAction: "M.2 슬롯이 있는 메인보드 또는 2.5형 SATA SSD를 선택하세요.",
        targetParts: ["motherboard", "ssd"],
        targetPartIds: [motherboard.id, ssd.id],
        evidence: [
          evidence("normalized-db", "motherboard.m2Slots", motherboard.specs.m2Slots, "high"),
          evidence("normalized-db", "ssd.formFactor", ssd.specs.formFactor, "high"),
        ],
      }),
    ];
  },
};
