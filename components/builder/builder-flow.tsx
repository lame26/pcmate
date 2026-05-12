"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, FileText, RefreshCw } from "lucide-react";

import { CompatibilityDetails } from "@/components/compatibility/compatibility-details";
import { PriceBreakdown } from "@/components/pricing/price-breakdown";
import { Button } from "@/components/ui/button";
import { parts } from "@/data/parts";
import { checkCompatibility, createSelectedParts } from "@/lib/compatibility/check";
import { calculateRequirementProfile } from "@/lib/diagnosis/requirements";
import { normalizeDanawaSnapshotsToParts } from "@/lib/parts/danawa-normalizer";
import { getPartSpecBadges } from "@/lib/parts/spec-display";
import { createRecommendedBuildAssembly } from "@/lib/recommendation/build-assembly";
import { canOpenSummary, getCategoryStep, getMissingRequiredCategories, getNextCategory, getPreviousCategory, requiredBuildCategories } from "@/lib/recommendation/build-progress";
import { createRecommendationCandidates, getBuilderCategories } from "@/lib/recommendation/candidates";
import { useBuildStore, useBuildStoreHasHydrated } from "@/stores/build-store";
import type { RecommendationCandidate, RequirementProfile } from "@/types/diagnosis";
import type { Confidence } from "@/types/build";
import type { Part, PartCategory } from "@/types/parts";
import type { PriceSnapshot } from "@/types/pricing";

type DanawaPriceResponse = {
  snapshot: PriceSnapshot;
  fromCache: boolean;
  cacheExpiresAt?: string;
  warnings: string[];
};

const categoryLabels: Record<PartCategory, string> = {
  cpu: "CPU",
  cooler: "쿨러",
  motherboard: "메인보드",
  ram: "RAM",
  gpu: "GPU",
  ssd: "SSD",
  psu: "파워",
  case: "케이스",
};

const roleLabels: Record<RecommendationCandidate["role"], string> = {
  budget: "절약형",
  recommended: "추천형",
  premium: "상급형",
};

export function BuilderFlow() {
  const hasHydrated = useBuildStoreHasHydrated();
  const profile = useBuildStore((state) => state.profile);
  const currentSpec = useBuildStore((state) => state.currentSpec);
  const usage = useBuildStore((state) => state.usage);
  const priceSnapshots = useBuildStore((state) => state.priceSnapshots);
  const selectedPartIds = useBuildStore((state) => state.selectedPartIds);
  const upsertPriceSnapshot = useBuildStore((state) => state.upsertPriceSnapshot);
  const selectPart = useBuildStore((state) => state.selectPart);
  const [activeCategory, setActiveCategory] = useState<PartCategory>("cpu");
  const [assemblyMessage, setAssemblyMessage] = useState<string>();
  const [categoryLoadState, setCategoryLoadState] = useState<Partial<Record<PartCategory, "error">>>({});
  const [retryKey, setRetryKey] = useState(0);

  const requirement = useMemo(() => calculateRequirementProfile({ currentSpec, usage }), [currentSpec, usage]);
  const categories = getBuilderCategories();
  const allParts = useMemo(() => mergeParts(parts, normalizeDanawaSnapshotsToParts(priceSnapshots)), [priceSnapshots]);
  const selectedParts = useMemo(() => createSelectedParts(allParts, selectedPartIds), [allParts, selectedPartIds]);
  const missingCategories = getMissingRequiredCategories(selectedPartIds);
  const summaryReady = canOpenSummary(selectedPartIds);
  const finalCompatibility = useMemo(() => (summaryReady ? checkCompatibility(selectedParts) : undefined), [selectedParts, summaryReady]);
  const nextCategory = selectedPartIds[activeCategory] ? getNextCategory(activeCategory, selectedPartIds) : activeCategory;
  const previousCategory = getPreviousCategory(activeCategory);
  const activeStep = getCategoryStep(activeCategory);
  const progressPercent = Math.round(((requiredBuildCategories.length - missingCategories.length) / requiredBuildCategories.length) * 100);
  const rankSnapshotReady = hasCategoryRankSnapshot(activeCategory, priceSnapshots);
  const loadState = categoryLoadState[activeCategory];
  const isCandidateLoading = !rankSnapshotReady && loadState !== "error";
  const candidates = useMemo(
    () =>
      createRecommendationCandidates({
        category: activeCategory,
        parts,
        requirement,
        profile,
        preferences: usage.preferences,
        selectedPartIds,
        priceSnapshots,
      }),
    [activeCategory, requirement, profile, usage.preferences, selectedPartIds, priceSnapshots]
  );

  useEffect(() => {
    const controller = new AbortController();

    if (!hasHydrated) return;
    if (hasCategoryRankSnapshot(activeCategory, priceSnapshots)) return;

    void fetch("/api/prices/danawa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: activeCategory, limit: 30 }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as DanawaPriceResponse;

        if (!response.ok || !result.snapshot?.offers.length) throw new Error("empty ranking snapshot");

        upsertPriceSnapshot(result.snapshot);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCategoryLoadState((state) => ({ ...state, [activeCategory]: "error" }));
      });

    return () => controller.abort();
  }, [activeCategory, hasHydrated, priceSnapshots, retryKey, upsertPriceSnapshot]);

  const selectedCount = requiredBuildCategories.length - missingCategories.length;
  const selectedCategoryLabels = categories.filter((category) => selectedPartIds[category]).map((category) => categoryLabels[category]);
  const missingCategoryLabels = missingCategories.map((category) => categoryLabels[category]);

  if (!hasHydrated) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
        저장된 추천 조건을 불러오는 중입니다.
      </div>
    );
  }

  function handleAutoAssemble() {
    const assembly = createRecommendedBuildAssembly({
      parts,
      requirement,
      profile,
      preferences: usage.preferences,
      priceSnapshots,
      initialSelectedPartIds: selectedPartIds,
    });
    const assemblyMissing = getMissingRequiredCategories(assembly.selectedPartIds);

    if (assembly.compatibility.status === "blocked" || assemblyMissing.length) {
      const blocker = assembly.compatibility.issues.find((issue) => issue.severity === "critical");
      const missingText = assemblyMissing.map((category) => categoryLabels[category]).join(", ");
      setAssemblyMessage(
        blocker
          ? `조건에 맞는 안전한 조합을 찾지 못했습니다. ${blocker.message}`
          : `조건에 맞는 안전한 조합을 찾지 못했습니다. 남은 부품: ${missingText}`
      );
      return;
    }

    Object.entries(assembly.selectedPartIds).forEach(([category, partId]) => {
      if (partId) selectPart(category as PartCategory, partId);
    });
    setAssemblyMessage(`자동 추천 견적 ${Object.keys(assembly.selectedPartIds).length}개 부품을 선택했습니다.`);
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 rounded-md border bg-background p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">추천 조건</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              CPU {requirement.cpuTier}/10 · GPU {requirement.gpuTier}/10 · RAM {requirement.ramGb}GB · PSU {requirement.psuWattage}W
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
              {selectedCount}/{requiredBuildCategories.length} 선택됨
            </span>
            <Button type="button" size="sm" onClick={handleAutoAssemble}>
              안전한 추천 견적 자동 구성
            </Button>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          선택한 조건을 기준으로 호환성 blocker가 없는 조합을 자동으로 채웁니다. 실패하면 기존 선택은 유지됩니다.
        </p>
        {assemblyMessage ? <p className="text-sm text-muted-foreground">{assemblyMessage}</p> : null}
      </section>

      <section className="grid gap-3 rounded-md border bg-background p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {activeStep} / {requiredBuildCategories.length} {categoryLabels[activeCategory]} 선택
            </p>
            <h2 className="mt-1 text-base font-semibold">{categoryLabels[activeCategory]} 후보를 비교하세요</h2>
          </div>
          <div className="text-sm text-muted-foreground">진행률 {progressPercent}%</div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground transition-[width] duration-200" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="grid gap-2 text-sm leading-6 text-muted-foreground">
          <p>선택 완료: {selectedCategoryLabels.length ? selectedCategoryLabels.join(", ") : "아직 없음"}</p>
          <p>남은 부품: {missingCategoryLabels.length ? missingCategoryLabels.join(", ") : "없음"}</p>
        </div>
      </section>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="부품 선택 단계">
        {categories.map((category) => {
          const selected = Boolean(selectedPartIds[category]);

          return (
            <button
              key={category}
              type="button"
              className={`flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
                activeCategory === category ? "bg-foreground text-background" : "bg-background hover:bg-muted"
              }`}
              onClick={() => setActiveCategory(category)}
            >
              {selected ? <Check className="size-3.5" aria-hidden="true" /> : null}
              {categoryLabels[category]}
            </button>
          );
        })}
      </nav>

      <section className="grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{categoryLabels[activeCategory]} 후보</h2>
            <p className="mt-1 text-sm text-muted-foreground">{getCandidateCriteriaText(activeCategory, selectedParts, requirement)}</p>
          </div>
          {isCandidateLoading ? (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" aria-hidden="true" />
              조건에 맞는 후보를 계산하고 있습니다
            </span>
          ) : null}
        </div>
        {isCandidateLoading ? (
          <CandidateLoadingState />
        ) : loadState === "error" ? (
          <CandidateErrorState
            onRetry={() => {
              setCategoryLoadState((state) => {
                const next = { ...state };
                delete next[activeCategory];
                return next;
              });
              setRetryKey((key) => key + 1);
            }}
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-3">
            {candidates.length ? (
              candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.part.id}
                  candidate={candidate}
                  selected={selectedPartIds[activeCategory] === candidate.part.id}
                  selectedParts={selectedParts}
                  selectedCardProviderIds={profile.selectedCardProviderIds}
                  loadingPrice={!hasCategoryRankSnapshot(activeCategory, priceSnapshots)}
                  onSelect={() => selectPart(activeCategory, candidate.part.id)}
                />
              ))
            ) : (
              <div className="rounded-md border border-dashed bg-muted/20 p-5 text-sm leading-6 text-muted-foreground lg:col-span-3">
                조건에 맞는 안전한 후보를 찾지 못했습니다. 이전 단계 선택을 바꾸거나 부품 데이터를 보강해야 합니다.
              </div>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-3 rounded-md border bg-background p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold">다음 단계</h2>
            <p className="text-sm leading-6 text-muted-foreground">{getSummaryHelpText(missingCategories, finalCompatibility?.status)}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setActiveCategory(previousCategory)} disabled={activeCategory === previousCategory}>
              <ArrowLeft data-icon="inline-start" />
              이전 부품
            </Button>
            <Button type="button" onClick={() => setActiveCategory(nextCategory)} disabled={!selectedPartIds[activeCategory]}>
              {selectedPartIds[activeCategory] ? `다음: ${categoryLabels[nextCategory]} 선택` : `${categoryLabels[activeCategory]} 후보를 선택하세요`}
              <ArrowRight data-icon="inline-end" />
            </Button>
            {getSummaryButton(summaryReady, finalCompatibility?.status)}
          </div>
        </div>
        {finalCompatibility ? (
          <CompatibilityDetails
            result={finalCompatibility}
            selectedParts={selectedParts}
            title="최종 조합 호환성 상세"
            defaultOpen={finalCompatibility.status !== "compatible"}
          />
        ) : null}
      </section>
    </div>
  );
}

function getSummaryButton(summaryReady: boolean, status?: "compatible" | "blocked" | "needs-check") {
  if (!summaryReady) {
    return (
      <Button type="button" variant="outline" disabled>
        <FileText data-icon="inline-start" />
        최종 견적 보기
      </Button>
    );
  }

  if (status === "blocked") {
    return (
      <Button type="button" variant="destructive" disabled>
        <CircleAlert data-icon="inline-start" />
        호환성 문제 해결 필요
      </Button>
    );
  }

  return (
    <Button asChild variant={status === "needs-check" ? "secondary" : "default"}>
      <Link href="/summary">
        <FileText data-icon="inline-start" />
        {status === "needs-check" ? "확인 필요 항목 포함 견적 보기" : "최종 견적 보기"}
      </Link>
    </Button>
  );
}

function CandidateLoadingState() {
  return (
    <div className="grid gap-3 lg:grid-cols-3" aria-live="polite" aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="grid gap-4 rounded-md border bg-background p-4">
          <div className="grid gap-2">
            <div className="h-5 w-20 rounded-md bg-muted" />
            <div className="h-6 w-4/5 rounded-md bg-muted" />
            <div className="h-4 w-2/5 rounded-md bg-muted" />
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/20 p-3">
            {Array.from({ length: 6 }).map((__, itemIndex) => (
              <div key={itemIndex} className="h-9 rounded-md bg-muted" />
            ))}
          </div>
          <div className="h-8 w-1/2 rounded-md bg-muted" />
          <div className="grid gap-2">
            <div className="h-4 rounded-md bg-muted" />
            <div className="h-4 w-3/4 rounded-md bg-muted" />
          </div>
        </div>
      ))}
      <p className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground lg:col-span-3">
        조건에 맞는 후보를 계산하고 있습니다. 이전 후보는 새 결과가 준비될 때까지 표시하지 않습니다.
      </p>
    </div>
  );
}

function CandidateErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid gap-3 rounded-md border border-dashed bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
      <p>후보를 불러오지 못했습니다. 다시 시도해 주세요.</p>
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>
        <RefreshCw data-icon="inline-start" />
        다시 계산
      </Button>
    </div>
  );
}

function CandidateCard({
  candidate,
  selected,
  selectedParts,
  selectedCardProviderIds,
  loadingPrice,
  onSelect,
}: {
  candidate: RecommendationCandidate;
  selected: boolean;
  selectedParts: Partial<Record<PartCategory, Part>>;
  selectedCardProviderIds: string[];
  loadingPrice: boolean;
  onSelect: () => void;
}) {
  const critical = candidate.warnings.some((warning) => warning.severity === "critical");
  const compatibilityStatus = candidate.eligibility.compatibility.status;
  const candidateCompatibilityParts = { ...selectedParts, [candidate.part.category]: candidate.part };
  const compatibilityTone =
    compatibilityStatus === "blocked"
      ? "border-red-300 bg-red-50 text-red-950"
      : compatibilityStatus === "needs-check"
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : "border-emerald-300 bg-emerald-50 text-emerald-950";

  return (
    <article className={`grid gap-4 rounded-md border bg-background p-4 ${selected ? "ring-2 ring-foreground/30" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="w-fit rounded-md border px-2 py-0.5 text-xs text-muted-foreground">{roleLabels[candidate.role]}</span>
            <span className="w-fit rounded-md border px-2 py-0.5 text-xs text-muted-foreground">{candidate.meta.sourceLabel}</span>
          </div>
          <h3 className="text-base font-semibold leading-6">{candidate.part.name}</h3>
          <p className="text-sm text-muted-foreground">{candidate.part.classification.chipTier ?? candidate.part.brand}</p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-sm font-medium">{candidate.totalScore}점</span>
      </div>

      <dl className="grid grid-cols-2 gap-2 rounded-md border bg-muted/20 p-3 text-xs sm:grid-cols-3">
        <MetaItem label="pcode" value={candidate.meta.pcode ?? "없음"} />
        <MetaItem label="스펙 신뢰도" value={confidenceLabel(candidate.meta.specConfidence)} />
        <MetaItem label="가격 신뢰도" value={confidenceLabel(candidate.meta.priceConfidence)} />
        <MetaItem label="스펙 완성도" value={`${Math.round(candidate.meta.specCompleteness * 100)}%`} />
        <MetaItem label="호환성" value={compatibilityLabel(compatibilityStatus)} className={compatibilityTone} />
        {candidate.meta.danawaRank ? <MetaItem label="다나와 순위" value={`${candidate.meta.danawaRank}위`} /> : null}
      </dl>

      <div className="flex flex-wrap gap-1.5">
        {getPartSpecBadges(candidate.part).map((badge) => (
          <span key={badge} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            {badge}
          </span>
        ))}
      </div>

      <div className="grid gap-2">
        <div className="grid gap-1">
          <p className="text-xs text-muted-foreground">이 후보 반영가</p>
          <p className="text-xl font-semibold">{candidate.effectivePrice ? formatKrw(candidate.effectivePrice) : "가격 확인 필요"}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {loadingPrice
            ? "다나와 30위권 가격 조회 중"
            : candidate.bestOffer?.source.type === "danawa-ranking"
              ? "다나와 30위권 가격 반영"
              : candidate.bestOffer
                ? "붙여넣기/수동 가격 반영"
                : "30위권 가격 미확인"}
        </p>
        {candidate.bestOffer ? (
          <p className="text-xs text-muted-foreground">
            가격 매칭 상품: {candidate.bestOffer.productName}
          </p>
        ) : null}
        <PriceBreakdown offer={candidate.bestOffer} selectedCardProviderIds={selectedCardProviderIds} compact />
      </div>

      <ul className="grid gap-2 text-sm leading-5 text-muted-foreground">
        {candidate.reasons.slice(0, 3).map((reason) => (
          <li key={reason}>- {reason}</li>
        ))}
      </ul>

      {candidate.meta.sourceKind === "danawa-ranking" && candidate.meta.specConfidence !== "high" ? (
        <p className="rounded-md bg-muted/30 p-3 text-sm leading-5 text-muted-foreground">
          스펙 일부는 목록 정보 기반이라 구매 전 확인이 필요합니다.
        </p>
      ) : null}

      <CompatibilityDetails
        result={candidate.eligibility.compatibility}
        selectedParts={candidateCompatibilityParts}
        title="후보 호환성 상세"
        compact
      />

      <Button type="button" onClick={onSelect} disabled={critical} variant={selected ? "secondary" : "default"}>
        {selected ? "선택됨" : critical ? "제외됨" : compatibilityStatus === "needs-check" ? "확인 후 선택" : "이 후보 선택"}
      </Button>
    </article>
  );
}

function MetaItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`min-w-0 rounded-md px-2 py-1.5 ${className ?? "bg-background"}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-medium">{value}</dd>
    </div>
  );
}

function confidenceLabel(confidence: Confidence) {
  if (confidence === "high") return "높음";
  if (confidence === "medium") return "보통";
  return "낮음";
}

function compatibilityLabel(status: RecommendationCandidate["eligibility"]["compatibility"]["status"]) {
  if (status === "blocked") return "제외됨";
  if (status === "needs-check") return "확인 필요";
  return "통과";
}

function hasCategoryRankSnapshot(category: PartCategory, snapshots: PriceSnapshot[]) {
  return snapshots.some(
    (snapshot) =>
      snapshot.category === category &&
      snapshot.source.type === "danawa-ranking" &&
      snapshot.source.name === "Danawa category ranking" &&
      !snapshot.pcode &&
      snapshot.searchQuery?.includes("rank top") &&
      snapshot.offers.length > 0
  );
}

function getCandidateCriteriaText(
  category: PartCategory,
  selectedParts: Partial<Record<PartCategory, Part>>,
  requirement: RequirementProfile
) {
  if (category === "cpu") return `CPU 후보 - 목표 CPU ${requirement.cpuTier}/10 기준`;
  if (category === "gpu") return `그래픽카드 후보 - 목표 GPU ${requirement.gpuTier}/10, VRAM ${requirement.vramGb}GB 기준`;
  if (category === "ssd") return "SSD 후보 - 용량, 인터페이스, 가격 신뢰도 기준";

  if (category === "motherboard") {
    const cpu = selectedParts.cpu?.specs;
    return cpu?.kind === "cpu" && cpu.socket ? `메인보드 후보 - 선택한 CPU의 ${cpu.socket} 소켓 기준` : "메인보드 후보 - CPU 소켓과 메모리 규격 기준";
  }

  if (category === "ram") {
    const motherboard = selectedParts.motherboard?.specs;
    return motherboard?.kind === "motherboard" && motherboard.ramType ? `RAM 후보 - 선택한 메인보드의 ${motherboard.ramType} 기준` : `RAM 후보 - 목표 ${requirement.ramGb}GB 기준`;
  }

  if (category === "cooler") {
    const cpu = selectedParts.cpu?.specs;
    return cpu?.kind === "cpu" && cpu.socket ? `쿨러 후보 - 선택한 CPU의 ${cpu.socket} 소켓 기준` : "쿨러 후보 - CPU 소켓과 케이스 장착 여유 기준";
  }

  if (category === "psu") {
    const gpu = selectedParts.gpu?.specs;
    if (gpu?.kind === "gpu" && gpu.recommendedPsuW) return `파워 후보 - 선택한 GPU 권장 ${gpu.recommendedPsuW}W와 전원 커넥터 기준`;
    return `파워 후보 - 전체 권장 ${requirement.psuWattage}W 기준`;
  }

  const board = selectedParts.motherboard?.specs;
  const gpu = selectedParts.gpu?.specs;
  const cooler = selectedParts.cooler?.specs;
  const criteria = [
    board?.kind === "motherboard" && board.formFactor ? board.formFactor : undefined,
    gpu?.kind === "gpu" && gpu.lengthMm ? `GPU ${gpu.lengthMm}mm` : undefined,
    cooler?.kind === "cooler" && cooler.radiatorSizeMm ? `${cooler.radiatorSizeMm}mm 라디` : undefined,
  ].filter(Boolean);

  return criteria.length ? `케이스 후보 - ${criteria.join(", ")} 기준` : "케이스 후보 - 보드 규격, GPU 길이, 쿨러 장착 여유 기준";
}

function getSummaryHelpText(missingCategories: PartCategory[], status?: "compatible" | "blocked" | "needs-check") {
  if (missingCategories.length) {
    return `아직 선택하지 않은 부품이 있습니다: ${missingCategories.map((category) => categoryLabels[category]).join(", ")}`;
  }

  if (status === "blocked") return "필수 부품은 모두 선택됐지만 호환성 blocker가 있어 최종 견적 진입 전 해결이 필요합니다.";
  if (status === "needs-check") return "필수 부품은 모두 선택됐고, 확인 필요 항목을 포함한 최종 견적을 볼 수 있습니다.";
  return "필수 부품이 모두 선택되어 최종 견적을 볼 수 있습니다.";
}

function mergeParts(seedParts: Part[], dynamicParts: Part[]) {
  return Array.from(new Map([...seedParts, ...dynamicParts].map((part) => [part.id, part])).values());
}

function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}
