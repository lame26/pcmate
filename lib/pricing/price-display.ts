import { cardProviders } from "@/data/cards";
import type { PriceOffer } from "@/types/pricing";

export type BenefitDisplayStatus = "matched-card" | "card-mismatch" | "condition-needs-check" | "none";

export type OfferPriceDisplay = {
  normalPrice: number;
  shippingFee?: number;
  normalTotal: number;
  selectedTotal: number;
  benefitPrice?: number;
  benefitTotal?: number;
  benefitStatus: BenefitDisplayStatus;
  benefitLabel: string;
  benefitNote?: string;
  cardProviderName?: string;
  conditionText?: string;
  shippingKnown: boolean;
};

export function createOfferPriceDisplay(offer: PriceOffer, selectedCardProviderIds: string[]): OfferPriceDisplay {
  const shippingFee = offer.shippingFee;
  const shippingValue = shippingFee ?? 0;
  const normalTotal = offer.basePrice + shippingValue;
  const cardProviderName = offer.cardProviderId ? cardProviderNameById(offer.cardProviderId) : undefined;
  const benefitTotal = offer.benefitPrice !== undefined ? offer.benefitPrice + shippingValue : undefined;
  const benefitStatus = getBenefitStatus(offer, selectedCardProviderIds);
  const conditionText = getBenefitConditionText(offer);

  return {
    normalPrice: offer.basePrice,
    shippingFee,
    normalTotal,
    selectedTotal: benefitStatus === "matched-card" && benefitTotal !== undefined ? benefitTotal : normalTotal,
    benefitPrice: offer.benefitPrice,
    benefitTotal,
    benefitStatus,
    benefitLabel: getBenefitLabel(benefitStatus, cardProviderName),
    benefitNote: getBenefitNote(benefitStatus, cardProviderName),
    cardProviderName,
    conditionText,
    shippingKnown: shippingFee !== undefined,
  };
}

export function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function getBenefitStatus(offer: PriceOffer, selectedCardProviderIds: string[]): BenefitDisplayStatus {
  if (offer.benefitPrice === undefined) return "none";
  if (offer.cardProviderId && selectedCardProviderIds.includes(offer.cardProviderId)) return "matched-card";
  if (offer.cardProviderId) return "card-mismatch";
  return "condition-needs-check";
}

function getBenefitLabel(status: BenefitDisplayStatus, cardProviderName?: string) {
  if (status === "matched-card") return "내 혜택가";
  if (status === "card-mismatch") return `${cardProviderName ?? "타 카드"} 혜택가`;
  if (status === "condition-needs-check") return "조건부 혜택가";
  return "혜택가 없음";
}

function getBenefitNote(status: BenefitDisplayStatus, cardProviderName?: string) {
  if (status === "matched-card") return `${cardProviderName ?? "선택 카드"} 보유 기준으로 합계에 반영합니다.`;
  if (status === "card-mismatch") return "보유 카드와 일치하지 않아 내 혜택가로 계산하지 않습니다.";
  if (status === "condition-needs-check") return "카드/쿠폰 조건을 특정하지 못해 내 혜택가로 계산하지 않습니다.";
  return undefined;
}

function cardProviderNameById(cardProviderId: string) {
  return cardProviders.find((provider) => provider.id === cardProviderId)?.name ?? cardProviderId;
}

function getBenefitConditionText(offer: PriceOffer) {
  const metadata = offer.metadata ?? {};
  const condition = metadata.danawaBenefitCondition ?? metadata.danawaBenefitRawText;

  return typeof condition === "string" && condition.trim() ? condition.trim() : undefined;
}
