import type { CompatibilityRule } from "@/lib/compatibility/types";
import { createIssue, evidence } from "@/lib/compatibility/rules/shared";

export const cpuBoardRule: CompatibilityRule = {
  id: "cpu-board",
  run: ({ selected }) => {
    const cpu = selected.cpu;
    const motherboard = selected.motherboard;

    if (cpu?.specs.kind !== "cpu" || motherboard?.specs.kind !== "motherboard") return [];

    if (!cpu.specs.socket || !motherboard.specs.socket) {
      return [
        createIssue({
          code: "CPU_BOARD_SOCKET_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "CPU 또는 메인보드 소켓 정보를 확인하지 못했습니다.",
          userAction: "구매 전 CPU 소켓과 메인보드 소켓이 같은지 확인하세요.",
          targetParts: ["cpu", "motherboard"],
          targetPartIds: [cpu.id, motherboard.id],
          evidence: [
            evidence("normalized-db", "cpu.socket", cpu.specs.socket, cpu.specs.socket ? "high" : "low"),
            evidence("normalized-db", "motherboard.socket", motherboard.specs.socket, motherboard.specs.socket ? "high" : "low"),
          ],
        }),
      ];
    }

    if (cpu.specs.socket !== motherboard.specs.socket) {
      return [
        createIssue({
          code: "CPU_BOARD_SOCKET_MISMATCH",
          status: "blocked",
          severity: "critical",
          message: "CPU와 메인보드 소켓이 맞지 않습니다.",
          userAction: "같은 소켓의 CPU와 메인보드로 다시 선택하세요.",
          targetParts: ["cpu", "motherboard"],
          targetPartIds: [cpu.id, motherboard.id],
          evidence: [
            evidence("normalized-db", "cpu.socket", cpu.specs.socket, "high"),
            evidence("normalized-db", "motherboard.socket", motherboard.specs.socket, "high"),
          ],
        }),
      ];
    }

    const issues = [];
    const cpuSeries = cpu.specs.series;
    const supportedCpuSeries = motherboard.specs.supportedCpuSeries;

    if (cpuSeries && supportedCpuSeries?.length && !supportedCpuSeries.includes(cpuSeries)) {
      issues.push(
        createIssue({
          code: "CPU_BOARD_GENERATION_UNSUPPORTED",
          status: "blocked",
          severity: "critical",
          message: "CPU 세대가 메인보드 지원 CPU 목록과 맞지 않습니다.",
          userAction: "해당 CPU 세대를 지원하는 칩셋/메인보드로 다시 선택하세요.",
          targetParts: ["cpu", "motherboard"],
          targetPartIds: [cpu.id, motherboard.id],
          evidence: [
            evidence("normalized-db", "cpu.series", cpuSeries, "high"),
            evidence("normalized-db", "motherboard.supportedCpuSeries", supportedCpuSeries, "medium"),
            evidence("normalized-db", "motherboard.chipset", motherboard.specs.chipset, "medium"),
          ],
        })
      );
    }

    const biosNotes = motherboard.specs.biosSupportNotes ?? [];
    const matchingBiosNote = cpuSeries ? biosNotes.find((note) => note.includes(cpuSeries.replace(/^(Ryzen|Intel)\s*/, "")) || note.includes(cpuSeries)) : undefined;

    if (matchingBiosNote) {
      issues.push(
        createIssue({
          code: "CPU_BOARD_BIOS_NEEDS_CHECK",
          status: "needs-check",
          severity: "warning",
          message: "CPU 세대는 지원 범위에 있지만 출고 BIOS 버전 확인이 필요합니다.",
          userAction: "구매 전 판매처에 해당 CPU 지원 BIOS로 출고되는지 확인하세요.",
          targetParts: ["cpu", "motherboard"],
          targetPartIds: [cpu.id, motherboard.id],
          evidence: [
            evidence("normalized-db", "cpu.series", cpuSeries, "high"),
            evidence("normalized-db", "motherboard.biosSupportNotes", biosNotes, "medium"),
          ],
        })
      );
    } else if (!cpuSeries || !supportedCpuSeries?.length) {
      issues.push(
        createIssue({
          code: "CPU_BOARD_BIOS_UNKNOWN",
          status: "needs-check",
          severity: "warning",
          message: "CPU와 메인보드 소켓은 맞지만 BIOS/세대 지원 여부는 확정하지 못했습니다.",
          userAction: "구매 전 판매처 또는 제조사 CPU support list에서 해당 CPU 지원 BIOS 출고 여부를 확인하세요.",
          targetParts: ["cpu", "motherboard"],
          targetPartIds: [cpu.id, motherboard.id],
          evidence: [
            evidence("normalized-db", "cpu.series", cpuSeries, cpuSeries ? "high" : "low"),
            evidence("normalized-db", "motherboard.supportedCpuSeries", supportedCpuSeries, supportedCpuSeries?.length ? "medium" : "low"),
            evidence("normalized-db", "motherboard.chipset", motherboard.specs.chipset, "medium"),
          ],
        })
      );
    }

    return issues;
  },
};
