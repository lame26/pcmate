import type { CompatibilityIssue, CompatibilityResult, CompatibilityStatus, SelectedParts } from "@/lib/compatibility/types";
import type { PartCategory } from "@/types/parts";

export type CompatibilityDisplayStatus = CompatibilityStatus | "not-ready";

export type CompatibilityCheckRow = {
  id: string;
  label: string;
  description: string;
  parts: PartCategory[];
  partNames: string[];
  status: CompatibilityDisplayStatus;
  message: string;
  issues: CompatibilityIssue[];
};

type CompatibilityRowDefinition = {
  id: string;
  label: string;
  description: string;
  parts: PartCategory[];
  codePrefixes: string[];
};

const compatibilityRows: CompatibilityRowDefinition[] = [
  {
    id: "cpu-board",
    label: "CPU - 메인보드",
    description: "소켓, CPU 세대 지원, BIOS 출고 조건",
    parts: ["cpu", "motherboard"],
    codePrefixes: ["CPU_BOARD_"],
  },
  {
    id: "board-ram",
    label: "메인보드 - RAM",
    description: "DDR4/DDR5 메모리 타입",
    parts: ["motherboard", "ram"],
    codePrefixes: ["RAM_TYPE_"],
  },
  {
    id: "board-case",
    label: "메인보드 - 케이스",
    description: "메인보드 폼팩터와 케이스 지원 규격",
    parts: ["motherboard", "case"],
    codePrefixes: ["CASE_BOARD_"],
  },
  {
    id: "gpu-case",
    label: "GPU - 케이스",
    description: "그래픽카드 길이, 두께, 확장 슬롯 여유",
    parts: ["gpu", "case"],
    codePrefixes: ["GPU_"],
  },
  {
    id: "cooler-case",
    label: "쿨러 - 케이스",
    description: "공랭 높이 또는 수랭 라디에이터 장착 조건",
    parts: ["cooler", "case"],
    codePrefixes: ["COOLER_CASE_", "COOLER_HEIGHT_", "AIO_CASE_"],
  },
  {
    id: "cooler-cpu",
    label: "쿨러 - CPU",
    description: "CPU 소켓과 쿨러 지원 소켓",
    parts: ["cooler", "cpu"],
    codePrefixes: ["COOLER_SOCKET_"],
  },
  {
    id: "psu-gpu",
    label: "파워 - GPU/CPU",
    description: "권장 용량, GPU 보조전원 커넥터, 네이티브 케이블",
    parts: ["psu", "gpu"],
    codePrefixes: ["PSU_"],
  },
  {
    id: "board-ssd",
    label: "메인보드 - SSD",
    description: "M.2 슬롯 수와 SSD 폼팩터",
    parts: ["motherboard", "ssd"],
    codePrefixes: ["M2_SLOT_"],
  },
];

export function createCompatibilityCheckRows(result: CompatibilityResult, selectedParts: SelectedParts): CompatibilityCheckRow[] {
  return compatibilityRows
    .map((definition) => {
      const issues = result.issues.filter((issue) => isIssueForRow(issue, definition));
      const partNames = definition.parts.map((category) => selectedParts[category]?.name).filter((name): name is string => Boolean(name));
      const allPartsReady = definition.parts.every((category) => selectedParts[category]);
      const status = getRowStatus(issues, allPartsReady);

      return {
        id: definition.id,
        label: definition.label,
        description: definition.description,
        parts: definition.parts,
        partNames,
        status,
        message: getRowMessage(status, issues, allPartsReady),
        issues,
      };
    })
    .filter((row) => row.partNames.length > 0 || row.issues.length > 0);
}

export function compatibilityStatusLabel(status: CompatibilityDisplayStatus) {
  if (status === "blocked") return "차단";
  if (status === "needs-check") return "확인 필요";
  if (status === "compatible") return "통과";
  return "선택 후 확인";
}

export function compatibilitySeverityLabel(severity: CompatibilityIssue["severity"]) {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "warning";
  return "info";
}

export function compatibilitySourceLabel(source: CompatibilityIssue["evidence"][number]["source"]) {
  if (source === "danawa-list-spec") return "다나와 목록";
  if (source === "danawa-detail-spec") return "다나와 상세";
  if (source === "normalized-db") return "정규화 데이터";
  if (source === "user-input") return "사용자 입력";
  if (source === "inferred") return "계산값";
  return "확인 불가";
}

function isIssueForRow(issue: CompatibilityIssue, definition: CompatibilityRowDefinition) {
  if (definition.codePrefixes.some((prefix) => issue.code.startsWith(prefix))) return true;

  const issueTargets = new Set(issue.targetParts);
  return definition.parts.every((category) => issueTargets.has(category));
}

function getRowStatus(issues: CompatibilityIssue[], allPartsReady: boolean): CompatibilityDisplayStatus {
  if (issues.some((issue) => issue.severity === "critical" || issue.status === "blocked")) return "blocked";
  if (issues.some((issue) => issue.status === "needs-check")) return "needs-check";
  if (allPartsReady) return "compatible";
  return "not-ready";
}

function getRowMessage(status: CompatibilityDisplayStatus, issues: CompatibilityIssue[], allPartsReady: boolean) {
  const firstIssue = issues[0];

  if (firstIssue) return firstIssue.message;
  if (status === "compatible") return "현재 보유한 스펙 데이터 기준으로 통과했습니다.";
  if (!allPartsReady) return "관련 부품을 선택하면 이 조합을 다시 확인합니다.";

  return "추가 확인 항목이 없습니다.";
}
