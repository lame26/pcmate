import { describe, expect, it } from "vitest";

import { checkCompatibility } from "@/lib/compatibility/check";
import { normalizeDanawaOfferToPart, normalizeDanawaSnapshotsToParts } from "@/lib/parts/danawa-normalizer";
import type { PriceOffer } from "@/types/pricing";

describe("normalizeDanawaOfferToPart", () => {
  it("normalizes a Danawa GPU offer into a Part", () => {
    const part = normalizeDanawaOfferToPart(createGpuOffer({ lengthMm: 338 }), "gpu");

    expect(part).toMatchObject({
      id: "danawa-gpu-77379380",
      category: "gpu",
      name: "MSI 지포스 RTX 5070 게이밍 트리오 OC D7 12GB 트라이프로져4",
      specs: {
        kind: "gpu",
        chipset: "RTX 5070",
        vramGb: 12,
        lengthMm: 338,
        recommendedPsuW: 650,
        powerConnectors: ["12V2x6"],
      },
    });
  });

  it("keeps missing GPU length as needs-check instead of passing silently", () => {
    const gpu = normalizeDanawaOfferToPart(createGpuOffer({ lengthMm: undefined }), "gpu");
    const pcCase = normalizeDanawaOfferToPart(createCaseOffer(), "case");

    if (!gpu || !pcCase) throw new Error("normalization failed");

    const result = checkCompatibility({
      gpu,
      case: pcCase,
    });

    expect(result.status).toBe("needs-check");
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "GPU_LENGTH_UNKNOWN",
        status: "needs-check",
      })
    );
  });

  it("does not infer ATX support from M-ATX-only case text", () => {
    const pcCase = normalizeDanawaOfferToPart(
      {
        ...createCaseOffer(),
        metadata: {
          caseSupportedFormFactors: "M-ATX , M-ITX",
          danawaRank: 3,
          danawaSpecText: "미니타워 / 지원보드규격 : M-ATX , M-ITX",
        },
      },
      "case"
    );

    expect(pcCase?.specs).toMatchObject({
      kind: "case",
      supportedFormFactors: ["M-ATX", "Mini-ITX"],
    });
  });

  it("normalizes motherboard CPU support metadata", () => {
    const motherboard = normalizeDanawaOfferToPart(
      createOffer("motherboard", {
        productName: "MSI MAG B650M 박격포 WIFI",
        metadata: {
          motherboardChipset: "AMD B650",
          motherboardSocket: "AMD(소켓AM5)",
          motherboardFormFactor: "M-ATX",
          motherboardRamType: "DDR5",
          motherboardM2SlotText: "2개",
          motherboardSupportedCpuSeries: "Ryzen 7000,Ryzen 8000,Ryzen 9000",
          motherboardBiosSupportNotes: "Ryzen 9000 사용 시 출고 BIOS 버전 확인 필요",
        },
      }),
      "motherboard"
    );

    expect(motherboard?.specs).toMatchObject({
      kind: "motherboard",
      socket: "AM5",
      chipset: "AMD B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
      m2Slots: 2,
      supportedCpuSeries: ["Ryzen 7000", "Ryzen 8000", "Ryzen 9000"],
      biosSupportNotes: ["Ryzen 9000 사용 시 출고 BIOS 버전 확인 필요"],
    });
  });

  it("normalizes PSU ATX, connector, and quality metadata", () => {
    const psu = normalizeDanawaOfferToPart(
      createOffer("psu", {
        productName: "시소닉 FOCUS GX-850 ATX3.1",
        metadata: {
          psuWattageW: 850,
          psuEfficiency: "80PLUS GOLD",
          psuAtxVersion: "ATX 3.1",
          psuConnectorText: "PCIe 8핀(6+2) x4 / 12V-2x6 x1",
          psuPcie8pinCount: 4,
          psuHas12v2x6: true,
          psuModularText: "풀모듈러",
        },
      }),
      "psu"
    );

    expect(psu?.specs).toMatchObject({
      kind: "psu",
      wattage: 850,
      atxVersion: "ATX 3.1",
      gpuConnectors: ["12V2x6", "8-pin"],
      pcie8pinCount: 4,
      has12v2x6: true,
      native12v2x6: true,
      qualityTier: "high",
      modular: "full",
    });
  });

  it("normalizes cooler capacity metadata", () => {
    const cooler = normalizeDanawaOfferToPart(
      createOffer("cooler", {
        productName: "ARCTIC Liquid Freezer III 360",
        metadata: {
          coolerType: "수랭 CPU쿨러",
          coolerRadiatorMm: 360,
          coolerSupportedSockets: "AM5, LGA1851",
          coolerTdpCapacityW: 300,
        },
      }),
      "cooler"
    );

    expect(cooler?.specs).toMatchObject({
      kind: "cooler",
      type: "liquid",
      supportedSockets: ["AM5", "LGA1851"],
      radiatorSizeMm: 360,
      tdpCapacityW: 300,
      coolingCapacityTier: "strong",
    });
  });

  it("does not normalize sammy CSV snapshots into Part candidates", () => {
    const parts = normalizeDanawaSnapshotsToParts([
      {
        id: "csv-snapshot",
        category: "gpu",
        searchQuery: "RTX 5070",
        confidence: "medium",
        warnings: [],
        offers: [
          {
            ...createGpuOffer({ lengthMm: 338 }),
            source: {
              type: "danawa-csv-price",
              name: "sammy310/Danawa-Crawler CSV",
              updatedAt: "2026-05-12T00:00:00.000Z",
            },
          },
        ],
        source: {
          type: "danawa-csv-price",
          name: "sammy310/Danawa-Crawler CSV",
          updatedAt: "2026-05-12T00:00:00.000Z",
        },
        updatedAt: "2026-05-12T00:00:00.000Z",
      },
    ]);

    expect(parts).toEqual([]);
  });
});

function createGpuOffer(input: { lengthMm?: number }): PriceOffer {
  return {
    id: "offer-gpu",
    productName: "MSI 지포스 RTX 5070 게이밍 트리오 OC D7 12GB 트라이프로져4",
    mall: "다나와",
    pcode: "77379380",
    basePrice: 1086550,
    availability: "in-stock",
    priceType: "normal",
    confidence: "high",
    warnings: [],
    metadata: {
      gpuChipset: "RTX 5070",
      gpuRecommendedPsuW: 650,
      gpuPowerConnector: "16핀(12V2x6) x1",
      gpuLengthMm: input.lengthMm,
      gpuThicknessMm: 50,
      danawaRank: 2,
      danawaSpecText:
        "RTX 5070 / PCIe5.0x16 / 650W 이상 / 전원 포트 : 16핀(12V2x6) x1 / 가로(길이) : 338 / GDDR7",
    },
    source: {
      type: "danawa-ranking",
      name: "Danawa category ranking",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}

function createCaseOffer(): PriceOffer {
  return {
    id: "offer-case",
    productName: "DAVEN D7 Mesh 세븐팬",
    mall: "다나와",
    pcode: "102621416",
    basePrice: 50080,
    availability: "in-stock",
    priceType: "normal",
    confidence: "high",
    warnings: [],
    metadata: {
      caseSupportedFormFactors: "ATX , M-ATX , M-ITX",
      caseMaxGpuLengthMm: 400,
      caseMaxCoolerHeightMm: 170,
      danawaRank: 1,
      danawaSpecText: "ATX 케이스 / 지원보드규격 : ATX , M-ATX , M-ITX / VGA 길이 : 400mm",
    },
    source: {
      type: "danawa-ranking",
      name: "Danawa category ranking",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}

function createOffer(category: string, input: { productName: string; metadata: PriceOffer["metadata"] }): PriceOffer {
  return {
    id: `offer-${category}`,
    productName: input.productName,
    mall: "다나와",
    pcode: `pcode-${category}`,
    basePrice: 100000,
    availability: "in-stock",
    priceType: "normal",
    confidence: "high",
    warnings: [],
    metadata: {
      danawaRank: 1,
      ...input.metadata,
    },
    source: {
      type: "danawa-ranking",
      name: "Danawa category ranking",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}
