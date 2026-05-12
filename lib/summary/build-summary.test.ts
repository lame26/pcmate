import { describe, expect, it } from "vitest";

import { createSummaryText, getSummaryItemName, type FinalBuildSummary, type SummaryLineItem } from "@/lib/summary/build-summary";
import { createOfferPriceDisplay } from "@/lib/pricing/price-display";
import type { CompatibilityResult } from "@/lib/compatibility/types";
import type { Part } from "@/types/parts";

describe("getSummaryItemName", () => {
  it("uses Part.name instead of the matched Offer productName", () => {
    const part = createPart();
    const item = createSummaryLineItem(part, {
      id: "offer",
      productName: "Crucial P310 500GB",
      mall: "다나와",
      basePrice: 330000,
      availability: "in-stock",
      priceType: "normal",
      confidence: "high",
      warnings: [],
      source: {
        type: "danawa-ranking",
        updatedAt: "2026-05-12T00:00:00.000Z",
      },
      updatedAt: "2026-05-12T00:00:00.000Z",
    });

    expect(getSummaryItemName(item)).toBe("SK hynix Platinum P41 1TB");
  });
});

describe("createSummaryText", () => {
  it("separates item price, matched benefit price, shipping, and reflected total", () => {
    const part = createPart();
    const item = createSummaryLineItem(
      part,
      {
        id: "offer",
        productName: "SK hynix Platinum P41 1TB",
        mall: "다나와",
        basePrice: 330000,
        benefitPrice: 310000,
        cardProviderId: "samsung",
        shippingFee: 3000,
        availability: "in-stock",
        priceType: "card",
        confidence: "high",
        warnings: [],
        source: {
          type: "danawa-ranking",
          updatedAt: "2026-05-12T00:00:00.000Z",
        },
        updatedAt: "2026-05-12T00:00:00.000Z",
      },
      ["samsung"]
    );
    const text = createSummaryText(createSummary([item]));

    expect(text).toContain("일반가 330,000원 / 내 혜택가 310,000원 / 배송비 3,000원 / 합계 반영가 313,000원");
    expect(text).toContain("일반가+배송비 합계: 333,000원");
    expect(text).toContain("내 혜택 반영 합계: 313,000원");
  });

  it("does not call a card-mismatch benefit my benefit price in copied text", () => {
    const part = createPart();
    const item = createSummaryLineItem(
      part,
      {
        id: "offer",
        productName: "SK hynix Platinum P41 1TB",
        mall: "다나와",
        basePrice: 330000,
        benefitPrice: 310000,
        cardProviderId: "hyundai",
        shippingFee: 3000,
        availability: "in-stock",
        priceType: "card",
        confidence: "high",
        warnings: [],
        source: {
          type: "danawa-ranking",
          updatedAt: "2026-05-12T00:00:00.000Z",
        },
        updatedAt: "2026-05-12T00:00:00.000Z",
      },
      ["samsung"]
    );
    const text = createSummaryText(createSummary([item]));

    expect(text).toContain("일반가 330,000원 / 배송비 3,000원 / 합계 반영가 333,000원");
    expect(text).not.toContain("내 혜택가 310,000원");
  });
});

function createSummaryLineItem(
  part: Part,
  offer: SummaryLineItem["offer"],
  selectedCardProviderIds: string[] = []
): SummaryLineItem {
  const priceDisplay = offer ? createOfferPriceDisplay(offer, selectedCardProviderIds) : undefined;

  return {
    category: "ssd",
    part,
    offer,
    priceDisplay,
    basePrice: priceDisplay?.normalPrice ?? 0,
    effectivePrice: priceDisplay?.selectedTotal ?? 0,
    shippingFee: offer?.shippingFee ?? 0,
    warnings: offer?.warnings ?? [],
  };
}

function createSummary(items: SummaryLineItem[]): FinalBuildSummary {
  const baseTotal = items.reduce((total, item) => total + item.basePrice + item.shippingFee, 0);
  const effectiveTotal = items.reduce((total, item) => total + item.effectivePrice, 0);
  const shippingTotal = items.reduce((total, item) => total + item.shippingFee, 0);

  return {
    items,
    baseTotal,
    effectiveTotal,
    shippingTotal,
    discountTotal: Math.max(0, baseTotal - effectiveTotal),
    status: "ready",
    statusMessage: "구매 가능 후보",
    compatibility: compatibleResult,
    warnings: [],
  };
}

const compatibleResult: CompatibilityResult = {
  status: "compatible",
  canRecommend: true,
  canPurchase: true,
  canExport: true,
  issues: [],
  summary: {
    critical: 0,
    warning: 0,
    info: 0,
    needsCheck: 0,
  },
};

function createPart(): Part {
  return {
    id: "ssd-p41",
    category: "ssd",
    name: "SK hynix Platinum P41 1TB",
    brand: "SK hynix",
    model: "Platinum P41 1TB",
    aliases: [],
    specs: {
      kind: "ssd",
      capacityGb: 1000,
      interface: "NVME",
      formFactor: "M.2",
    },
    classification: {
      brandLineTier: "high",
      marketPosition: "fair",
      confidence: "high",
      reasons: [],
    },
    offers: [],
    source: {
      type: "static",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    confidence: "high",
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}
