"use client";

import { useMemo, useRef, useState } from "react";
import { Clipboard, Download, TriangleAlert } from "lucide-react";
import { toPng } from "html-to-image";

import { CompatibilityDetails } from "@/components/compatibility/compatibility-details";
import { PriceBreakdown } from "@/components/pricing/price-breakdown";
import { Button } from "@/components/ui/button";
import { getPartSpecBadges } from "@/lib/parts/spec-display";
import { getMissingRequiredCategories } from "@/lib/recommendation/build-progress";
import { createFinalBuildSummary, createSummaryText, categoryLabel, formatKrw, getSummaryItemName } from "@/lib/summary/build-summary";
import { useBuildStore } from "@/stores/build-store";
import type { Part, PartCategory } from "@/types/parts";

export function SummaryView() {
  const selectedPartIds = useBuildStore((state) => state.selectedPartIds);
  const priceSnapshots = useBuildStore((state) => state.priceSnapshots);
  const selectedCardProviderIds = useBuildStore((state) => state.profile.selectedCardProviderIds);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [isSavingImage, setIsSavingImage] = useState(false);
  const summary = useMemo(
    () => createFinalBuildSummary({ selectedPartIds, priceSnapshots, selectedCardProviderIds }),
    [selectedPartIds, priceSnapshots, selectedCardProviderIds]
  );
  const selectedParts = useMemo(
    () => Object.fromEntries(summary.items.map((item) => [item.category, item.part])) as Partial<Record<PartCategory, Part>>,
    [summary.items]
  );
  const missingCategories = getMissingRequiredCategories(selectedPartIds);
  const isBlocked = summary.status === "blocked";
  const needsCheck = summary.status === "needs-check";
  const isIncomplete = missingCategories.length > 0;

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(createSummaryText(summary));
      setCopyState("done");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
    }
  }

  async function handleSaveImage() {
    if (!summaryRef.current) return;

    setIsSavingImage(true);

    try {
      const dataUrl = await toPng(summaryRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "white",
      });
      const link = document.createElement("a");
      link.download = `pc-build-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsSavingImage(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={handleCopyText} disabled={!summary.items.length || isBlocked || isIncomplete}>
          <Clipboard data-icon="inline-start" />
          {isIncomplete ? "부품 선택 후 복사 가능" : copyState === "done" ? "복사됨" : copyState === "error" ? "복사 실패" : needsCheck ? "경고 포함 텍스트 복사" : "텍스트 복사"}
        </Button>
        <Button type="button" onClick={handleSaveImage} disabled={!summary.items.length || isSavingImage || isBlocked || isIncomplete}>
          <Download data-icon="inline-start" />
          {isIncomplete ? "부품 선택 후 이미지 저장 가능" : isSavingImage ? "저장 중" : needsCheck ? "경고 포함 이미지 저장" : "이미지 저장"}
        </Button>
      </div>

      <div ref={summaryRef} className="grid gap-6 rounded-md border bg-white p-6 text-black">
        <header className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">PC 견적</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">최종 선택 부품</h2>
          </div>
          <div className="text-sm text-neutral-500">{new Date().toLocaleString("ko-KR")}</div>
        </header>

        <section className={`rounded-md border p-4 ${statusClassName(summary.status, isIncomplete)}`}>
          <p className="text-sm font-semibold">{isIncomplete ? "필수 부품 미선택" : `호환성 결과: ${statusLabel(summary.status)}`}</p>
          <p className="mt-2 text-sm leading-6">
            {isIncomplete
              ? `최종 견적을 만들려면 남은 필수 부품을 먼저 선택해야 합니다. 남은 부품: ${missingCategories.map((category) => categoryLabel(category)).join(", ")}`
              : summary.statusMessage}
          </p>
          {!isIncomplete && summary.status === "blocked" ? (
            <p className="mt-2 text-sm leading-6">
              이 조합은 조립 또는 부팅이 불가능할 수 있어 복사/이미지 저장을 막았습니다. 아래 문제를 해결한 뒤 다시 확인하세요.
            </p>
          ) : null}
          {!isIncomplete && summary.status === "needs-check" ? (
            <p className="mt-2 text-sm leading-6">확인 필요 항목이 남아 있어 구매 CTA는 제공하지 않습니다. 아래 항목을 확인한 뒤 구매하세요.</p>
          ) : null}
          <p className="mt-2 text-xs leading-5">혜택가 합계는 카드/쿠폰/배송비 조건에 따라 달라질 수 있는 조건부 예상가입니다.</p>
        </section>

        {isIncomplete ? (
          <section className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <p className="text-sm font-semibold">최종 견적을 만들기 전 선택하지 않은 부품이 있습니다.</p>
            <p className="mt-2 text-sm leading-6">
              남은 부품: {missingCategories.map((category) => categoryLabel(category)).join(", ")}
            </p>
            <p className="mt-1 text-sm leading-6">빌더에서 필수 부품을 모두 선택하거나 안전한 추천 견적 자동 구성을 완료하세요.</p>
          </section>
        ) : null}

        <section className="grid gap-3">
          {summary.items.length ? (
            summary.items.map((item) => (
              <div key={item.category} className="grid gap-3 rounded-md border border-neutral-200 p-3 lg:grid-cols-[90px_1fr_minmax(240px,320px)] lg:items-start">
                <span className="text-sm font-medium text-neutral-500">{categoryLabel(item.category)}</span>
                <div>
                  <p className="font-medium">{getSummaryItemName(item)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {getPartSpecBadges(item.part).map((badge) => (
                      <span key={badge} className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                        {badge}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {item.offer?.mall ?? "가격 출처 확인 필요"} · {item.offer?.source.name ?? "샘플/저장 가격"}
                  </p>
                  {item.offer ? <p className="mt-1 text-xs text-neutral-500">가격 매칭 상품: {item.offer.productName}</p> : null}
                </div>
                <PriceBreakdown offer={item.offer} selectedCardProviderIds={selectedCardProviderIds} compact className="text-black" />
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-neutral-300 p-5 text-sm text-neutral-500">
              아직 선택된 부품이 없습니다. 빌더에서 후보를 먼저 선택하세요.
            </div>
          )}
        </section>

        <section className="grid gap-3 border-t pt-5 sm:grid-cols-4">
          <SummaryMetric label="일반가+배송비 합계" value={formatKrw(summary.baseTotal)} />
          <SummaryMetric label="내 혜택 반영 합계" value={formatKrw(summary.effectiveTotal)} />
          <SummaryMetric label="예상 절감액" value={formatKrw(summary.discountTotal)} />
          <SummaryMetric label="배송비 합계" value={formatKrw(summary.shippingTotal)} />
        </section>

        <CompatibilityDetails
          result={summary.compatibility}
          selectedParts={selectedParts}
          title={summary.compatibility.status === "needs-check" ? `구매 전 확인 ${summary.compatibility.summary.needsCheck}건` : "부품별 호환성 상세"}
        />

        {summary.warnings.length ? (
          <section className="grid gap-3 border-t pt-5">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-neutral-500" aria-hidden="true" />
              <h3 className="font-semibold">주의사항</h3>
            </div>
            <ul className="grid gap-2 text-sm leading-6 text-neutral-600">
              {summary.warnings.map((warning) => (
                <li key={warning.id}>- {warning.message}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function statusLabel(status: "ready" | "needs-check" | "blocked") {
  if (status === "blocked") return "구매 비추천";
  if (status === "needs-check") return "조건 확인 필요";
  return "구매 가능 후보";
}

function statusClassName(status: "ready" | "needs-check" | "blocked", isIncomplete = false) {
  if (isIncomplete) return "border-amber-300 bg-amber-50 text-amber-950";
  if (status === "blocked") return "border-red-300 bg-red-50 text-red-950";
  if (status === "needs-check") return "border-amber-300 bg-amber-50 text-amber-950";
  return "border-emerald-300 bg-emerald-50 text-emerald-950";
}
