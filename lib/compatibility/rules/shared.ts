import type { CompatibilityEvidence, CompatibilityIssue } from "@/lib/compatibility/types";
import type { Part } from "@/types/parts";

export function createIssue(issue: CompatibilityIssue): CompatibilityIssue {
  return issue;
}

export function evidence(
  source: CompatibilityEvidence["source"],
  field: string,
  value: CompatibilityEvidence["value"],
  confidence: CompatibilityEvidence["confidence"],
  note?: string
): CompatibilityEvidence {
  return {
    source,
    field,
    value,
    confidence,
    note,
  };
}

export function calculateRecommendedPsuW(cpu?: Part, gpu?: Part) {
  const cpuPower = cpu?.specs.kind === "cpu" ? (cpu.specs.tdpW ?? 0) : 0;
  const gpuRecommended = gpu?.specs.kind === "gpu" ? (gpu.specs.recommendedPsuW ?? 0) : 0;

  if (!cpuPower && !gpuRecommended) return undefined;

  return Math.max(gpuRecommended, Math.ceil((cpuPower + gpuRecommended * 0.55 + 120) / 50) * 50);
}

export function hasGpuConnector(psuConnectors: string[], requiredConnector: string) {
  if (psuConnectors.includes(requiredConnector)) return true;
  if (requiredConnector === "12V2x6") return psuConnectors.includes("12VHPWR");
  return false;
}
