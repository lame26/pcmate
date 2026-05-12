import type { CompatibilityRule } from "@/lib/compatibility/types";
import { calculateRecommendedPsuW, createIssue, evidence, hasGpuConnector } from "@/lib/compatibility/rules/shared";

export const psuRule: CompatibilityRule = {
  id: "psu",
  run: ({ selected }) => {
    const psu = selected.psu;
    const gpu = selected.gpu;
    const cpu = selected.cpu;

    if (psu?.specs.kind !== "psu") return [];

    const issues = [];
    const psuSpecs = psu.specs;
    const recommendedWattage = calculateRecommendedPsuW(cpu, gpu);

    if (recommendedWattage && !psuSpecs.wattage) {
      issues.push(
        createIssue({
          code: "PSU_WATTAGE_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "파워 용량 정보를 확인하지 못했습니다.",
          userAction: "구매 전 파워 정격 출력을 확인하세요.",
          targetParts: ["psu"],
          targetPartIds: [psu.id],
          evidence: [evidence("normalized-db", "psu.wattage", psuSpecs.wattage, "low")],
        })
      );
    } else if (recommendedWattage && psuSpecs.wattage && psuSpecs.wattage < recommendedWattage) {
      issues.push(
        createIssue({
          code: "PSU_WATTAGE_LOW",
          status: "blocked",
          severity: "critical",
          message: "파워 용량이 CPU/GPU 기준 권장 용량보다 낮습니다.",
          userAction: "권장 용량 이상의 파워를 선택하세요.",
          targetParts: ["psu", "cpu", "gpu"],
          targetPartIds: [psu.id, cpu?.id, gpu?.id].filter(Boolean) as string[],
          evidence: [
            evidence("normalized-db", "psu.wattage", psuSpecs.wattage, "high"),
            evidence("inferred", "calculatedRecommendedW", recommendedWattage, "medium"),
          ],
        })
      );
    }

    if (gpu?.specs.kind === "gpu") {
      if (!gpu.specs.powerConnectors?.length || !psuSpecs.gpuConnectors?.length) {
        issues.push(
          createIssue({
            code: "PSU_GPU_CONNECTOR_UNKNOWN",
            status: "needs-check",
            severity: "warning",
            message: "GPU 또는 파워의 보조전원 커넥터 정보를 확인하지 못했습니다.",
            userAction: "구매 전 GPU 전원 포트와 파워 케이블 구성을 확인하세요.",
            targetParts: ["psu", "gpu"],
            targetPartIds: [psu.id, gpu.id],
            evidence: [
              evidence("normalized-db", "psu.gpuConnectors", psuSpecs.gpuConnectors, psuSpecs.gpuConnectors?.length ? "high" : "low"),
              evidence("normalized-db", "gpu.powerConnectors", gpu.specs.powerConnectors, gpu.specs.powerConnectors?.length ? "high" : "low"),
            ],
          })
        );
        return issues;
      }

      const missingConnector = gpu.specs.powerConnectors.some((connector) => !hasGpuConnector(psuSpecs.gpuConnectors!, connector));

      if (missingConnector) {
        issues.push(
          createIssue({
            code: "PSU_GPU_CONNECTOR_MISSING",
            status: "blocked",
            severity: "critical",
            message: "파워가 GPU 필수 보조전원 커넥터를 제공하지 못합니다.",
            userAction: "GPU 전원 커넥터를 네이티브로 지원하는 파워를 선택하세요.",
            targetParts: ["psu", "gpu"],
            targetPartIds: [psu.id, gpu.id],
            evidence: [
              evidence("normalized-db", "psu.gpuConnectors", psuSpecs.gpuConnectors, "high"),
              evidence("normalized-db", "gpu.powerConnectors", gpu.specs.powerConnectors, "high"),
            ],
          })
        );
      }

      if (gpu.specs.powerConnectors.includes("12V2x6") && !psuSpecs.gpuConnectors.includes("12V2x6")) {
        issues.push(
          createIssue({
            code: "PSU_NATIVE_CABLE_UNKNOWN",
            status: "needs-check",
            severity: "warning",
            message: "12V-2x6 네이티브 케이블 여부를 확정하지 못했습니다.",
            userAction: "RTX 5070급 이상은 ATX 3.1 및 네이티브 12V-2x6 케이블 제공 여부를 확인하세요.",
            targetParts: ["psu", "gpu"],
            targetPartIds: [psu.id, gpu.id],
            evidence: [
              evidence("normalized-db", "psu.gpuConnectors", psuSpecs.gpuConnectors, "medium"),
              evidence("normalized-db", "psu.atxVersion", psuSpecs.atxVersion ?? "unknown", "medium"),
            ],
          })
        );
      }
    }

    return issues;
  },
};
