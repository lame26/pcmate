import { checkCompatibility } from "@/lib/compatibility/check";
import { normalizeDanawaSnapshotsToParts } from "@/lib/parts/danawa-normalizer";
import { createRecommendationCandidates, getBuilderCategories } from "@/lib/recommendation/candidates";
import type { UserProfile } from "@/types/build";
import type { RecommendationCandidate, RequirementProfile } from "@/types/diagnosis";
import type { UserPreferences } from "@/types/games";
import type { Part, PartCategory } from "@/types/parts";
import type { PriceSnapshot } from "@/types/pricing";

export type BuildAssemblyResult = {
  selectedPartIds: Partial<Record<PartCategory, string>>;
  selectedCandidates: Partial<Record<PartCategory, RecommendationCandidate>>;
  compatibility: ReturnType<typeof checkCompatibility>;
};

export function createRecommendedBuildAssembly(input: {
  parts: Part[];
  requirement: RequirementProfile;
  profile: UserProfile;
  preferences: UserPreferences;
  priceSnapshots: PriceSnapshot[];
  initialSelectedPartIds?: Partial<Record<PartCategory, string>>;
}): BuildAssemblyResult {
  const selectedPartIds: Partial<Record<PartCategory, string>> = { ...input.initialSelectedPartIds };
  const selectedCandidates: Partial<Record<PartCategory, RecommendationCandidate>> = {};

  for (const category of getBuilderCategories()) {
    if (selectedPartIds[category]) continue;

    const candidates = createRecommendationCandidates({
      category,
      parts: input.parts,
      requirement: input.requirement,
      profile: input.profile,
      preferences: input.preferences,
      selectedPartIds,
      priceSnapshots: input.priceSnapshots,
    }).filter((candidate) => !violatesHighGpuAnchor(candidate, selectedPartIds, input.parts, input.priceSnapshots));
    const picked = pickAssemblyCandidate(candidates);

    if (!picked) continue;

    selectedPartIds[category] = picked.part.id;
    selectedCandidates[category] = picked;
  }

  const allParts = mergeParts(input.parts, normalizeDanawaSnapshotsToParts(input.priceSnapshots));
  const selectedParts = Object.fromEntries(
    Object.entries(selectedPartIds)
      .map(([category, partId]) => [category, allParts.find((part) => part.id === partId)])
      .filter((entry): entry is [string, Part] => Boolean(entry[1]))
  ) as Partial<Record<PartCategory, Part>>;

  return {
    selectedPartIds,
    selectedCandidates,
    compatibility: checkCompatibility(selectedParts),
  };
}

function pickAssemblyCandidate(candidates: RecommendationCandidate[]) {
  return candidates.find((candidate) => candidate.role === "recommended") ?? candidates[0];
}

function violatesHighGpuAnchor(
  candidate: RecommendationCandidate,
  selectedPartIds: Partial<Record<PartCategory, string>>,
  seedParts: Part[],
  priceSnapshots: PriceSnapshot[]
) {
  const allParts = mergeParts(seedParts, normalizeDanawaSnapshotsToParts(priceSnapshots));
  const selectedGpu = selectedPartIds.gpu ? allParts.find((part) => part.id === selectedPartIds.gpu) : undefined;

  if (selectedGpu?.specs.kind !== "gpu" || (selectedGpu.specs.gamingTier ?? 0) < 9) return false;

  if (candidate.part.specs.kind === "case") {
    const gpuLength = selectedGpu.specs.lengthMm;
    const caseMaxLength = candidate.part.specs.maxGpuLengthMm;

    if (!gpuLength || !caseMaxLength) return true;
    return caseMaxLength < gpuLength + 20;
  }

  if (candidate.part.specs.kind === "psu") {
    const psu = candidate.part.specs;
    const needs12v2x6 = selectedGpu.specs.powerConnectors?.includes("12V2x6");

    if (!psu.wattage || psu.wattage < 850) return true;
    if (needs12v2x6 && !psu.native12v2x6 && !psu.has12v2x6 && !psu.gpuConnectors?.includes("12V2x6")) return true;
  }

  return false;
}

function mergeParts(seedParts: Part[], dynamicParts: Part[]) {
  return Array.from(new Map([...seedParts, ...dynamicParts].map((part) => [part.id, part])).values());
}
