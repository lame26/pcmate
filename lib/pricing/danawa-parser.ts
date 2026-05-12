import { cardProviders } from "@/data/cards";
import type { Confidence } from "@/types/build";
import type { PartCategory } from "@/types/parts";
import type { PriceOffer, PriceSnapshot } from "@/types/pricing";

type ManualPriceInput = {
  productName: string;
  basePrice: number;
  mall?: string;
  cardProviderId?: string;
  benefitPrice?: number;
  shippingFee?: number;
  url?: string;
  category?: PartCategory;
};

const DANAWA_URL_PATTERN = /https?:\/\/[^\s]+danawa\.com\/[^\s]+/i;
const PCODE_PATTERNS = [/[?&]pcode=(\d+)/i, /\/product\/(\d+)/i, /\bpcode\s*[:=]?\s*(\d{5,})\b/i];

const mallNames = [
  "컴퓨존",
  "아이코다",
  "조이젠",
  "샵다나와",
  "11번가",
  "G마켓",
  "옥션",
  "롯데온",
  "쿠팡",
  "네이버",
  "SSG",
  "하이마트",
];

export function parseDanawaPaste(raw: string, category?: PartCategory): PriceSnapshot {
  const now = new Date().toISOString();
  const normalized = raw.trim();
  const warnings: string[] = [];

  if (!normalized) {
    return createSnapshot({
      offers: [],
      category,
      confidence: "low",
      warnings: ["붙여넣은 가격 텍스트가 비어 있습니다."],
      updatedAt: now,
    });
  }

  const pcode = extractDanawaPcode(normalized);
  const url = normalized.match(DANAWA_URL_PATTERN)?.[0];
  const productName = inferProductName(normalized);
  const mall = inferMall(normalized);
  const cardProviderId = inferCardProviderId(normalized);
  const prices = extractPrices(normalized);
  const shippingFee = inferShippingFee(normalized);
  const hasBenefitSignal = /혜택|카드|청구|즉시|쿠폰|최저가/i.test(normalized);
  const hasUsedSignal = /중고|리퍼|전시|반품/i.test(normalized);
  const hasOverseasSignal = /해외|병행|직구/i.test(normalized);
  const hasSoldOutSignal = /품절|일시\s*품절/i.test(normalized);

  if (!productName) warnings.push("상품명을 안정적으로 찾지 못했습니다.");
  if (!prices.length) warnings.push("가격을 찾지 못했습니다.");
  if (shippingFee === undefined) warnings.push("배송비를 찾지 못했습니다.");
  if (hasBenefitSignal && !cardProviderId) warnings.push("카드 조건이 보이지만 카드사를 특정하지 못했습니다.");
  if (hasUsedSignal) warnings.push("중고/리퍼/전시 상품일 가능성이 있습니다.");
  if (hasOverseasSignal) warnings.push("해외구매 또는 병행수입 상품일 가능성이 있습니다.");
  if (hasSoldOutSignal) warnings.push("품절 상품일 가능성이 있습니다.");

  const basePrice = prices[0];
  const benefitPrice = hasBenefitSignal ? Math.min(...prices) : undefined;
  const offerWarnings = warnings.filter((warning) => !warning.includes("상품명") && !warning.includes("가격을"));
  const confidence = calculatePriceConfidence({
    offerCount: basePrice ? 1 : 0,
    hasShipping: shippingFee !== undefined,
    hasCard: Boolean(cardProviderId),
    warningCount: warnings.length,
  });
  const offers: PriceOffer[] = basePrice
    ? [
        {
          id: createId("danawa-paste-offer", productName ?? normalized),
          productName: productName ?? "상품명 확인 필요",
          mall: mall ?? "쇼핑몰 확인 필요",
          url,
          pcode,
          basePrice,
          benefitPrice: benefitPrice && benefitPrice < basePrice ? benefitPrice : undefined,
          cardProviderId,
          shippingFee,
          availability: hasSoldOutSignal ? "sold-out" : "unknown",
          priceType: hasUsedSignal ? "used" : hasBenefitSignal ? "card" : "normal",
          source: {
            type: "danawa-paste",
            name: "다나와 붙여넣기",
            url,
            updatedAt: now,
          },
          confidence,
          warnings: offerWarnings,
          rawText: normalized,
          updatedAt: now,
        },
      ]
    : [];

  return createSnapshot({
    pcode,
    searchQuery: productName,
    category,
    offers,
    confidence,
    warnings,
    updatedAt: now,
  });
}

export function createManualPriceSnapshot(input: ManualPriceInput): PriceSnapshot {
  const now = new Date().toISOString();
  const warnings: string[] = [];
  const pcode = input.url ? extractDanawaPcode(input.url) : undefined;

  if (!input.productName.trim()) warnings.push("상품명이 비어 있습니다.");
  if (!input.basePrice) warnings.push("일반 가격이 비어 있습니다.");
  if (!input.mall?.trim()) warnings.push("쇼핑몰 정보가 비어 있습니다.");
  if (input.shippingFee === undefined) warnings.push("배송비 정보가 비어 있습니다.");

  const confidence = calculatePriceConfidence({
    offerCount: input.productName && input.basePrice ? 1 : 0,
    hasShipping: input.shippingFee !== undefined,
    hasCard: Boolean(input.cardProviderId),
    warningCount: warnings.length,
  });

  const offer: PriceOffer = {
    id: createId("manual-offer", input.productName),
    productName: input.productName.trim() || "상품명 확인 필요",
    mall: input.mall?.trim() || "쇼핑몰 확인 필요",
    url: input.url,
    pcode,
    basePrice: input.basePrice,
    benefitPrice: input.benefitPrice,
    cardProviderId: input.cardProviderId,
    shippingFee: input.shippingFee,
    availability: "unknown",
    priceType: input.cardProviderId || input.benefitPrice ? "card" : "normal",
    source: {
      type: "manual",
      name: "수동 입력",
      url: input.url,
      updatedAt: now,
    },
    confidence,
    warnings,
    updatedAt: now,
  };

  return createSnapshot({
    pcode,
    searchQuery: input.productName,
    category: input.category,
    offers: input.productName && input.basePrice ? [offer] : [],
    confidence,
    warnings,
    updatedAt: now,
  });
}

export function createPcodePlaceholderSnapshot(input: {
  pcode?: string;
  searchQuery?: string;
  category?: PartCategory;
  warning?: string;
}): PriceSnapshot {
  const now = new Date().toISOString();

  return createSnapshot({
    pcode: input.pcode,
    searchQuery: input.searchQuery,
    category: input.category,
    offers: [],
    confidence: "low",
    warnings: [input.warning ?? "자동 가격 조회는 크롤러 어댑터 단계에서 연결됩니다. 현재는 붙여넣기 또는 수동 입력을 사용해 주세요."],
    updatedAt: now,
  });
}

export function extractDanawaPcode(value: string): string | undefined {
  for (const pattern of PCODE_PATTERNS) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  const numericOnly = value.trim().match(/^\d{5,}$/);
  return numericOnly?.[0];
}

export function calculatePriceConfidence(input: {
  offerCount: number;
  hasShipping: boolean;
  hasCard: boolean;
  warningCount: number;
}): Confidence {
  const score =
    Math.min(input.offerCount, 3) * 30 + (input.hasShipping ? 20 : 0) + (input.hasCard ? 10 : 0) - input.warningCount * 12;

  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

function createSnapshot(input: {
  pcode?: string;
  searchQuery?: string;
  category?: PartCategory;
  offers: PriceOffer[];
  confidence: Confidence;
  warnings: string[];
  updatedAt: string;
}): PriceSnapshot {
  return {
    id: createId("price-snapshot", input.pcode ?? input.searchQuery ?? String(input.offers.length)),
    pcode: input.pcode,
    searchQuery: input.searchQuery,
    category: input.category,
    offers: input.offers,
    source: {
      type: input.offers[0]?.source.type ?? "manual",
      name: input.offers[0]?.source.name ?? "가격 스냅샷",
      url: input.offers[0]?.source.url,
      updatedAt: input.updatedAt,
    },
    confidence: input.confidence,
    warnings: input.warnings,
    updatedAt: input.updatedAt,
  };
}

function inferProductName(value: string) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.find((line) => {
    if (line.length < 5) return false;
    if (line.match(/^\d[\d,\s]*원/)) return false;
    if (line.match(DANAWA_URL_PATTERN)) return false;
    if (/배송|혜택|최저|카드|가격비교|판매처|쇼핑몰|pcode/i.test(line)) return false;
    return /[가-힣a-zA-Z]/.test(line);
  });
}

function inferMall(value: string) {
  return mallNames.find((mall) => value.includes(mall));
}

function inferCardProviderId(value: string) {
  return cardProviders.find((provider) => provider.type === "card" && value.includes(provider.name.replace("카드", "")))?.id;
}

function inferShippingFee(value: string) {
  if (/무료\s*배송|배송비\s*무료/i.test(value)) return 0;

  const match = value.match(/배송비[^\d]*(\d[\d,]*)\s*원/i);
  return match?.[1] ? Number(match[1].replace(/,/g, "")) : undefined;
}

function extractPrices(value: string) {
  return Array.from(value.matchAll(/(\d[\d,]{3,})\s*원/g))
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((price) => Number.isFinite(price) && price >= 1000)
    .filter((price, index, prices) => prices.indexOf(price) === index);
}

function createId(prefix: string, value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${prefix}-${slug || "item"}-${Date.now().toString(36)}`;
}
