import { describe, expect, it } from "vitest";

import { isPriceSaneForRecommendation } from "@/lib/pricing/price-sanity";
import type { PriceOffer } from "@/types/pricing";

describe("isPriceSaneForRecommendation", () => {
  it("excludes DDR5 32GB offers priced at 500,000 KRW or higher", () => {
    expect(isPriceSaneForRecommendation(createOffer("ESSENCORE DDR5 32GB", 610000, { ramCapacityGb: 32 }), "ram")).toBe(false);
  });

  it("excludes 500GB NVMe offers priced at 200,000 KRW or higher", () => {
    expect(isPriceSaneForRecommendation(createOffer("Samsung NVMe 500GB", 330000, { ssdCapacityText: "500GB" }), "ssd")).toBe(false);
  });
});

function createOffer(productName: string, basePrice: number, metadata: PriceOffer["metadata"]): PriceOffer {
  return {
    id: `${productName}-${basePrice}`,
    productName,
    mall: "다나와",
    basePrice,
    availability: "in-stock",
    priceType: "normal",
    confidence: "high",
    warnings: [],
    metadata,
    source: {
      type: "danawa-ranking",
      name: "Danawa category ranking",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}
