import { describe, expect, it } from "vitest";

import { createOfferPriceDisplay } from "@/lib/pricing/price-display";
import type { PriceOffer } from "@/types/pricing";

describe("createOfferPriceDisplay", () => {
  it("marks a matching selected card benefit as my benefit price", () => {
    const display = createOfferPriceDisplay(createOffer({ benefitPrice: 95000, cardProviderId: "samsung", shippingFee: 3000 }), ["samsung"]);

    expect(display.benefitStatus).toBe("matched-card");
    expect(display.benefitLabel).toBe("내 혜택가");
    expect(display.selectedTotal).toBe(98000);
    expect(display.normalTotal).toBe(103000);
  });

  it("keeps another card benefit visible but out of the selected total", () => {
    const display = createOfferPriceDisplay(createOffer({ benefitPrice: 95000, cardProviderId: "hyundai", shippingFee: 3000 }), ["samsung"]);

    expect(display.benefitStatus).toBe("card-mismatch");
    expect(display.benefitLabel).toBe("현대카드 혜택가");
    expect(display.selectedTotal).toBe(103000);
    expect(display.benefitTotal).toBe(98000);
  });

  it("treats benefits without a known card as condition-needs-check", () => {
    const display = createOfferPriceDisplay(
      createOffer({
        benefitPrice: 94000,
        metadata: {
          danawaBenefitCondition: "쿠폰/카드 조건 확인 필요",
        },
      }),
      ["samsung"]
    );

    expect(display.benefitStatus).toBe("condition-needs-check");
    expect(display.benefitLabel).toBe("조건부 혜택가");
    expect(display.selectedTotal).toBe(100000);
    expect(display.conditionText).toBe("쿠폰/카드 조건 확인 필요");
  });
});

function createOffer(overrides: Partial<PriceOffer> = {}): PriceOffer {
  return {
    id: "offer",
    productName: "Test product",
    mall: "Test mall",
    basePrice: 100000,
    availability: "in-stock",
    priceType: "normal",
    source: {
      type: "manual",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    confidence: "high",
    warnings: [],
    updatedAt: "2026-05-12T00:00:00.000Z",
    ...overrides,
  };
}
