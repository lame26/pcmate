import { describe, expect, it } from "vitest";

import { createRecommendationCandidates } from "@/lib/recommendation/candidates";
import type { UserProfile } from "@/types/build";
import type { UserPreferences } from "@/types/games";
import type { Part } from "@/types/parts";
import type { PriceOffer, PriceSnapshot } from "@/types/pricing";

describe("createRecommendationCandidates", () => {
  it("does not assign budget/recommended/premium roles to blocked candidates", () => {
    const pcCase = createPart("case-small", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 300,
      maxCoolerHeightMm: 165,
      color: "black",
    });
    const blockedGpu = createPart("gpu-blocked", "gpu", {
      kind: "gpu",
      chipset: "RTX Blocked",
      vramGb: 12,
      lengthMm: 340,
      recommendedPsuW: 650,
      powerConnectors: ["8-pin"],
      gamingTier: 8,
    });
    const eligibleGpu = createPart("gpu-eligible", "gpu", {
      kind: "gpu",
      chipset: "RTX Eligible",
      vramGb: 12,
      lengthMm: 240,
      recommendedPsuW: 650,
      powerConnectors: ["8-pin"],
      gamingTier: 7,
    });

    const candidates = createRecommendationCandidates({
      category: "gpu",
      parts: [pcCase, blockedGpu, eligibleGpu],
      requirement: {
        cpuTier: 5,
        gpuTier: 7,
        ramGb: 32,
        vramGb: 12,
        psuWattage: 650,
        reasons: [],
        warnings: [],
      },
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {
        case: pcCase.id,
      },
      priceSnapshots: [],
    });

    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).not.toContain(blockedGpu.id);
    expect(rolePartIds).toContain(eligibleGpu.id);
  });

  it("does not assign roles to blocked dynamic Danawa candidates", () => {
    const pcCase = createPart("case-small", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 300,
      maxCoolerHeightMm: 165,
      color: "black",
    });
    const blockedOffer = createDanawaGpuOffer("blocked", 340);
    const eligibleOffer = createDanawaGpuOffer("eligible", 240);

    const candidates = createRecommendationCandidates({
      category: "gpu",
      parts: [pcCase],
      requirement: {
        cpuTier: 5,
        gpuTier: 7,
        ramGb: 32,
        vramGb: 12,
        psuWattage: 650,
        reasons: [],
        warnings: [],
      },
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {
        case: pcCase.id,
      },
      priceSnapshots: [createSnapshot([blockedOffer, eligibleOffer])],
    });

    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).not.toContain("danawa-gpu-blocked");
    expect(rolePartIds).toContain("danawa-gpu-eligible");
  });

  it("keeps needs-check dynamic Danawa candidates selectable with visible confidence metadata", () => {
    const pcCase = createPart("case-fit", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 300,
      maxCoolerHeightMm: 165,
      color: "black",
    });
    const needsCheckOffer = createDanawaGpuOffer("needs-check", undefined);

    const candidates = createRecommendationCandidates({
      category: "gpu",
      parts: [pcCase],
      requirement: {
        cpuTier: 5,
        gpuTier: 7,
        ramGb: 32,
        vramGb: 12,
        psuWattage: 650,
        reasons: [],
        warnings: [],
      },
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {
        case: pcCase.id,
      },
      priceSnapshots: [createSnapshot([needsCheckOffer])],
    });

    const candidate = candidates.find((item) => item.part.id === "danawa-gpu-needs-check");

    expect(candidate?.eligibility.eligible).toBe(true);
    expect(candidate?.eligibility.compatibility.status).toBe("needs-check");
    expect(candidate?.eligibility.compatibility.issues).toContainEqual(
      expect.objectContaining({
        code: "GPU_LENGTH_UNKNOWN",
      })
    );
    expect(candidate?.meta).toMatchObject({
      sourceKind: "danawa-ranking",
      danawaRank: 1,
      pcode: "needs-check",
      specConfidence: "medium",
      priceConfidence: "high",
    });
  });

  it("uses sammy CSV offers only as price augmentation for existing Parts", () => {
    const gpu = createPart("gpu-seed", "gpu", {
      kind: "gpu",
      chipset: "RTX 5070",
      vramGb: 12,
      lengthMm: 240,
      recommendedPsuW: 650,
      powerConnectors: ["12V2x6"],
      gamingTier: 8,
    });
    const csvOffer: PriceOffer = {
      id: "csv-offer",
      partId: gpu.id,
      productName: gpu.name,
      mall: "다나와 CSV",
      pcode: "csv-5070",
      basePrice: 990000,
      availability: "unknown",
      priceType: "normal",
      confidence: "medium",
      warnings: [],
      source: {
        type: "danawa-csv-price",
        name: "sammy310/Danawa-Crawler CSV",
        updatedAt: "2026-05-12T00:00:00.000Z",
      },
      updatedAt: "2026-05-12T00:00:00.000Z",
    };

    const candidates = createRecommendationCandidates({
      category: "gpu",
      parts: [gpu],
      requirement: {
        cpuTier: 5,
        gpuTier: 7,
        ramGb: 32,
        vramGb: 12,
        psuWattage: 650,
        reasons: [],
        warnings: [],
      },
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [
        {
          id: "csv-snapshot",
          category: "gpu",
          searchQuery: "RTX 5070",
          offers: [csvOffer],
          confidence: "medium",
          warnings: [],
          source: {
            type: "danawa-csv-price",
            name: "sammy310/Danawa-Crawler CSV",
            updatedAt: "2026-05-12T00:00:00.000Z",
          },
          updatedAt: "2026-05-12T00:00:00.000Z",
        },
      ],
    });

    expect(candidates.map((candidate) => candidate.part.id)).toEqual(["gpu-seed"]);
    expect(candidates[0]?.effectivePrice).toBe(990000);
    expect(candidates[0]?.display.name).toBe(gpu.name);
    expect(candidates[0]?.display.priceSourceName).toBe(gpu.name);
  });

  it("does not put LGA motherboards in roles after an AM5 CPU is selected", () => {
    const cpu = createPart("cpu-am5", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 7000",
      tdpW: 65,
    });
    const lgaBoard = createPart("board-lga", "motherboard", {
      kind: "motherboard",
      socket: "LGA1700",
      chipset: "B760",
      formFactor: "M-ATX",
      ramType: "DDR5",
    });
    const am5Board = createPart("board-am5", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
      supportedCpuSeries: ["Ryzen 7000"],
    });

    const candidates = createRecommendationCandidates({
      category: "motherboard",
      parts: [cpu, lgaBoard, am5Board],
      requirement: createRequirement(),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: { cpu: cpu.id },
      priceSnapshots: [],
    });

    expect(candidates.map((candidate) => candidate.part.id)).toContain(am5Board.id);
    expect(candidates.map((candidate) => candidate.part.id)).not.toContain(lgaBoard.id);
  });

  it("does not put DDR4 RAM in roles after a DDR5 motherboard is selected", () => {
    const board = createPart("board-ddr5", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
    });
    const ddr4 = createPart("ram-ddr4", "ram", {
      kind: "ram",
      type: "DDR4",
      totalGb: 32,
      moduleCount: 2,
      speedMhz: 3200,
    });
    const ddr5 = createPart("ram-ddr5", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 32,
      moduleCount: 2,
      speedMhz: 6000,
    });

    const candidates = createRecommendationCandidates({
      category: "ram",
      parts: [board, ddr4, ddr5],
      requirement: createRequirement(),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: { motherboard: board.id },
      priceSnapshots: [],
    });

    expect(candidates.map((candidate) => candidate.part.id)).toContain(ddr5.id);
    expect(candidates.map((candidate) => candidate.part.id)).not.toContain(ddr4.id);
  });
});

function createRequirement() {
  return {
    cpuTier: 5,
    gpuTier: 7,
    ramGb: 32 as const,
    vramGb: 12 as const,
    psuWattage: 650,
    reasons: [],
    warnings: [],
  };
}

function createProfile(): UserProfile {
  return {
    id: "test-profile",
    buildMode: "full-build",
    selectedCardProviderIds: [],
    selectedMembershipIds: [],
    createdAt: "2026-05-12T00:00:00.000Z",
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}

function createPreferences(): UserPreferences {
  return {
    gpuVendor: "any",
    cooling: "any",
    rgb: "any",
    caseSize: "any",
    noise: "any",
    color: "any",
    reuse: {
      ssd: false,
      case: false,
      psu: false,
    },
  };
}

function createPart(id: string, category: Part["category"], specs: Part["specs"]): Part {
  return {
    id,
    category,
    name: id,
    brand: "Test",
    model: id,
    aliases: [],
    specs,
    classification: {
      brandLineTier: "mainstream",
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

function createSnapshot(offers: PriceOffer[]): PriceSnapshot {
  return {
    id: "snapshot-gpu",
    searchQuery: "gpu rank top 30",
    category: "gpu",
    offers,
    confidence: "high",
    warnings: [],
    source: {
      type: "danawa-ranking",
      name: "Danawa category ranking",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}

function createDanawaGpuOffer(pcode: string, lengthMm?: number): PriceOffer {
  return {
    id: `offer-${pcode}`,
    productName: `MSI 지포스 RTX 5070 ${pcode} D7 12GB`,
    mall: "다나와",
    pcode,
    basePrice: lengthMm ? lengthMm * 1000 : 1086550,
    availability: "in-stock",
    priceType: "normal",
    confidence: "high",
    warnings: [],
    metadata: {
      gpuChipset: "RTX 5070",
      gpuRecommendedPsuW: 650,
      gpuPowerConnector: "16핀(12V2x6) x1",
      gpuLengthMm: lengthMm,
      danawaRank: 1,
      danawaSpecText: `RTX 5070 / 650W 이상 / 전원 포트 : 16핀(12V2x6) x1 / 가로(길이) : ${lengthMm} / D7 12GB`,
    },
    source: {
      type: "danawa-ranking",
      name: "Danawa category ranking",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}
