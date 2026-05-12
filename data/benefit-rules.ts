import type { BenefitRule } from "@/types/cards";

export const benefitRules: BenefitRule[] = [
  {
    id: "benefit-samsung-card-price",
    providerId: "samsung",
    type: "unknown",
    description: "MVP에서는 삼성카드 표기 offer의 benefitPrice를 그대로 사용합니다.",
    enabledInMvp: true,
  },
  {
    id: "benefit-hyundai-card-price",
    providerId: "hyundai",
    type: "unknown",
    description: "MVP에서는 현대카드 표기 offer의 benefitPrice를 그대로 사용합니다.",
    enabledInMvp: true,
  },
  {
    id: "benefit-shinhan-card-price",
    providerId: "shinhan",
    type: "unknown",
    description: "MVP에서는 신한카드 표기 offer의 benefitPrice를 그대로 사용합니다.",
    enabledInMvp: true,
  },
  {
    id: "benefit-membership-future",
    providerId: "naver-pay",
    type: "membership",
    description: "멤버십 적립과 중복 할인은 v2에서 계산합니다.",
    enabledInMvp: false,
  },
];
