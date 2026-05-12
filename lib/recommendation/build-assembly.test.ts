import { describe, expect, it } from "vitest";

import { createRecommendedBuildAssembly } from "@/lib/recommendation/build-assembly";
import type { UserProfile } from "@/types/build";
import type { UserPreferences } from "@/types/games";
import type { Part } from "@/types/parts";

describe("createRecommendedBuildAssembly", () => {
  it("does not generate an RTX 5080 build with a small L330 Quiet style case", () => {
    const gpu = createPart("gpu-rtx-5080", "gpu", {
      kind: "gpu",
      chipset: "RTX 5080",
      vramGb: 16,
      lengthMm: 340,
      recommendedPsuW: 850,
      powerConnectors: ["12V2x6"],
      gamingTier: 9,
    });
    const smallCase = createPart("case-l330-quiet", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 330,
      maxCoolerHeightMm: 165,
      color: "black",
    });
    const largeCase = createPart("case-airflow-400", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 400,
      maxCoolerHeightMm: 175,
      color: "black",
    });

    const result = createRecommendedBuildAssembly({
      parts: [gpu, smallCase, largeCase],
      requirement: createRequirement(),
      profile: createProfile(),
      preferences: createPreferences(),
      priceSnapshots: [],
    });

    expect(result.selectedPartIds.gpu).toBe(gpu.id);
    expect(result.selectedPartIds.case).toBe(largeCase.id);
    expect(result.selectedPartIds.case).not.toBe(smallCase.id);
    expect(result.compatibility.status).not.toBe("blocked");
  });

  it("does not generate a 360mm AIO build with a case that only supports 240mm radiators", () => {
    const cooler = createPart("cooler-360", "cooler", {
      kind: "cooler",
      type: "liquid",
      supportedSockets: ["AM5"],
      radiatorSizeMm: 360,
      coolingCapacityTier: "strong",
    });
    const smallCase = createPart("case-240-aio", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 380,
      maxCoolerHeightMm: 170,
      topRadiatorMm: 240,
      frontRadiatorMm: 240,
      color: "black",
    });
    const largeCase = createPart("case-360-aio", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 380,
      maxCoolerHeightMm: 170,
      topRadiatorMm: 360,
      frontRadiatorMm: 360,
      color: "black",
    });

    const result = createRecommendedBuildAssembly({
      parts: [cooler, smallCase, largeCase],
      requirement: createRequirement(),
      profile: createProfile(),
      preferences: createPreferences(),
      priceSnapshots: [],
    });

    expect(result.selectedPartIds.cooler).toBe(cooler.id);
    expect(result.selectedPartIds.case).toBe(largeCase.id);
    expect(result.selectedPartIds.case).not.toBe(smallCase.id);
    expect(result.compatibility.status).not.toBe("blocked");
  });
});

function createRequirement() {
  return {
    cpuTier: 5,
    gpuTier: 8,
    ramGb: 32 as const,
    vramGb: 12 as const,
    psuWattage: 750,
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
