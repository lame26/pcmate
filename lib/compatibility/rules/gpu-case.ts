import type { CompatibilityRule } from "@/lib/compatibility/types";
import { createIssue, evidence } from "@/lib/compatibility/rules/shared";

export const gpuCaseRule: CompatibilityRule = {
  id: "gpu-case",
  run: ({ selected }) => {
    const gpu = selected.gpu;
    const pcCase = selected.case;

    if (gpu?.specs.kind !== "gpu" || pcCase?.specs.kind !== "case") return [];

    const issues = [];

    if (gpu.specs.lengthMm && pcCase.specs.maxGpuLengthMm && gpu.specs.lengthMm > pcCase.specs.maxGpuLengthMm) {
      issues.push(
        createIssue({
          code: "GPU_CASE_LENGTH_EXCEEDED",
          status: "blocked",
          severity: "critical",
          message: "그래픽카드 길이가 케이스 허용 길이를 초과합니다.",
          userAction: "더 짧은 GPU 또는 GPU 장착 길이가 더 긴 케이스를 선택하세요.",
          targetParts: ["gpu", "case"],
          targetPartIds: [gpu.id, pcCase.id],
          evidence: [
            evidence("normalized-db", "gpu.lengthMm", gpu.specs.lengthMm, "high"),
            evidence("normalized-db", "case.maxGpuLengthMm", pcCase.specs.maxGpuLengthMm, "high"),
          ],
        })
      );
    } else if (!gpu.specs.lengthMm || !pcCase.specs.maxGpuLengthMm) {
      issues.push(
        createIssue({
          code: "GPU_LENGTH_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "그래픽카드 길이 또는 케이스 허용 길이 정보가 부족합니다.",
          userAction: "구매 전 GPU 길이와 케이스 VGA 장착 가능 길이를 확인하세요.",
          targetParts: ["gpu", "case"],
          targetPartIds: [gpu.id, pcCase.id],
          evidence: [
            evidence("normalized-db", "gpu.lengthMm", gpu.specs.lengthMm, gpu.specs.lengthMm ? "high" : "low"),
            evidence("normalized-db", "case.maxGpuLengthMm", pcCase.specs.maxGpuLengthMm, pcCase.specs.maxGpuLengthMm ? "high" : "low"),
          ],
        })
      );
    }

    if (gpu.specs.slotWidth && pcCase.specs.gpuSlotCount && gpu.specs.slotWidth > pcCase.specs.gpuSlotCount) {
      issues.push(
        createIssue({
          code: "GPU_CASE_SLOT_EXCEEDED",
          status: "blocked",
          severity: "critical",
          message: "그래픽카드 슬롯 두께가 케이스 확장 슬롯 여유를 초과합니다.",
          userAction: "더 얇은 GPU 또는 확장 슬롯 여유가 더 큰 케이스를 선택하세요.",
          targetParts: ["gpu", "case"],
          targetPartIds: [gpu.id, pcCase.id],
          evidence: [
            evidence("normalized-db", "gpu.slotWidth", gpu.specs.slotWidth, "high"),
            evidence("normalized-db", "case.gpuSlotCount", pcCase.specs.gpuSlotCount, "high"),
          ],
        })
      );
    } else if (!gpu.specs.thicknessMm && !gpu.specs.slotWidth) {
      issues.push(
        createIssue({
          code: "GPU_THICKNESS_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "그래픽카드 두께 정보가 없어 케이스 간섭 여부를 확정할 수 없습니다.",
          userAction: "다나와 상세 스펙 또는 제조사 페이지에서 GPU 두께, 슬롯 수, 케이블 여유를 확인하세요.",
          targetParts: ["gpu", "case"],
          targetPartIds: [gpu.id, pcCase.id],
          evidence: [evidence("unknown", "gpu.thicknessMm", gpu.specs.thicknessMm, "low"), evidence("unknown", "gpu.slotWidth", gpu.specs.slotWidth, "low")],
        })
      );
    } else if (!pcCase.specs.gpuSlotCount) {
      issues.push(
        createIssue({
          code: "CASE_GPU_SLOT_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "케이스 확장 슬롯 여유 정보가 없어 그래픽카드 두께 간섭 여부를 확정할 수 없습니다.",
          userAction: "케이스 확장 슬롯 수와 GPU 장착부 여유를 확인하세요.",
          targetParts: ["gpu", "case"],
          targetPartIds: [gpu.id, pcCase.id],
          evidence: [
            evidence("normalized-db", "gpu.thicknessMm", gpu.specs.thicknessMm, gpu.specs.thicknessMm ? "medium" : "low"),
            evidence("unknown", "case.gpuSlotCount", pcCase.specs.gpuSlotCount, "low"),
          ],
        })
      );
    }

    return issues;
  },
};
