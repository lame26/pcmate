import { scoreRules } from "@/data/score-rules";
import { checkCompatibility, createSelectedParts, issueToBuildWarning } from "@/lib/compatibility/check";
import { normalizeDanawaSnapshotsToParts } from "@/lib/parts/danawa-normalizer";
import { getOfferMatchDiagnostics, isStrictSameProductOffer } from "@/lib/pricing/offer-match";
import { isPriceSaneForRecommendation } from "@/lib/pricing/price-sanity";
import type { BuildWarning, Confidence, UserProfile } from "@/types/build";
import type { RecommendationCandidate, RecommendationCandidateMeta, RecommendationScores, RequirementProfile } from "@/types/diagnosis";
import type { UserPreferences } from "@/types/games";
import type { Part, PartCategory, PartLineTier } from "@/types/parts";
import type { PriceOffer, PriceSnapshot } from "@/types/pricing";

type CandidateInput = {
  category: PartCategory;
  parts: Part[];
  requirement: RequirementProfile;
  profile: UserProfile;
  preferences: UserPreferences;
  selectedPartIds: Partial<Record<PartCategory, string>>;
  priceSnapshots: PriceSnapshot[];
};

const categoryOrder: PartCategory[] = ["cpu", "cooler", "motherboard", "ram", "gpu", "ssd", "psu", "case"];

const lineTierScore: Record<PartLineTier, number> = {
  entry: 58,
  mainstream: 72,
  "upper-mainstream": 84,
  high: 92,
  flagship: 96,
};

export function createRecommendationCandidates(input: CandidateInput): RecommendationCandidate[] {
  const dynamicParts = normalizeDanawaSnapshotsToParts(input.priceSnapshots);
  const allParts = mergeParts(input.parts, dynamicParts);
  const selectedParts = createSelectedParts(allParts, input.selectedPartIds);
  const categoryParts = allParts.filter((part) => part.category === input.category).filter(isCandidatePoolEligible);
  const scored = categoryParts.map((part) => {
    const bestOffer = findBestOffer(part, input.priceSnapshots, input.profile.selectedCardProviderIds);
    const offerMatch = bestOffer ? getOfferMatchDiagnostics(part, bestOffer) : undefined;
    const effectivePrice = bestOffer ? getOfferPrice(bestOffer, input.profile.selectedCardProviderIds) : undefined;
    const meta = createCandidateMeta(part, bestOffer);
    const compatibility = checkCompatibility({
      selected: selectedParts,
      candidate: part,
      mode: input.profile.buildMode,
    });
    const warnings = compatibility.issues.map(issueToBuildWarning);
    const scores = createScores(part, input.requirement, input.preferences, warnings, meta, effectivePrice);
    const weightedScore =
      scores.performanceFitScore * scoreRules.recommendationWeights.performanceFitScore +
      scores.priceScore * scoreRules.recommendationWeights.priceScore +
      scores.compatibilityScore * scoreRules.recommendationWeights.compatibilityScore +
      scores.preferenceScore * scoreRules.recommendationWeights.preferenceScore +
      scores.classificationScore * scoreRules.recommendationWeights.classificationScore;
    const confidenceAdjustment = (scores.specConfidenceScore - 70) * 0.08 + (scores.priceConfidenceScore - 70) * 0.06;
    const priceAvailabilityAdjustment = effectivePrice ? 0 : -14;
    const totalScore = Math.round(Math.max(0, Math.min(100, weightedScore + confidenceAdjustment + priceAvailabilityAdjustment)));

    return {
      id: `${part.id}-candidate`,
      category: part.category,
      part,
      role: "recommended" as RecommendationCandidate["role"],
      bestOffer,
      offerMatch,
      effectivePrice,
      scores,
      totalScore,
      meta,
      display: {
        name: part.name,
        priceSourceName: bestOffer?.productName,
        sourceLabel: meta.sourceLabel,
      },
      eligibility: {
        eligible: compatibility.canRecommend,
        compatibility,
      },
      reasons: createReasons(part, input.requirement, scores, effectivePrice),
      warnings,
    };
  });

  return assignRoles(scored, input, selectedParts);
}

export function getBuilderCategories() {
  return categoryOrder;
}

function mergeParts(seedParts: Part[], dynamicParts: Part[]) {
  return Array.from(new Map([...seedParts, ...dynamicParts].map((part) => [part.id, part])).values());
}

function assignRoles(
  candidates: RecommendationCandidate[],
  input: CandidateInput,
  selectedParts: Partial<Record<PartCategory, Part>>
) {
  const usable = candidates
    .filter((candidate) => candidate.eligibility.eligible)
    .sort((left, right) => right.totalScore - left.totalScore);
  const policyPool = usable.filter((candidate) => isWithinCategoryPolicy(candidate, input, selectedParts));
  const boundedPool = policyPool.length ? policyPool : usable;
  const pricedPool = boundedPool.filter((candidate) => candidate.effectivePrice !== undefined);
  const rolePool = pricedPool.length ? pricedPool : boundedPool;
  const selected = new Map<string, RecommendationCandidate>();
  const budget = pickRoleCandidate(rolePool, "budget", input, selectedParts, selected);
  if (budget) selected.set(budget.part.id, { ...budget, role: "budget" });

  const recommended = pickRoleCandidate(rolePool, "recommended", input, selectedParts, selected);
  if (recommended) selected.set(recommended.part.id, { ...recommended, role: "recommended" });

  const premium = pickRoleCandidate(rolePool, "premium", input, selectedParts, selected);
  if (premium) selected.set(premium.part.id, { ...premium, role: "premium" });

  return Array.from(selected.values()).sort((left, right) => roleSort(left.role) - roleSort(right.role));
}

function pickRoleCandidate(
  candidates: RecommendationCandidate[],
  role: RecommendationCandidate["role"],
  input: CandidateInput,
  selectedParts: Partial<Record<PartCategory, Part>>,
  selected: Map<string, RecommendationCandidate>
) {
  const available = candidates.filter((candidate) => !selected.has(candidate.part.id));
  const roleBand = available.filter((candidate) => isInRoleBand(candidate, role, input, selectedParts));
  const pool = roleBand.length ? roleBand : available;

  return pool.sort((left, right) => compareForRole(left, right, role, input, selectedParts))[0];
}

function compareForRole(
  left: RecommendationCandidate,
  right: RecommendationCandidate,
  role: RecommendationCandidate["role"],
  input: CandidateInput,
  selectedParts: Partial<Record<PartCategory, Part>>
) {
  const leftDistance = getRoleDistance(left, role, input, selectedParts);
  const rightDistance = getRoleDistance(right, role, input, selectedParts);

  if (role === "budget") {
    return (
      (left.effectivePrice ?? Infinity) - (right.effectivePrice ?? Infinity) ||
      leftDistance - rightDistance ||
      right.totalScore - left.totalScore
    );
  }

  return (
    leftDistance - rightDistance ||
    right.totalScore - left.totalScore ||
    (left.effectivePrice ?? Infinity) - (right.effectivePrice ?? Infinity)
  );
}

function isWithinCategoryPolicy(
  candidate: RecommendationCandidate,
  input: CandidateInput,
  selectedParts: Partial<Record<PartCategory, Part>>
) {
  const specs = candidate.part.specs;

  if (specs.kind === "cpu") {
    const tier = specs.gamingTier ?? getPartPerformanceTier(candidate.part);
    const minTier = input.requirement.cpuTier >= 7 ? input.requirement.cpuTier - 1 : Math.max(5, input.requirement.cpuTier);
    const maxTier = Math.min(input.requirement.cpuTier + 1, allowsHaloCpu(input) ? 10 : 9);

    if (isLegacyMainstreamCpu(candidate.part, input)) return false;
    if (isHaloCpu(candidate.part) && !allowsHaloCpu(input)) return false;
    return tier >= minTier && tier <= maxTier;
  }

  if (specs.kind === "gpu") {
    const tier = specs.gamingTier ?? getPartPerformanceTier(candidate.part);
    const minTier = Math.max(5, input.requirement.gpuTier - 1);
    const maxTier = Math.min(input.requirement.gpuTier + 1, allowsHaloGpu(input) ? 10 : 9);

    if (specs.vramGb && specs.vramGb < input.requirement.vramGb) return false;
    return tier >= minTier && tier <= maxTier;
  }

  if (specs.kind === "ssd") {
    return (specs.capacityGb ?? 0) >= getMinimumSsdCapacityGb(input);
  }

  if (specs.kind === "psu") {
    const wattage = specs.wattage ?? 0;
    const targetWattage = getTargetPsuWattage(input, selectedParts);
    const maxWattage = targetWattage >= 900 ? targetWattage + 300 : targetWattage + 250;

    if (wattage < targetWattage) return false;
    if (wattage >= 1200 && targetWattage < 1000) return false;
    return wattage <= maxWattage;
  }

  if (specs.kind === "ram") {
    const capacity = specs.totalGb ?? 0;

    if (capacity < input.requirement.ramGb) return false;
    if (capacity > input.requirement.ramGb * 2) return false;
    if (input.requirement.ramGb <= 32 && capacity > 64) return false;
    return true;
  }

  if (specs.kind === "cooler") {
    if (specs.radiatorSizeMm && specs.radiatorSizeMm >= 360 && !allowsLargeLiquidCooler(input, selectedParts)) {
      return false;
    }

    return true;
  }

  if (specs.kind === "case") {
    const targetGpuLengthMm = getTargetGpuLengthMm(input, selectedParts);

    return !targetGpuLengthMm || (specs.maxGpuLengthMm ?? 0) >= targetGpuLengthMm;
  }

  return true;
}

function isInRoleBand(
  candidate: RecommendationCandidate,
  role: RecommendationCandidate["role"],
  input: CandidateInput,
  selectedParts: Partial<Record<PartCategory, Part>>
) {
  const specs = candidate.part.specs;

  if (specs.kind === "cpu" || specs.kind === "gpu") {
    const tier = getPartPerformanceTier(candidate.part);
    const requiredTier = specs.kind === "cpu" ? input.requirement.cpuTier : input.requirement.gpuTier;

    if (role === "budget") return tier >= requiredTier - 1 && tier <= requiredTier;
    if (role === "recommended") return Math.abs(tier - requiredTier) <= 1;
    return tier > requiredTier && tier <= requiredTier + 1;
  }

  if (specs.kind === "ssd") {
    const capacity = specs.capacityGb ?? 0;
    if (role === "premium") return capacity >= 2000;
    return capacity >= getMinimumSsdCapacityGb(input) && capacity <= 1000;
  }

  if (specs.kind === "psu") {
    const wattage = specs.wattage ?? 0;
    const target = getTargetPsuWattage(input, selectedParts);
    if (role === "budget") return wattage >= target && wattage <= target + 100;
    if (role === "recommended") return wattage >= target && wattage <= target + 150;
    return wattage > target && wattage <= target + 300;
  }

  if (specs.kind === "ram") {
    if (role === "premium") return (specs.totalGb ?? 0) >= input.requirement.ramGb;
    return specs.totalGb === input.requirement.ramGb;
  }

  if (specs.kind === "cooler") {
    if (role === "premium") return allowsLargeLiquidCooler(input, selectedParts) ? true : specs.radiatorSizeMm !== 360;
    return specs.radiatorSizeMm !== 360;
  }

  return true;
}

function getRoleDistance(
  candidate: RecommendationCandidate,
  role: RecommendationCandidate["role"],
  input: CandidateInput,
  selectedParts: Partial<Record<PartCategory, Part>>
) {
  const specs = candidate.part.specs;

  if (specs.kind === "cpu" || specs.kind === "gpu") {
    const tier = getPartPerformanceTier(candidate.part);
    const requiredTier = specs.kind === "cpu" ? input.requirement.cpuTier : input.requirement.gpuTier;
    const target = role === "budget" ? requiredTier : role === "recommended" ? requiredTier : Math.min(requiredTier + 1, 10);

    return Math.abs(tier - target);
  }

  if (specs.kind === "ssd") {
    const target = role === "premium" ? 2000 : 1000;
    return Math.abs((specs.capacityGb ?? 0) - target) / 1000;
  }

  if (specs.kind === "psu") {
    const target = getTargetPsuWattage(input, selectedParts) + (role === "premium" ? 150 : 0);
    return Math.abs((specs.wattage ?? 0) - target) / 100;
  }

  if (specs.kind === "ram") {
    const target = role === "premium" && input.requirement.ramGb >= 32 ? input.requirement.ramGb * 2 : input.requirement.ramGb;
    return Math.abs((specs.totalGb ?? 0) - target) / 32;
  }

  if (specs.kind === "cooler") {
    const target = getCoolerTargetTier(input, selectedParts);
    return Math.abs(getCoolerTier(candidate.part) - target);
  }

  return Math.max(0, 100 - candidate.totalScore) / 100;
}

function isLegacyMainstreamCpu(part: Part, input: CandidateInput) {
  if (input.profile.buildMode !== "full-build" || input.requirement.cpuTier < 6 || part.specs.kind !== "cpu") return false;

  const tier = part.specs.gamingTier ?? getPartPerformanceTier(part);
  const seriesText = `${part.specs.series ?? ""} ${part.specs.generation ?? ""} ${part.name}`;

  return tier <= 6 && (part.specs.socket === "AM4" || /Ryzen\s*5000|5[0-9]{3}/i.test(seriesText));
}

function isHaloCpu(part: Part) {
  const text = `${part.name} ${part.model}`;

  return /(?:Ryzen\s*)?(?:9\s*)?(?:7950X3D|7900X3D|9950X3D|9850X3D)/i.test(text);
}

function allowsHaloCpu(input: CandidateInput) {
  return (
    input.requirement.cpuTier >= 10 ||
    input.requirement.ramGb >= 64 ||
    input.requirement.psuWattage >= 1000 ||
    hasEnthusiastBudget(input) ||
    hasEnthusiastRequirementText(input)
  );
}

function allowsHaloGpu(input: CandidateInput) {
  return (
    input.requirement.gpuTier >= 10 ||
    input.requirement.psuWattage >= 1000 ||
    hasEnthusiastBudget(input) ||
    hasEnthusiastRequirementText(input)
  );
}

function hasEnthusiastBudget(input: CandidateInput) {
  return Boolean(input.profile.budget && input.profile.budget.flexible && input.profile.budget.totalKrw >= 4000000);
}

function hasEnthusiastRequirementText(input: CandidateInput) {
  const text = [...input.requirement.reasons, ...input.requirement.warnings.map((warning) => warning.message)].join(" ");

  return /4K|UHD|UWQHD|VR|local\s*AI|AI|enthusiast|extreme|로컬\s*AI|고사양\s*AI|초고사양/i.test(text);
}

function getMinimumSsdCapacityGb(input: CandidateInput) {
  return input.profile.buildMode === "full-build" ? 1000 : 500;
}

function getTargetPsuWattage(input: CandidateInput, selectedParts: Partial<Record<PartCategory, Part>>) {
  const selectedGpu = selectedParts.gpu?.specs;
  const gpuWattage = selectedGpu?.kind === "gpu" ? selectedGpu.recommendedPsuW : undefined;

  return Math.max(input.requirement.psuWattage, gpuWattage ?? 0);
}

function getTargetGpuLengthMm(input: CandidateInput, selectedParts: Partial<Record<PartCategory, Part>>) {
  const selectedGpu = selectedParts.gpu?.specs;

  if (selectedGpu?.kind === "gpu" && selectedGpu.lengthMm) return selectedGpu.lengthMm;
  if (input.requirement.gpuTier >= 9) return 320;
  if (input.requirement.gpuTier >= 8) return 300;
  if (input.requirement.gpuTier >= 7) return 280;
  return undefined;
}

function allowsLargeLiquidCooler(input: CandidateInput, selectedParts: Partial<Record<PartCategory, Part>>) {
  const selectedCpu = selectedParts.cpu?.specs;
  const selectedCpuTier = selectedCpu?.kind === "cpu" ? selectedCpu.gamingTier ?? 0 : 0;
  const selectedCpuTdp = selectedCpu?.kind === "cpu" ? selectedCpu.tdpW ?? 0 : 0;

  return input.preferences.cooling === "liquid" || input.requirement.cpuTier >= 8 || selectedCpuTier >= 8 || selectedCpuTdp >= 120;
}

function getCoolerTargetTier(input: CandidateInput, selectedParts: Partial<Record<PartCategory, Part>>) {
  return allowsLargeLiquidCooler(input, selectedParts) ? 3 : 2;
}

function getCoolerTier(part: Part) {
  if (part.specs.kind !== "cooler") return 2;
  if (part.specs.radiatorSizeMm && part.specs.radiatorSizeMm >= 360) return 3;
  if (part.specs.coolingCapacityTier === "strong") return 3;
  if (part.specs.coolingCapacityTier === "adequate" || part.specs.type === "air") return 2;
  return 1;
}

function createScores(
  part: Part,
  requirement: RequirementProfile,
  preferences: UserPreferences,
  warnings: BuildWarning[],
  meta: RecommendationCandidateMeta,
  effectivePrice?: number
): RecommendationScores {
  const critical = warnings.some((warning) => warning.severity === "critical");
  const warningCount = warnings.length;
  const specConfidenceScore = confidenceToScore(meta.specConfidence);
  const priceConfidenceScore = confidenceToScore(meta.priceConfidence);
  const specCompletenessPenalty = Math.round((1 - meta.specCompleteness) * 18);

  return {
    performanceFitScore: createPerformanceFitScore(part, requirement),
    priceScore: effectivePrice ? Math.max(45, priceConfidenceScore - 4) : 40,
    priceConfidenceScore,
    compatibilityScore: critical ? 0 : Math.max(60, 100 - warningCount * 12),
    preferenceScore: createPreferenceScore(part, preferences),
    classificationScore: Math.max(
      35,
      lineTierScore[part.classification.brandLineTier] +
        (part.classification.confidence === "low" ? -8 : 0) -
        specCompletenessPenalty
    ),
    specConfidenceScore,
  };
}

function createCandidateMeta(part: Part, bestOffer?: PriceOffer): RecommendationCandidateMeta {
  const specCompleteness = calculateSpecCompleteness(part);
  const isDanawaRanking = part.source.type === "danawa-ranking" && part.id.startsWith(`danawa-${part.category}-`);
  const danawaRank = readNumber(bestOffer, "danawaRank") ?? readNumber(part.offers[0], "danawaRank");
  const pcode = bestOffer?.pcode ?? part.offers[0]?.pcode ?? part.aliases[0];
  const specConfidence = createSpecConfidence(part, specCompleteness.ratio);
  const priceConfidence = bestOffer?.confidence ?? "low";

  return {
    sourceKind: isDanawaRanking ? "danawa-ranking" : part.source.type === "static" ? "static" : "external",
    sourceLabel: isDanawaRanking
      ? `다나와 랭킹 ${danawaRank ?? "상위"}위 상품`
      : part.source.type === "static"
        ? "정적 추천 후보"
        : "외부/저장 후보",
    danawaRank,
    pcode,
    specConfidence,
    priceConfidence,
    specCompleteness: specCompleteness.ratio,
    missingSpecFields: specCompleteness.missingFields,
  };
}

function createSpecConfidence(part: Part, completeness: number): Confidence {
  if (part.source.type === "static") return part.confidence;
  if (part.confidence === "low" || completeness < 0.55) return "low";
  if (part.confidence === "medium" || completeness < 0.82) return "medium";
  return "high";
}

function calculateSpecCompleteness(part: Part) {
  const specs = part.specs;
  const checks: Array<[string, boolean]> =
    specs.kind === "cpu"
      ? [
          ["CPU 소켓", Boolean(specs.socket)],
          ["코어 수", Boolean(specs.cores)],
          ["스레드 수", Boolean(specs.threads)],
          ["소비전력", Boolean(specs.tdpW)],
          ["성능 티어", Boolean(specs.gamingTier)],
        ]
      : specs.kind === "gpu"
        ? [
            ["GPU 칩셋", Boolean(specs.chipset)],
            ["VRAM", Boolean(specs.vramGb)],
            ["그래픽카드 길이", Boolean(specs.lengthMm)],
            ["그래픽카드 두께", Boolean(specs.thicknessMm || specs.slotWidth)],
            ["권장 파워", Boolean(specs.recommendedPsuW)],
            ["보조전원 커넥터", Boolean(specs.powerConnectors?.length)],
          ]
        : specs.kind === "motherboard"
          ? [
              ["CPU 소켓", Boolean(specs.socket)],
              ["칩셋", Boolean(specs.chipset)],
              ["보드 규격", Boolean(specs.formFactor)],
              ["메모리 규격", Boolean(specs.ramType)],
              ["M.2 슬롯 수", Boolean(specs.m2Slots)],
            ]
          : specs.kind === "ram"
            ? [
                ["메모리 규격", Boolean(specs.type)],
                ["총 용량", Boolean(specs.totalGb)],
                ["모듈 수", Boolean(specs.moduleCount)],
                ["동작 클럭", Boolean(specs.speedMhz)],
              ]
            : specs.kind === "psu"
              ? [
                  ["정격 출력", Boolean(specs.wattage)],
                  ["효율 등급", Boolean(specs.efficiency)],
                  ["ATX 버전", Boolean(specs.atxVersion)],
                  ["GPU 커넥터", Boolean(specs.gpuConnectors?.length)],
                  ["모듈러 여부", Boolean(specs.modular)],
                ]
              : specs.kind === "case"
                ? [
                    ["지원 보드 규격", Boolean(specs.supportedFormFactors?.length)],
                    ["최대 GPU 길이", Boolean(specs.maxGpuLengthMm)],
                    ["확장 슬롯 수", Boolean(specs.gpuSlotCount)],
                    ["최대 CPU 쿨러 높이", Boolean(specs.maxCoolerHeightMm)],
                    ["라디에이터 지원", Boolean(specs.topRadiatorMm || specs.frontRadiatorMm)],
                  ]
                : specs.kind === "cooler"
                  ? [
                      ["쿨러 타입", Boolean(specs.type)],
                      ["지원 소켓", Boolean(specs.supportedSockets?.length)],
                      ["쿨러 높이/라디에이터", Boolean(specs.heightMm || specs.radiatorSizeMm)],
                    ]
                  : [
                      ["용량", Boolean(specs.capacityGb)],
                      ["인터페이스", Boolean(specs.interface)],
                      ["폼팩터", Boolean(specs.formFactor)],
                    ];
  const passed = checks.filter(([, ok]) => ok).length;

  return {
    ratio: checks.length ? passed / checks.length : 0,
    missingFields: checks.filter(([, ok]) => !ok).map(([field]) => field),
  };
}

function confidenceToScore(confidence: Confidence) {
  if (confidence === "high") return 90;
  if (confidence === "medium") return 72;
  return 50;
}

function createPerformanceFitScore(part: Part, requirement: RequirementProfile) {
  const tier = getPartPerformanceTier(part);
  const requiredTier = getRequiredTier(part.category, requirement);

  if (part.specs.kind === "ram") {
    if (!part.specs.totalGb) return 60;
    if (part.specs.totalGb < requirement.ramGb) return 45;
    if (part.specs.totalGb === requirement.ramGb) return 88;
    return 94;
  }

  if (part.specs.kind === "psu") {
    if (!part.specs.wattage) return 60;
    if (part.specs.wattage < requirement.psuWattage) return 40;
    if (part.specs.wattage <= requirement.psuWattage + 100) return 88;
    return 92;
  }

  if (part.specs.kind === "gpu" && part.specs.vramGb && part.specs.vramGb < requirement.vramGb) return 55;
  if (tier < requiredTier) return Math.max(35, 70 - (requiredTier - tier) * 18);
  if (tier === requiredTier) return 86;
  if (tier === requiredTier + 1) return 95;
  return 88;
}

function createPreferenceScore(part: Part, preferences: UserPreferences) {
  let score = 72;

  if (part.specs.kind === "gpu" && preferences.gpuVendor === "nvidia" && !part.name.toLowerCase().includes("geforce")) {
    score -= 16;
  }
  if (part.specs.kind === "cooler" && preferences.cooling !== "any") {
    score += part.specs.type === preferences.cooling ? 12 : -10;
  }
  if (part.specs.kind === "case" && preferences.color !== "any") {
    score += part.specs.color === preferences.color ? 12 : -8;
  }
  if (part.specs.kind === "case" && preferences.noise === "quiet" && part.name.toLowerCase().includes("quiet")) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function createReasons(part: Part, requirement: RequirementProfile, scores: RecommendationScores, effectivePrice?: number) {
  const reasons = [...part.classification.reasons];

  if (scores.performanceFitScore >= 85) reasons.push("현재 진단 요구치에 성능 여유가 맞는 후보입니다.");
  else reasons.push("요구치 대비 성능 여유가 적어 조건 확인이 필요합니다.");

  if (effectivePrice) reasons.push("다나와 30위권 자동 가격 조회 또는 저장된 가격 스냅샷을 반영했습니다.");
  else reasons.push("다나와 30위권 가격 데이터가 없어 붙여넣기 또는 수동 보완이 필요합니다.");

  if (part.specs.kind === "gpu") {
    reasons.push(`권장 VRAM ${requirement.vramGb}GB 기준으로 비교했습니다.`);
  }

  return Array.from(new Set(reasons));
}

function findBestOffer(part: Part, snapshots: PriceSnapshot[], selectedCardProviderIds: string[]) {
  const categoryOffers = snapshots
    .filter((snapshot) => snapshot.category === part.category || !snapshot.category)
    .flatMap((snapshot) => snapshot.offers);
  const snapshotOffers = categoryOffers
    .filter((offer) => isStrictSameProductOffer(part, offer))
    .filter((offer) => isOfferEligibleForRecommendation(offer))
    .filter((offer) => isPriceSaneForRecommendation(offer, part.category, categoryOffers));
  const offers = snapshotOffers.length
    ? snapshotOffers
    : part.offers.filter((offer) => isFallbackOfferEligibleForRecommendation(offer, part.category));

  return offers.sort((left, right) => getOfferPrice(left, selectedCardProviderIds) - getOfferPrice(right, selectedCardProviderIds))[0];
}

function getOfferPrice(offer: PriceOffer, selectedCardProviderIds: string[]) {
  const effective =
    offer.cardProviderId && selectedCardProviderIds.includes(offer.cardProviderId)
      ? offer.benefitPrice ?? offer.basePrice
      : offer.basePrice;

  return effective + (offer.shippingFee ?? 0);
}

function isOfferEligibleForRecommendation(offer: PriceOffer) {
  const riskText = [offer.productName, offer.mall, ...offer.warnings].join(" ").toLowerCase();
  const hasRiskKeyword = /중고|리퍼|전시|반품|병행|해외|품절|sold.?out|used|refurb/i.test(riskText);

  if (offer.availability === "sold-out") return false;
  if (offer.priceType === "used") return false;
  if (offer.confidence === "low") return false;
  if (hasRiskKeyword) return false;

  return true;
}

function isFallbackOfferEligibleForRecommendation(offer: PriceOffer, category: PartCategory) {
  if (offer.source.type === "static") return isSafeStaticSeedPriceFallback(offer, category);
  return isOfferEligibleForRecommendation(offer);
}

function isSafeStaticSeedPriceFallback(offer: PriceOffer, category: PartCategory) {
  return (category === "ram" || category === "ssd") && offer.basePrice > 0 && isOfferEligibleForRecommendation(offer);
}

function isCandidatePoolEligible(part: Part) {
  if (part.source.type === "static") return true;
  if (part.source.type !== "danawa-ranking") return false;

  const specs = part.specs;
  if (specs.kind === "cpu") return Boolean(specs.socket && (specs.series || specs.gamingTier));
  if (specs.kind === "motherboard") return Boolean(specs.socket && specs.formFactor && specs.ramType);
  if (specs.kind === "ram") return Boolean(specs.type && specs.totalGb);
  if (specs.kind === "gpu") return Boolean(specs.chipset && (specs.vramGb || specs.gamingTier));
  if (specs.kind === "ssd") return Boolean(specs.capacityGb && specs.interface);
  if (specs.kind === "psu") return Boolean(specs.wattage);
  if (specs.kind === "case") return Boolean(specs.supportedFormFactors?.length && specs.maxGpuLengthMm);
  if (specs.kind === "cooler") return Boolean(specs.type && specs.supportedSockets?.length && (specs.heightMm || specs.radiatorSizeMm));
  return false;
}

function getRequiredTier(category: PartCategory, requirement: RequirementProfile) {
  if (category === "cpu") return requirement.cpuTier;
  if (category === "gpu") return requirement.gpuTier;
  return 5;
}

function getPartPerformanceTier(part: Part) {
  if (part.specs.kind === "cpu") return part.specs.gamingTier ?? 5;
  if (part.specs.kind === "gpu") return part.specs.gamingTier ?? 5;
  if (part.specs.kind === "ram") return (part.specs.totalGb ?? 0) >= 64 ? 9 : (part.specs.totalGb ?? 0) >= 32 ? 7 : 5;
  if (part.specs.kind === "psu") return (part.specs.wattage ?? 0) >= 1000 ? 9 : (part.specs.wattage ?? 0) >= 850 ? 8 : 7;
  if (part.specs.kind === "ssd") return (part.specs.capacityGb ?? 0) >= 2000 ? 8 : 6;
  return lineTierScore[part.classification.brandLineTier] / 10;
}

function roleSort(role: RecommendationCandidate["role"]) {
  if (role === "budget") return 0;
  if (role === "recommended") return 1;
  return 2;
}

function readNumber(offer: PriceOffer | undefined, key: string) {
  const value = offer?.metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
