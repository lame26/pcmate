import { describe, expect, it } from "vitest";

import { getOfferMatchDiagnostics, isStrictSameProductOffer } from "@/lib/pricing/offer-match";
import type { Part } from "@/types/parts";
import type { PriceOffer } from "@/types/pricing";

describe("isStrictSameProductOffer", () => {
  it("matches MSI B650M MORTAR aliases with Korean Danawa names", () => {
    const part = createPart("mb-b650-mortar", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
    }, "MSI MAG B650M MORTAR WIFI");
    const offer = createOffer("MSI MAG B650M 박격포 WIFI", {
      motherboardSocket: "AM5",
      motherboardChipset: "B650",
      motherboardFormFactor: "Micro-ATX",
      motherboardRamType: "DDR5",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("does not attach B760 offers to B650 AM5 motherboards", () => {
    const part = createPart("mb-b650", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
    }, "MSI MAG B650M MORTAR WIFI");
    const offer = createOffer("MSI MAG B760M 박격포 II", {
      motherboardSocket: "인텔(소켓1700)",
      motherboardChipset: "B760",
      motherboardFormFactor: "M-ATX",
      motherboardRamType: "DDR5",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("matches ASUS TUF aliases with Korean Danawa names", () => {
    const part = createPart("mb-tuf-b650", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "ATX",
      ramType: "DDR5",
    }, "ASUS TUF Gaming B650-PLUS WIFI");
    const offer = createOffer("ASUS 터프 Gaming B650-PLUS WIFI", {
      motherboardSocket: "AM5",
      motherboardChipset: "B650",
      motherboardFormFactor: "ATX",
      motherboardRamType: "DDR5",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("does not auto-match B850 offers to B650 seed boards", () => {
    const part = createPart("mb-b650", "motherboard", {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "ATX",
      ramType: "DDR5",
    }, "ASUS TUF Gaming B650-PLUS WIFI");
    const offer = createOffer("ASUS 터프 Gaming B850-PLUS WIFI", {
      motherboardSocket: "AM5",
      motherboardChipset: "B850",
      motherboardFormFactor: "ATX",
      motherboardRamType: "DDR5",
    });

    const diagnostics = getOfferMatchDiagnostics(part, offer);

    expect(diagnostics.status).not.toBe("match");
    expect(diagnostics.mismatchedFields).toContain("chipset");
  });

  it("matches ESSENCORE KLEVV DDR5 aliases with Korean Danawa names", () => {
    const part = createPart("ram-klevv-ddr5", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 32,
      speedMhz: 6000,
      timing: "CL30",
    }, "ESSENCORE KLEVV DDR5-6000 CL30 32GB");
    const offer = createOffer("에센코어 클레브 DDR5 6000 CL30 32GB", {
      ramType: "DDR5",
      ramCapacityGb: 32,
      ramSpeedMhz: 6000,
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("does not attach DDR4 RAM offers to DDR5 seed RAM", () => {
    const part = createPart("ram-ddr5", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 32,
      moduleCount: 2,
      speedMhz: 6000,
      timing: "CL30",
    }, "ESSENCORE KLEVV DDR5-6000 CL30 32GB");
    const offer = createOffer("ESSENCORE KLEVV DDR4-3200 CL22 32GB", {
      ramType: "DDR4",
      ramCapacityGb: 32,
      ramSpeedMhz: 3200,
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("does not attach different RAM capacities", () => {
    const part = createPart("ram-ddr5-32", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 32,
      speedMhz: 6000,
    }, "ESSENCORE KLEVV DDR5-6000 CL30 32GB");
    const offer = createOffer("에센코어 클레브 DDR5 6000 CL30 64GB", {
      ramType: "DDR5",
      ramCapacityGb: 64,
      ramSpeedMhz: 6000,
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("does not auto-match different DDR5 RAM speeds", () => {
    const part = createPart("ram-ddr5-6000", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 32,
      speedMhz: 6000,
    }, "ESSENCORE KLEVV DDR5-6000 CL30 32GB");
    const offer = createOffer("에센코어 클레브 DDR5 5600 CL36 32GB", {
      ramType: "DDR5",
      ramCapacityGb: 32,
      ramSpeedMhz: 5600,
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("normalizes RAM PC rating and module-count notation", () => {
    const part = createPart("ram-ddr5-kit", "ram", {
      kind: "ram",
      type: "DDR5",
      totalGb: 32,
      moduleCount: 2,
      speedMhz: 6000,
    }, "ESSENCORE KLEVV DDR5-6000 32GB(16Gx2)");
    const offer = createOffer("에센코어 클레브 PC5-48000 2x16GB", {
      ramType: "DDR5",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("matches SK hynix P41 aliases with Korean Danawa names", () => {
    const part = createPart("ssd-p41", "ssd", {
      kind: "ssd",
      capacityGb: 1000,
      interface: "NVME",
      formFactor: "M.2",
    }, "SK hynix Platinum P41 1TB");
    const offer = createOffer("SK하이닉스 P41 1TB", {
      ssdCapacityText: "1TB",
      ssdInterface: "PCIe 4.0 NVMe",
      ssdFormFactor: "M.2",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("does not attach Crucial P310 offers to SK hynix P41 SSD", () => {
    const part = createPart("ssd-p41", "ssd", {
      kind: "ssd",
      capacityGb: 1000,
      interface: "NVME",
      formFactor: "M.2",
    }, "SK hynix Platinum P41 1TB");
    const offer = createOffer("Crucial P310 500GB", {
      ssdCapacityText: "500GB",
      ssdInterface: "PCIe 4.0 NVMe",
      ssdFormFactor: "M.2",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("does not attach different SSD capacities", () => {
    const part = createPart("ssd-p41", "ssd", {
      kind: "ssd",
      capacityGb: 1000,
      interface: "NVME",
      formFactor: "M.2",
    }, "SK hynix Platinum P41 1TB");
    const offer = createOffer("SK하이닉스 P41 500GB", {
      ssdCapacityText: "500GB",
      ssdInterface: "PCIe 4.0 NVMe",
      ssdFormFactor: "M.2",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("matches Samsung 990 EVO Korean notation", () => {
    const part = createPart("ssd-990-evo", "ssd", {
      kind: "ssd",
      capacityGb: 2000,
      interface: "NVME",
      formFactor: "M.2",
    }, "Samsung 990 EVO Plus 2TB");
    const offer = createOffer("삼성 990에보 Plus 2TB", {
      ssdCapacityText: "2TB",
      ssdInterface: "PCIe 5.0 NVMe",
      ssdFormFactor: "M.2",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("matches Micronics PSU aliases and 16-pin connector notation", () => {
    const part = createPart("psu-micronics-850", "psu", {
      kind: "psu",
      wattage: 850,
      atxVersion: "ATX 3.1",
      gpuConnectors: ["12V-2x6"],
      modular: "full",
    }, "Micronics Classic II 850W Gold ATX3.1");
    const offer = createOffer("마이크로닉스 Classic II 850W GOLD ATX 3.1 16핀", {
      psuWattageW: 850,
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("does not attach different PSU wattages", () => {
    const part = createPart("psu-850", "psu", {
      kind: "psu",
      wattage: 850,
      atxVersion: "ATX 3.1",
      gpuConnectors: ["12V2x6"],
      modular: "full",
    }, "Seasonic FOCUS GX-850 ATX3.1");
    const offer = createOffer("Seasonic FOCUS GX-750 ATX3.1", {
      psuWattageW: 750,
      psuAtxVersion: "ATX 3.1",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("does not auto-match different PSU ATX generations", () => {
    const part = createPart("psu-850", "psu", {
      kind: "psu",
      wattage: 850,
      atxVersion: "ATX 3.1",
      gpuConnectors: ["12V-2x6"],
      modular: "full",
    }, "Micronics Classic II 850W Gold ATX3.1");
    const offer = createOffer("마이크로닉스 Classic II 850W GOLD ATX 2.x 16핀", {
      psuWattageW: 850,
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("matches MSI RTX 5070 VENTUS aliases", () => {
    const part = createPart("gpu-5070", "gpu", {
      kind: "gpu",
      chipset: "RTX 5070",
      vramGb: 12,
      lengthMm: 300,
      recommendedPsuW: 650,
      powerConnectors: ["12V2x6"],
    }, "MSI RTX 5070 VENTUS 12GB");
    const offer = createOffer("MSI RTX 5070 벤투스 12GB", {
      gpuChipset: "RTX 5070",
      danawaSpecText: "RTX 5070 / D7 12GB",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("does not attach RTX 5080 offers to RTX 5070 seed GPU", () => {
    const part = createPart("gpu-5070", "gpu", {
      kind: "gpu",
      chipset: "RTX 5070",
      vramGb: 12,
      lengthMm: 300,
      recommendedPsuW: 650,
      powerConnectors: ["12V2x6"],
    });
    const offer = createOffer("MSI 지포스 RTX 5080 게이밍 16GB", {
      gpuChipset: "RTX 5080",
      danawaSpecText: "RTX 5080 / D7 16GB",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("does not attach RTX 5070 Ti 16GB offers to RTX 5070 12GB GPUs", () => {
    const part = createPart("gpu-5070", "gpu", {
      kind: "gpu",
      chipset: "RTX 5070",
      vramGb: 12,
      powerConnectors: ["12V2x6"],
    }, "MSI RTX 5070 VENTUS 12GB");
    const offer = createOffer("MSI RTX 5070 Ti 벤투스 16GB", {
      gpuChipset: "RTX 5070 Ti",
      danawaSpecText: "RTX 5070 Ti / D7 16GB",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("matches Sapphire RX 9070 XT PULSE aliases", () => {
    const part = createPart("gpu-9070xt", "gpu", {
      kind: "gpu",
      chipset: "RX 9070 XT",
      vramGb: 16,
      powerConnectors: ["8-pin", "8-pin"],
    }, "Sapphire RX 9070 XT PULSE 16GB");
    const offer = createOffer("사파이어 RX 9070 XT 펄스 16GB", {
      gpuChipset: "RX 9070 XT",
      danawaSpecText: "RX 9070 XT / D6 16GB",
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("matches ARCTIC Liquid Freezer III 360 aliases", () => {
    const part = createPart("cooler-arctic-360", "cooler", {
      kind: "cooler",
      type: "liquid",
      radiatorSizeMm: 360,
      supportedSockets: ["AM5", "LGA1851"],
    }, "ARCTIC Liquid Freezer III 360");
    const offer = createOffer("아틱 Liquid Freezer III 360", {
      coolerType: "수랭",
      coolerRadiatorMm: 360,
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(true);
  });

  it("does not attach 240mm liquid cooler offers to 360mm coolers", () => {
    const part = createPart("cooler-360", "cooler", {
      kind: "cooler",
      type: "liquid",
      radiatorSizeMm: 360,
    }, "ARCTIC Liquid Freezer III 360");
    const offer = createOffer("아틱 Liquid Freezer III 240", {
      coolerType: "수랭",
      coolerRadiatorMm: 240,
    });

    expect(isStrictSameProductOffer(part, offer)).toBe(false);
  });

  it("does not attach fan, thermal, or bracket offers to CPU coolers", () => {
    const part = createPart("cooler-360", "cooler", {
      kind: "cooler",
      type: "liquid",
      radiatorSizeMm: 360,
    }, "ARCTIC Liquid Freezer III 360");

    expect(isStrictSameProductOffer(part, createOffer("ARCTIC 시스템팬 120mm", {}))).toBe(false);
    expect(isStrictSameProductOffer(part, createOffer("ARCTIC 써멀구리스 MX-6", {}))).toBe(false);
    expect(isStrictSameProductOffer(part, createOffer("ARCTIC 브라켓 키트", {}))).toBe(false);
  });

  it("matches case color aliases but keeps model numbers strict", () => {
    const part = createPart("case-l600", "case", {
      kind: "case",
      supportedFormFactors: ["M-ATX", "ATX"],
      maxGpuLengthMm: 360,
      color: "black",
    }, "3RSYS L600 Quiet Black");

    expect(isStrictSameProductOffer(part, createOffer("3RSYS L600 Quiet 블랙", {}))).toBe(true);
    expect(isStrictSameProductOffer(part, createOffer("3RSYS L330 Quiet 블랙", {}))).toBe(false);
  });
});

function createPart(id: string, category: Part["category"], specs: Part["specs"], name = id): Part {
  return {
    id,
    category,
    name,
    brand: "Test",
    model: name,
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

function createOffer(productName: string, metadata: PriceOffer["metadata"]): PriceOffer {
  return {
    id: productName,
    productName,
    mall: "다나와",
    basePrice: 100000,
    availability: "in-stock",
    priceType: "normal",
    confidence: "high",
    warnings: [],
    metadata,
    source: {
      type: "danawa-ranking",
      updatedAt: "2026-05-12T00:00:00.000Z",
    },
    updatedAt: "2026-05-12T00:00:00.000Z",
  };
}
