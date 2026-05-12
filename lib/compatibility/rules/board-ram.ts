import type { CompatibilityRule } from "@/lib/compatibility/types";
import { createIssue, evidence } from "@/lib/compatibility/rules/shared";

export const boardRamRule: CompatibilityRule = {
  id: "board-ram",
  run: ({ selected }) => {
    const motherboard = selected.motherboard;
    const ram = selected.ram;

    if (motherboard?.specs.kind !== "motherboard" || ram?.specs.kind !== "ram") return [];
    if (!motherboard.specs.ramType || !ram.specs.type) {
      return [
        createIssue({
          code: "RAM_TYPE_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "메인보드 또는 RAM의 DDR 타입 정보를 확인하지 못했습니다.",
          userAction: "구매 전 DDR4/DDR5 타입이 같은지 확인하세요.",
          targetParts: ["motherboard", "ram"],
          targetPartIds: [motherboard.id, ram.id],
          evidence: [
            evidence("normalized-db", "motherboard.ramType", motherboard.specs.ramType, motherboard.specs.ramType ? "high" : "low"),
            evidence("normalized-db", "ram.type", ram.specs.type, ram.specs.type ? "high" : "low"),
          ],
        }),
      ];
    }
    if (motherboard.specs.ramType === ram.specs.type) return [];

    return [
      createIssue({
        code: "RAM_TYPE_MISMATCH",
        status: "blocked",
        severity: "critical",
        message: "메인보드와 RAM 타입이 맞지 않습니다.",
        userAction: "DDR4/DDR5 타입이 같은 메인보드와 RAM을 선택하세요.",
        targetParts: ["motherboard", "ram"],
        targetPartIds: [motherboard.id, ram.id],
        evidence: [
          evidence("normalized-db", "motherboard.ramType", motherboard.specs.ramType, "high"),
          evidence("normalized-db", "ram.type", ram.specs.type, "high"),
        ],
      }),
    ];
  },
};
