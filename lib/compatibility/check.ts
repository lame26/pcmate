import type { BuildWarning } from "@/types/build";
import type { Part, PartCategory } from "@/types/parts";
import { boardCaseRule } from "@/lib/compatibility/rules/board-case";
import { boardRamRule } from "@/lib/compatibility/rules/board-ram";
import { coolerRule } from "@/lib/compatibility/rules/cooler";
import { cpuBoardRule } from "@/lib/compatibility/rules/cpu-board";
import { gpuCaseRule } from "@/lib/compatibility/rules/gpu-case";
import { psuRule } from "@/lib/compatibility/rules/psu";
import { reuseRule } from "@/lib/compatibility/rules/reuse";
import { storageRule } from "@/lib/compatibility/rules/storage";
import type { CompatibilityContext, CompatibilityIssue, CompatibilityResult, CompatibilityRule, SelectedParts } from "@/lib/compatibility/types";
import { summarizeCompatibility } from "@/lib/compatibility/types";

const rules: CompatibilityRule[] = [
  cpuBoardRule,
  boardRamRule,
  boardCaseRule,
  gpuCaseRule,
  coolerRule,
  psuRule,
  storageRule,
  reuseRule,
];

export type { CompatibilityContext, SelectedParts };

export function checkPartCompatibility(part: Part, selectedParts: SelectedParts): BuildWarning[] {
  const result = checkCompatibility({
    selected: selectedParts,
    candidate: part,
  });

  return result.issues
    .filter((issue) => !issue.targetPartIds?.length || issue.targetPartIds.includes(part.id))
    .map(issueToBuildWarning);
}

export function checkCompatibility(input: SelectedParts | CompatibilityContext): CompatibilityResult {
  const context = normalizeContext(input);
  const issues = rules.flatMap((rule) => rule.run(context));

  return summarizeCompatibility(dedupeIssues(issues));
}

export function createSelectedParts(parts: Part[], selectedPartIds: Partial<Record<PartCategory, string>>): SelectedParts {
  return Object.fromEntries(
    Object.entries(selectedPartIds).map(([category, partId]) => [category, parts.find((part) => part.id === partId)])
  ) as SelectedParts;
}

export function issueToBuildWarning(issue: CompatibilityIssue): BuildWarning {
  return {
    id: `${issue.code.toLowerCase()}-${issue.targetPartIds?.join("-") ?? issue.targetParts.join("-")}`,
    severity: issue.severity,
    code: issue.code,
    message: `${issue.message} ${issue.userAction}`.trim(),
    targetPartId: issue.targetPartIds?.[0],
  };
}

function normalizeContext(input: SelectedParts | CompatibilityContext): CompatibilityContext {
  if ("selected" in input) {
    return {
      ...input,
      selected: input.candidate ? { ...input.selected, [input.candidate.category]: input.candidate } : input.selected,
    };
  }

  return {
    selected: input,
  };
}

function dedupeIssues(issues: CompatibilityIssue[]) {
  const seen = new Set<string>();

  return issues.filter((issue) => {
    const key = `${issue.code}:${issue.targetPartIds?.join(",") ?? issue.targetParts.join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
