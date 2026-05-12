import type { Confidence } from "@/types/build";
import type { BuildMode } from "@/types/build";
import type { Part, PartCategory } from "@/types/parts";

export type CompatibilityStatus = "compatible" | "blocked" | "needs-check";
export type CompatibilitySeverity = "critical" | "warning" | "info";

export type CompatibilitySource =
  | "danawa-list-spec"
  | "danawa-detail-spec"
  | "normalized-db"
  | "user-input"
  | "inferred"
  | "unknown";

export type CompatibilityEvidence = {
  source: CompatibilitySource;
  field: string;
  value?: string | number | boolean | string[] | number[];
  confidence: Confidence;
  note?: string;
};

export type CompatibilityIssue = {
  code: string;
  status: CompatibilityStatus;
  severity: CompatibilitySeverity;
  message: string;
  userAction: string;
  targetParts: PartCategory[];
  targetPartIds?: string[];
  evidence: CompatibilityEvidence[];
};

export type CompatibilityResult = {
  status: CompatibilityStatus;
  canRecommend: boolean;
  canPurchase: boolean;
  canExport: boolean;
  issues: CompatibilityIssue[];
  summary: {
    critical: number;
    warning: number;
    info: number;
    needsCheck: number;
  };
};

export type SelectedParts = Partial<Record<PartCategory, Part>>;

export type CompatibilityContext = {
  selected: SelectedParts;
  candidate?: Part;
  mode?: BuildMode;
};

export type CompatibilityRule = {
  id: string;
  run: (context: CompatibilityContext) => CompatibilityIssue[];
};

export function summarizeCompatibility(issues: CompatibilityIssue[]): CompatibilityResult {
  const hasCritical = issues.some((issue) => issue.severity === "critical");
  const hasNeedsCheck = issues.some((issue) => issue.status === "needs-check");
  const status: CompatibilityStatus = hasCritical ? "blocked" : hasNeedsCheck ? "needs-check" : "compatible";

  return {
    status,
    canRecommend: !hasCritical,
    canPurchase: !hasCritical && !hasNeedsCheck,
    canExport: !hasCritical,
    issues,
    summary: {
      critical: issues.filter((issue) => issue.severity === "critical").length,
      warning: issues.filter((issue) => issue.severity === "warning").length,
      info: issues.filter((issue) => issue.severity === "info").length,
      needsCheck: issues.filter((issue) => issue.status === "needs-check").length,
    },
  };
}
