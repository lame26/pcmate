import type { CompatibilityIssue, CompatibilityRule } from "@/lib/compatibility/types";
import { createIssue, evidence } from "@/lib/compatibility/rules/shared";

export const coolerRule: CompatibilityRule = {
  id: "cooler",
  run: ({ selected }) => [...checkCoolerCase(selected), ...checkCoolerCpu(selected)],
};

function checkCoolerCase(selected: Parameters<CompatibilityRule["run"]>[0]["selected"]): CompatibilityIssue[] {
  const cooler = selected.cooler;
  const pcCase = selected.case;

  if (cooler?.specs.kind !== "cooler" || pcCase?.specs.kind !== "case") return [];

  if (cooler.specs.type === "air") {
    if (cooler.specs.heightMm && pcCase.specs.maxCoolerHeightMm && cooler.specs.heightMm > pcCase.specs.maxCoolerHeightMm) {
      return [
        createIssue({
          code: "COOLER_CASE_HEIGHT_EXCEEDED",
          status: "blocked",
          severity: "critical",
          message: "공랭 쿨러 높이가 케이스 허용 높이를 초과합니다.",
          userAction: "더 낮은 공랭 쿨러 또는 CPU 쿨러 허용 높이가 더 큰 케이스를 선택하세요.",
          targetParts: ["cooler", "case"],
          targetPartIds: [cooler.id, pcCase.id],
          evidence: [
            evidence("normalized-db", "cooler.heightMm", cooler.specs.heightMm, "high"),
            evidence("normalized-db", "case.maxCoolerHeightMm", pcCase.specs.maxCoolerHeightMm, "high"),
          ],
        }),
      ];
    }

    if (!cooler.specs.heightMm || !pcCase.specs.maxCoolerHeightMm) {
      return [
        createIssue({
          code: "COOLER_HEIGHT_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "공랭 쿨러 높이 또는 케이스 허용 높이 정보가 부족합니다.",
          userAction: "구매 전 쿨러 높이와 케이스 CPU 쿨러 허용 높이를 확인하세요.",
          targetParts: ["cooler", "case"],
          targetPartIds: [cooler.id, pcCase.id],
          evidence: [
            evidence("normalized-db", "cooler.heightMm", cooler.specs.heightMm, cooler.specs.heightMm ? "high" : "low"),
            evidence("normalized-db", "case.maxCoolerHeightMm", pcCase.specs.maxCoolerHeightMm, pcCase.specs.maxCoolerHeightMm ? "high" : "low"),
          ],
        }),
      ];
    }
  }

  if (cooler.specs.type === "liquid" && cooler.specs.radiatorSizeMm) {
    const radiatorSizeMm = cooler.specs.radiatorSizeMm;
    const supportedRadiators = [pcCase.specs.topRadiatorMm, pcCase.specs.frontRadiatorMm].filter((size): size is number => Boolean(size));

    if (!supportedRadiators.length) {
      return [
        createIssue({
          code: "AIO_CASE_RADIATOR_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "케이스 라디에이터 장착 지원 정보를 확인하지 못했습니다.",
          userAction: "구매 전 케이스의 상단/전면 라디에이터 지원 크기를 확인하세요.",
          targetParts: ["cooler", "case"],
          targetPartIds: [cooler.id, pcCase.id],
          evidence: [evidence("unknown", "case.radiatorSupport", undefined, "low")],
        }),
      ];
    }

    if (!supportedRadiators.some((size) => size >= radiatorSizeMm)) {
      return [
        createIssue({
          code: "AIO_CASE_RADIATOR_UNSUPPORTED",
          status: "blocked",
          severity: "critical",
          message: "수랭 라디에이터 크기가 케이스 지원 크기를 초과합니다.",
          userAction: "더 작은 라디에이터 쿨러 또는 더 큰 라디에이터를 지원하는 케이스를 선택하세요.",
          targetParts: ["cooler", "case"],
          targetPartIds: [cooler.id, pcCase.id],
          evidence: [
            evidence("normalized-db", "cooler.radiatorSizeMm", radiatorSizeMm, "high"),
            evidence("normalized-db", "case.radiatorSupport", supportedRadiators, "medium"),
          ],
        }),
      ];
    }
  }

  return [];
}

function checkCoolerCpu(selected: Parameters<CompatibilityRule["run"]>[0]["selected"]): CompatibilityIssue[] {
  const cooler = selected.cooler;
  const cpu = selected.cpu;

  if (cooler?.specs.kind !== "cooler" || cpu?.specs.kind !== "cpu") return [];
  if (!cooler.specs.supportedSockets?.length || !cpu.specs.socket) {
    return [
      createIssue({
        code: "COOLER_SOCKET_UNKNOWN",
        status: "needs-check",
        severity: "warning",
        message: "쿨러 지원 소켓 또는 CPU 소켓 정보를 확인하지 못했습니다.",
        userAction: "구매 전 쿨러가 CPU 소켓을 지원하는지 확인하세요.",
        targetParts: ["cooler", "cpu"],
        targetPartIds: [cooler.id, cpu.id],
        evidence: [
          evidence("normalized-db", "cooler.supportedSockets", cooler.specs.supportedSockets, cooler.specs.supportedSockets?.length ? "high" : "low"),
          evidence("normalized-db", "cpu.socket", cpu.specs.socket, cpu.specs.socket ? "high" : "low"),
        ],
      }),
    ];
  }
  if (cooler.specs.supportedSockets.includes(cpu.specs.socket)) return [];

  return [
    createIssue({
      code: "COOLER_SOCKET_UNSUPPORTED",
      status: "blocked",
      severity: "critical",
      message: "CPU 쿨러가 선택한 CPU 소켓을 지원하지 않습니다.",
      userAction: "CPU 소켓을 지원하는 쿨러를 선택하세요.",
      targetParts: ["cooler", "cpu"],
      targetPartIds: [cooler.id, cpu.id],
      evidence: [
        evidence("normalized-db", "cooler.supportedSockets", cooler.specs.supportedSockets, "high"),
        evidence("normalized-db", "cpu.socket", cpu.specs.socket, "high"),
      ],
    }),
  ];
}
