import { describe, expect, it } from "vitest";

import { createRecommendationCandidates } from "@/lib/recommendation/candidates";
import type { UserProfile } from "@/types/build";
import type { RequirementProfile } from "@/types/diagnosis";
import type { UserPreferences } from "@/types/games";
import type { Part, PartCategory } from "@/types/parts";
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

  it("keeps normal mid/high CPU roles in a sensible band", () => {
    const ryzen5600 = createPart("cpu-ryzen-5-5600", "cpu", {
      kind: "cpu",
      socket: "AM4",
      series: "Ryzen 5000",
      cores: 6,
      threads: 12,
      gamingTier: 5,
      tdpW: 65,
    });
    const ryzen7600 = createPart("cpu-ryzen-5-7600", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 7000",
      cores: 6,
      threads: 12,
      gamingTier: 7,
      tdpW: 65,
    });
    const ryzen9700x = createPart("cpu-ryzen-7-9700x", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 9000",
      cores: 8,
      threads: 16,
      gamingTier: 8,
      tdpW: 65,
    });
    const ryzen9850x3d = createPart("cpu-ryzen-7-9850x3d", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 9000",
      cores: 16,
      threads: 32,
      gamingTier: 9,
      tdpW: 170,
    });

    const candidates = createRecommendationCandidates({
      category: "cpu",
      parts: [ryzen5600, ryzen7600, ryzen9700x, ryzen9850x3d],
      requirement: createRequirement({ cpuTier: 7 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });
    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).toContain(ryzen7600.id);
    expect(rolePartIds).toContain(ryzen9700x.id);
    expect(rolePartIds).not.toContain(ryzen5600.id);
    expect(rolePartIds).not.toContain(ryzen9850x3d.id);
  });

  it("keeps normal GPU roles near the diagnosed tier and VRAM requirement", () => {
    const rtx5060 = createPart("gpu-rtx-5060", "gpu", {
      kind: "gpu",
      chipset: "RTX 5060",
      vramGb: 8,
      recommendedPsuW: 650,
      gamingTier: 6,
    });
    const rtx5070 = createPart("gpu-rtx-5070", "gpu", {
      kind: "gpu",
      chipset: "RTX 5070",
      vramGb: 12,
      recommendedPsuW: 750,
      gamingTier: 8,
    });
    const rtx5070ti = createPart("gpu-rtx-5070-ti", "gpu", {
      kind: "gpu",
      chipset: "RTX 5070 Ti",
      vramGb: 16,
      recommendedPsuW: 750,
      gamingTier: 9,
    });
    const rtx5090 = createPart("gpu-rtx-5090", "gpu", {
      kind: "gpu",
      chipset: "RTX 5090",
      vramGb: 32,
      recommendedPsuW: 1000,
      gamingTier: 10,
    });

    const candidates = createRecommendationCandidates({
      category: "gpu",
      parts: [rtx5060, rtx5070, rtx5070ti, rtx5090],
      requirement: createRequirement({ gpuTier: 8, vramGb: 12, psuWattage: 750 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });
    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).toContain(rtx5070.id);
    expect(rolePartIds).toContain(rtx5070ti.id);
    expect(rolePartIds).not.toContain(rtx5060.id);
    expect(rolePartIds).not.toContain(rtx5090.id);
  });

  it("excludes RTX 5090-class GPUs for the verified FHD PUBG non-enthusiast scenario", () => {
    const rtx5070 = createPart("gpu-rtx-5070", "gpu", {
      kind: "gpu",
      chipset: "RTX 5070",
      vramGb: 12,
      recommendedPsuW: 750,
      gamingTier: 8,
    });
    const rtx5080 = createPart("gpu-rtx-5080", "gpu", {
      kind: "gpu",
      chipset: "RTX 5080",
      vramGb: 16,
      recommendedPsuW: 850,
      gamingTier: 9,
    });
    const rtx5090 = createPart("gpu-rtx-5090", "gpu", {
      kind: "gpu",
      chipset: "RTX 5090",
      vramGb: 32,
      recommendedPsuW: 1000,
      gamingTier: 10,
    });

    const candidates = createRecommendationCandidates({
      category: "gpu",
      parts: [rtx5070, rtx5080, rtx5090],
      requirement: createRequirement({ cpuTier: 9, gpuTier: 9, ramGb: 32, vramGb: 12, psuWattage: 850 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });
    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).toContain(rtx5070.id);
    expect(rolePartIds).toContain(rtx5080.id);
    expect(rolePartIds).not.toContain(rtx5090.id);
  });

  it("does not treat 16GB VRAM alone as a halo GPU signal", () => {
    const rx9070xt = createPart("gpu-rx-9070-xt", "gpu", {
      kind: "gpu",
      chipset: "RX 9070 XT",
      vramGb: 16,
      recommendedPsuW: 850,
      gamingTier: 9,
    });
    const rtx5080 = createPart("gpu-rtx-5080", "gpu", {
      kind: "gpu",
      chipset: "RTX 5080",
      vramGb: 16,
      recommendedPsuW: 850,
      gamingTier: 9,
    });
    const rtx5090 = createPart("gpu-rtx-5090", "gpu", {
      kind: "gpu",
      chipset: "RTX 5090",
      vramGb: 32,
      recommendedPsuW: 1000,
      gamingTier: 10,
    });

    const candidates = createRecommendationCandidates({
      category: "gpu",
      parts: [rx9070xt, rtx5080, rtx5090],
      requirement: createRequirement({ cpuTier: 9, gpuTier: 9, ramGb: 32, vramGb: 16, psuWattage: 850 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });
    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).toContain(rx9070xt.id);
    expect(rolePartIds).toContain(rtx5080.id);
    expect(rolePartIds).not.toContain(rtx5090.id);
  });

  it("allows tier-10 GPUs when a true enthusiast signal is present", () => {
    const rtx5080 = createPart("gpu-rtx-5080", "gpu", {
      kind: "gpu",
      chipset: "RTX 5080",
      vramGb: 16,
      recommendedPsuW: 850,
      gamingTier: 9,
    });
    const rtx5090 = createPart("gpu-rtx-5090", "gpu", {
      kind: "gpu",
      chipset: "RTX 5090",
      vramGb: 32,
      recommendedPsuW: 1000,
      gamingTier: 10,
    });

    const candidates = createRecommendationCandidates({
      category: "gpu",
      parts: [rtx5080, rtx5090],
      requirement: createRequirement({
        cpuTier: 9,
        gpuTier: 9,
        ramGb: 32,
        vramGb: 16,
        psuWattage: 850,
        reasons: ["4K high refresh target"],
      }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });
    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).toContain(rtx5080.id);
    expect(rolePartIds).toContain(rtx5090.id);
  });

  it("excludes top X3D CPUs for the verified FHD PUBG non-enthusiast scenario", () => {
    const ryzen7800x3d = createPart("cpu-ryzen-7-7800x3d", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 7000",
      cores: 8,
      threads: 16,
      gamingTier: 9,
      tdpW: 120,
    });
    const ryzen9850x3d = createPart("cpu-ryzen-7-9850x3d", "cpu", {
      kind: "cpu",
      socket: "AM5",
      series: "Ryzen 9000",
      cores: 16,
      threads: 32,
      gamingTier: 10,
      tdpW: 170,
    });

    const candidates = createRecommendationCandidates({
      category: "cpu",
      parts: [ryzen7800x3d, ryzen9850x3d],
      requirement: createRequirement({ cpuTier: 9, gpuTier: 9, ramGb: 32, vramGb: 12, psuWattage: 850 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });
    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).toContain(ryzen7800x3d.id);
    expect(rolePartIds).not.toContain(ryzen9850x3d.id);
  });

  it("excludes 240GB SSDs from normal full-build recommendation roles", () => {
    const ssd240 = createPart("ssd-240gb", "ssd", {
      kind: "ssd",
      capacityGb: 240,
      interface: "SATA",
      formFactor: "2.5",
    });
    const ssd1tb = createPart("ssd-1tb", "ssd", {
      kind: "ssd",
      capacityGb: 1000,
      interface: "NVME",
      formFactor: "M.2",
    });
    const ssd2tb = createPart("ssd-2tb", "ssd", {
      kind: "ssd",
      capacityGb: 2000,
      interface: "NVME",
      formFactor: "M.2",
    });

    const candidates = createRecommendationCandidates({
      category: "ssd",
      parts: [ssd240, ssd1tb, ssd2tb],
      requirement: createRequirement(),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });

    expect(candidates.map((candidate) => candidate.part.id)).toContain(ssd1tb.id);
    expect(candidates.map((candidate) => candidate.part.id)).not.toContain(ssd240.id);
  });

  it("uses safe static seed SSD prices as candidate fallback when no Danawa match exists", () => {
    const ssd1tb = createPart("ssd-1tb-static-price", "ssd", {
      kind: "ssd",
      capacityGb: 1000,
      interface: "NVME",
      formFactor: "M.2",
    });
    const pricedSsd = {
      ...ssd1tb,
      offers: [createStaticOffer(ssd1tb, 135000)],
    };

    const candidates = createRecommendationCandidates({
      category: "ssd",
      parts: [pricedSsd],
      requirement: createRequirement(),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });

    expect(candidates[0]?.part.id).toBe(ssd1tb.id);
    expect(candidates[0]?.effectivePrice).toBe(135000);
    expect(candidates[0]?.bestOffer?.source.type).toBe("static");
  });

  it("keeps PSU roles inside the target wattage band", () => {
    const psu500 = createPart("psu-500w", "psu", {
      kind: "psu",
      wattage: 500,
      efficiency: "80PLUS Bronze",
    });
    const psu750 = createPart("psu-750w", "psu", {
      kind: "psu",
      wattage: 750,
      efficiency: "80PLUS Gold",
      atxVersion: "ATX 3.0",
    });
    const psu850 = createPart("psu-850w", "psu", {
      kind: "psu",
      wattage: 850,
      efficiency: "80PLUS Gold",
      atxVersion: "ATX 3.1",
    });
    const psu1200 = createPart("psu-1200w", "psu", {
      kind: "psu",
      wattage: 1200,
      efficiency: "80PLUS Platinum",
      atxVersion: "ATX 3.1",
    });

    const candidates = createRecommendationCandidates({
      category: "psu",
      parts: [psu500, psu750, psu850, psu1200],
      requirement: createRequirement({ psuWattage: 750 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });
    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).toContain(psu750.id);
    expect(rolePartIds).toContain(psu850.id);
    expect(rolePartIds).not.toContain(psu500.id);
    expect(rolePartIds).not.toContain(psu1200.id);
  });

  it("matches RAM capacity first and avoids no-price alternatives when priced candidates exist", () => {
    const ram16 = createPart("ram-16gb", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 16,
      moduleCount: 2,
      speedMhz: 5600,
    });
    const ram32NoPrice = createPart("ram-32gb-no-price", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 32,
      moduleCount: 2,
      speedMhz: 6000,
    });
    const ram32Priced = createPart("ram-32gb-priced", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 32,
      moduleCount: 2,
      speedMhz: 6000,
    });
    const ram64 = createPart("ram-64gb", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 64,
      moduleCount: 2,
      speedMhz: 6000,
    });

    const candidates = createRecommendationCandidates({
      category: "ram",
      parts: [ram16, ram32NoPrice, ram32Priced, ram64],
      requirement: createRequirement({ ramGb: 32 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [createPriceSnapshot("ram", [createMatchedOffer(ram32Priced, 140000)])],
    });
    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).toContain(ram32Priced.id);
    expect(rolePartIds).not.toContain(ram16.id);
    expect(rolePartIds).not.toContain(ram32NoPrice.id);
  });

  it("uses safe static seed RAM prices as candidate fallback when no Danawa match exists", () => {
    const ram32 = createPart("ram-32gb-static-price", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 32,
      moduleCount: 2,
      speedMhz: 6000,
    });
    const pricedRam = {
      ...ram32,
      offers: [createStaticOffer(ram32, 148000)],
    };

    const candidates = createRecommendationCandidates({
      category: "ram",
      parts: [pricedRam],
      requirement: createRequirement({ ramGb: 32 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });

    expect(candidates[0]?.part.id).toBe(ram32.id);
    expect(candidates[0]?.effectivePrice).toBe(148000);
    expect(candidates[0]?.bestOffer?.source.type).toBe("static");
  });

  it("does not make a 360mm AIO the default cooler for normal CPU heat", () => {
    const airCooler = createPart("cooler-air-priced", "cooler", {
      kind: "cooler",
      type: "air",
      supportedSockets: ["AM5"],
      heightMm: 155,
      coolingCapacityTier: "adequate",
    });
    const aio360 = createPart("cooler-aio-360", "cooler", {
      kind: "cooler",
      type: "liquid",
      supportedSockets: ["AM5"],
      radiatorSizeMm: 360,
      coolingCapacityTier: "strong",
    });

    const candidates = createRecommendationCandidates({
      category: "cooler",
      parts: [airCooler, aio360],
      requirement: createRequirement({ cpuTier: 6 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [createPriceSnapshot("cooler", [createMatchedOffer(airCooler, 52000)])],
    });

    expect(candidates.map((candidate) => candidate.part.id)).toContain(airCooler.id);
    expect(candidates.map((candidate) => candidate.part.id)).not.toContain(aio360.id);
  });

  it("excludes compact 270mm GPU-length cases before GPU selection for high GPU-tier requirements", () => {
    const compactCase = createPart("case-270mm", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 270,
      maxCoolerHeightMm: 165,
      color: "black",
    });
    const highTierCase = createPart("case-340mm", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 340,
      maxCoolerHeightMm: 165,
      color: "black",
    });

    const candidates = createRecommendationCandidates({
      category: "case",
      parts: [compactCase, highTierCase],
      requirement: createRequirement({ gpuTier: 9, psuWattage: 850 }),
      profile: createProfile(),
      preferences: createPreferences(),
      selectedPartIds: {},
      priceSnapshots: [],
    });
    const rolePartIds = candidates.map((candidate) => candidate.part.id);

    expect(rolePartIds).toContain(highTierCase.id);
    expect(rolePartIds).not.toContain(compactCase.id);
  });
});

function createRequirement(overrides: Partial<RequirementProfile> = {}): RequirementProfile {
  return {
    cpuTier: 5,
    gpuTier: 7,
    ramGb: 32 as const,
    vramGb: 12 as const,
    psuWattage: 650,
    reasons: [],
    warnings: [],
    ...overrides,
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

function createPriceSnapshot(category: PartCategory, offers: PriceOffer[]): PriceSnapshot {
  return {
    id: `snapshot-${category}`,
    searchQuery: `${category} price`,
    category,
    offers,
    confidence: "high",
    warnings: [],
    source: {
      type: "danawa-csv-price",
      name: "test price snapshot",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}

function createMatchedOffer(part: Part, basePrice: number): PriceOffer {
  return {
    id: `${part.id}-matched-offer`,
    partId: part.id,
    productName: part.name,
    mall: "테스트몰",
    basePrice,
    availability: "in-stock",
    priceType: "normal",
    confidence: "high",
    warnings: [],
    metadata: createOfferMetadata(part),
    source: {
      type: "danawa-csv-price",
      name: "test price snapshot",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}

function createStaticOffer(part: Part, basePrice: number): PriceOffer {
  return {
    id: `${part.id}-static-offer`,
    partId: part.id,
    productName: part.name,
    mall: "Seed",
    basePrice,
    availability: "in-stock",
    priceType: "normal",
    confidence: "medium",
    warnings: [],
    metadata: createOfferMetadata(part),
    source: {
      type: "static",
      name: "Static seed",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}

function createOfferMetadata(part: Part): PriceOffer["metadata"] {
  const specs = part.specs;

  if (specs.kind === "ram") {
    return {
      ramType: specs.type,
      ramCapacityGb: specs.totalGb,
      ramModuleCount: specs.moduleCount,
      ramSpeedMhz: specs.speedMhz,
    };
  }

  if (specs.kind === "cooler") {
    return {
      coolerType: specs.type === "liquid" ? "수랭" : "공랭",
      coolerRadiatorMm: specs.radiatorSizeMm,
      coolerHeightMm: specs.heightMm,
    };
  }

  return {};
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
