import type { CompatibilityRule } from "@/lib/compatibility/types";
import { createIssue, evidence } from "@/lib/compatibility/rules/shared";

export const boardCaseRule: CompatibilityRule = {
  id: "board-case",
  run: ({ selected }) => {
    const motherboard = selected.motherboard;
    const pcCase = selected.case;

    if (motherboard?.specs.kind !== "motherboard" || pcCase?.specs.kind !== "case") return [];

    if (!motherboard.specs.formFactor || !pcCase.specs.supportedFormFactors?.length) {
      return [
        createIssue({
          code: "CASE_BOARD_FORM_FACTOR_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "메인보드 폼팩터 또는 케이스의 메인보드 지원 규격을 확인하지 못했습니다.",
          userAction: "구매 전 메인보드 폼팩터와 케이스 지원 보드 규격을 확인하세요.",
          targetParts: ["case", "motherboard"],
          targetPartIds: [pcCase.id, motherboard.id],
          evidence: [
            evidence("normalized-db", "motherboard.formFactor", motherboard.specs.formFactor, motherboard.specs.formFactor ? "high" : "low"),
            evidence("normalized-db", "case.supportedFormFactors", pcCase.specs.supportedFormFactors, pcCase.specs.supportedFormFactors?.length ? "high" : "low"),
          ],
        }),
      ];
    }

    if (pcCase.specs.supportedFormFactors.includes(motherboard.specs.formFactor)) return [];

    return [
      createIssue({
        code: "CASE_BOARD_FORM_FACTOR_MISMATCH",
        status: "blocked",
        severity: "critical",
        message: "케이스가 메인보드 폼팩터를 지원하지 않습니다.",
        userAction: "케이스 지원 보드 규격에 포함되는 메인보드를 선택하거나 더 큰 케이스를 선택하세요.",
        targetParts: ["case", "motherboard"],
        targetPartIds: [pcCase.id, motherboard.id],
        evidence: [
          evidence("normalized-db", "motherboard.formFactor", motherboard.specs.formFactor, "high"),
          evidence("normalized-db", "case.supportedFormFactors", pcCase.specs.supportedFormFactors, "high"),
        ],
      }),
    ];
  },
};
