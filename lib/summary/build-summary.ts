import { parts } from "@/data/parts";
import { checkCompatibility, createSelectedParts, issueToBuildWarning } from "@/lib/compatibility/check";
import type { CompatibilityResult } from "@/lib/compatibility/types";
import { normalizeDanawaSnapshotsToParts } from "@/lib/parts/danawa-normalizer";
import { getOfferMatchDiagnostics, isStrictSameProductOffer, type OfferMatchDiagnostics } from "@/lib/pricing/offer-match";
import { createOfferPriceDisplay, type OfferPriceDisplay } from "@/lib/pricing/price-display";
import { isPriceSaneForRecommendation } from "@/lib/pricing/price-sanity";
import type { BuildWarning } from "@/types/build";
import type { Part, PartCategory } from "@/types/parts";
import type { PriceOffer, PriceSnapshot } from "@/types/pricing";

export type SummaryLineItem = {
  category: PartCategory;
  part: Part;
  offer?: PriceOffer;
  offerMatch?: OfferMatchDiagnostics;
  priceDisplay?: OfferPriceDisplay;
  basePrice: number;
  effectivePrice: number;
  shippingFee: number;
  warnings: string[];
};

export type FinalBuildSummary = {
  items: SummaryLineItem[];
  baseTotal: number;
  effectiveTotal: number;
  shippingTotal: number;
  discountTotal: number;
  status: "ready" | "needs-check" | "blocked";
  statusMessage: string;
  compatibility: CompatibilityResult;
  warnings: BuildWarning[];
};

const categoryOrder: PartCategory[] = ["cpu", "cooler", "motherboard", "ram", "gpu", "ssd", "psu", "case"];

export function createFinalBuildSummary(input: {
  selectedPartIds: Partial<Record<PartCategory, string>>;
  priceSnapshots: PriceSnapshot[];
  selectedCardProviderIds: string[];
}): FinalBuildSummary {
  const allParts = mergeParts(parts, normalizeDanawaSnapshotsToParts(input.priceSnapshots));
  const items = categoryOrder
    .map((category) => {
      const partId = input.selectedPartIds[category];
      const part = allParts.find((item) => item.id === partId);

      if (!part) return undefined;

      const offer = findBestOffer(part, input.priceSnapshots, input.selectedCardProviderIds);
      const offerMatch = offer ? getOfferMatchDiagnostics(part, offer) : undefined;
      const priceDisplay = offer ? createOfferPriceDisplay(offer, input.selectedCardProviderIds) : undefined;
      const basePrice = priceDisplay?.normalPrice ?? 0;
      const effectivePrice = priceDisplay?.selectedTotal ?? basePrice;
      const shippingFee = offer?.shippingFee ?? 0;

      const item: SummaryLineItem = {
        category,
        part,
        offer,
        offerMatch,
        priceDisplay,
        basePrice,
        effectivePrice,
        shippingFee,
        warnings: offer?.warnings ?? [],
      };

      return item;
    })
    .filter((item): item is SummaryLineItem => item !== undefined);
  const baseTotal = items.reduce((total, item) => total + item.basePrice + item.shippingFee, 0);
  const effectiveTotal = items.reduce((total, item) => total + item.effectivePrice, 0);
  const shippingTotal = items.reduce((total, item) => total + item.shippingFee, 0);
  const compatibility = checkCompatibility(createSelectedParts(allParts, input.selectedPartIds));
  const warnings = createSummaryWarnings(items, input.selectedPartIds);
  const status = createSummaryStatus(warnings, items.length, compatibility);

  return {
    items,
    baseTotal,
    effectiveTotal,
    shippingTotal,
    discountTotal: Math.max(0, baseTotal - effectiveTotal),
    status: status.status,
    statusMessage: status.message,
    compatibility,
    warnings,
  };
}

function mergeParts(seedParts: Part[], dynamicParts: Part[]) {
  return Array.from(new Map([...seedParts, ...dynamicParts].map((part) => [part.id, part])).values());
}

export function createSummaryText(summary: FinalBuildSummary) {
  const lines = [
    "[PC 견적]",
    `상태: ${summary.statusMessage}`,
    "",
    ...summary.items.map(createSummaryItemText),
    "",
    `일반가+배송비 합계: ${formatKrw(summary.baseTotal)}`,
    `내 혜택 반영 합계: ${formatKrw(summary.effectiveTotal)}`,
    `예상 절감액: ${formatKrw(summary.discountTotal)}`,
    `배송비 합계: ${formatKrw(summary.shippingTotal)}`,
  ];

  if (summary.warnings.length) {
    lines.push("", "주의사항:", ...summary.warnings.map((warning) => `- ${warning.message}`));
  }

  return lines.join("\n");
}

function createSummaryItemText(item: SummaryLineItem) {
  const display = item.priceDisplay;
  const itemPriceText = [`일반가 ${formatKrw(item.basePrice)}`];

  if (display?.benefitStatus === "matched-card" && display.benefitPrice !== undefined) {
    itemPriceText.push(`내 혜택가 ${formatKrw(display.benefitPrice)}`);
  }

  itemPriceText.push(`배송비 ${display?.shippingKnown ? formatKrw(item.shippingFee) : "확인 필요"}`);
  itemPriceText.push(`합계 반영가 ${formatKrw(item.effectivePrice)}`);

  return `${categoryLabel(item.category)}: ${getSummaryItemName(item)} - ${itemPriceText.join(" / ")}`;
}

export function categoryLabel(category: PartCategory) {
  const labels: Record<PartCategory, string> = {
    cpu: "CPU",
    cooler: "쿨러",
    motherboard: "메인보드",
    ram: "RAM",
    gpu: "VGA",
    ssd: "SSD",
    psu: "파워",
    case: "케이스",
  };

  return labels[category];
}

export function getSummaryItemName(item: SummaryLineItem) {
  return item.part.name;
}

export function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function findBestOffer(part: Part, snapshots: PriceSnapshot[], selectedCardProviderIds: string[]) {
  const categoryOffers = snapshots
    .filter((snapshot) => snapshot.category === part.category || !snapshot.category)
    .flatMap((snapshot) => snapshot.offers);
  const snapshotOffers = categoryOffers
    .filter((offer) => isStrictSameProductOffer(part, offer))
    .filter(isOfferEligibleForSummary)
    .filter((offer) => isPriceSaneForRecommendation(offer, part.category, categoryOffers));
  const offers = snapshotOffers.length ? snapshotOffers : part.offers.filter(isFallbackOfferEligibleForSummary);

  return offers.sort((left, right) => getOfferPrice(left, selectedCardProviderIds) - getOfferPrice(right, selectedCardProviderIds))[0];
}

function getOfferPrice(offer: PriceOffer, selectedCardProviderIds: string[]) {
  const effective =
    offer.cardProviderId && selectedCardProviderIds.includes(offer.cardProviderId)
      ? offer.benefitPrice ?? offer.basePrice
      : offer.basePrice;

  return effective + (offer.shippingFee ?? 0);
}

function createSummaryWarnings(items: SummaryLineItem[], selectedPartIds: Partial<Record<PartCategory, string>>): BuildWarning[] {
  const warnings: BuildWarning[] = [];
  const allParts = mergeParts(parts, items.map((item) => item.part));
  const compatibility = checkCompatibility(createSelectedParts(allParts, selectedPartIds));

  if (items.length < categoryOrder.length) {
    warnings.push({
      id: "summary-missing-parts",
      severity: "warning",
      code: "SUMMARY_MISSING_PARTS",
      message: "아직 선택하지 않은 부품이 있어 최종 합계가 완전하지 않습니다.",
    });
  }

  items.forEach((item) => {
    if (!item.offer) {
      warnings.push({
        id: `${item.part.id}-price-missing`,
        severity: "warning",
        code: "PRICE_MISSING",
        message: `${item.part.name} 가격 데이터가 부족합니다.`,
        targetPartId: item.part.id,
      });
    }

    item.warnings.forEach((warning, index) => {
      warnings.push({
        id: `${item.part.id}-offer-warning-${index}`,
        severity: "info",
        code: "PRICE_OFFER_WARNING",
        message: `${item.part.name}: ${warning}`,
        targetPartId: item.part.id,
      });
    });

    if ((item.offer?.source.type === "danawa-ranking" || item.offer?.source.type === "danawa-csv-price") && item.offer.shippingFee === undefined) {
      warnings.push({
        id: `${item.part.id}-shipping-needs-check`,
        severity: "warning",
        code: "PRICE_SHIPPING_NEEDS_CHECK",
        message: `${item.part.name}: 자동 가격은 배송비가 확정되지 않아 실제 결제액과 다를 수 있습니다.`,
        targetPartId: item.part.id,
      });
    }
  });

  if (!selectedPartIds.cpu || !selectedPartIds.gpu) {
    warnings.push({
      id: "summary-core-parts-missing",
      severity: "warning",
      code: "CORE_PARTS_MISSING",
      message: "CPU와 GPU 선택이 완료되어야 견적 판단 신뢰도가 올라갑니다.",
    });
  }

  return [...warnings, ...compatibility.issues.map(issueToBuildWarning)];
}

function createSummaryStatus(
  warnings: BuildWarning[],
  itemCount: number,
  compatibility: ReturnType<typeof checkCompatibility>
): { status: FinalBuildSummary["status"]; message: string } {
  if (!compatibility.canExport || warnings.some((warning) => warning.severity === "critical")) {
    return {
      status: "blocked",
      message: "구매 비추천: 호환성 blocker가 있어 견적을 그대로 구매하면 안 됩니다.",
    };
  }

  if (!compatibility.canPurchase || itemCount < categoryOrder.length || warnings.some((warning) => warning.severity === "warning")) {
    return {
      status: "needs-check",
      message: "조건 확인 필요: 가격, 배송비, BIOS, 케이블 등 구매 전 확인이 필요합니다.",
    };
  }

  return {
    status: "ready",
    message: "구매 가능 후보: 그래도 실제 구매 전 가격과 재고는 다시 확인하세요.",
  };
}

function isOfferEligibleForSummary(offer: PriceOffer) {
  const riskText = [offer.productName, offer.mall, ...offer.warnings].join(" ").toLowerCase();
  const hasRiskKeyword = /중고|리퍼|전시|반품|병행|해외|품절|sold.?out|used|refurb/i.test(riskText);

  if (offer.availability === "sold-out") return false;
  if (offer.priceType === "used") return false;
  if (offer.confidence === "low") return false;
  if (hasRiskKeyword) return false;

  return true;
}

function isFallbackOfferEligibleForSummary(offer: PriceOffer) {
  if (offer.source.type === "static") return false;
  return isOfferEligibleForSummary(offer);
}
