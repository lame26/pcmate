import type { Part, PartCategory, PartClassification, PartSpecs } from "@/types/parts";
import type { PriceOffer } from "@/types/pricing";

const UPDATED_AT = "2026-05-12T00:00:00.000Z";

function offer(
  id: string,
  partId: string,
  productName: string,
  mall: string,
  basePrice: number,
  benefitPrice?: number,
  cardProviderId?: string
): PriceOffer {
  return {
    id,
    partId,
    productName,
    mall,
    basePrice,
    benefitPrice,
    cardProviderId,
    shippingFee: 0,
    availability: "in-stock",
    priceType: benefitPrice ? "card" : "normal",
    source: {
      type: "static",
      name: "MVP seed offer",
      updatedAt: UPDATED_AT,
    },
    confidence: "medium",
    warnings: ["샘플 가격입니다. 실제 구매 전 가격과 조건 확인이 필요합니다."],
    updatedAt: UPDATED_AT,
  };
}

function classification(
  chipTier: string | undefined,
  brandLineTier: PartClassification["brandLineTier"],
  reasons: string[],
  options: Partial<PartClassification> = {}
): PartClassification {
  return {
    chipTier,
    brandLineTier,
    marketPosition: options.marketPosition ?? "fair",
    vrmTier: options.vrmTier,
    coolingTier: options.coolingTier,
    distributor: options.distributor,
    distributorScore: options.distributorScore,
    confidence: options.confidence ?? "medium",
    reasons,
  };
}

function part(
  id: string,
  category: PartCategory,
  name: string,
  brand: string,
  model: string,
  specs: PartSpecs,
  partClassification: PartClassification,
  basePrice: number,
  options: {
    aliases?: string[];
    benefitPrice?: number;
    cardProviderId?: string;
    mall?: string;
  } = {}
): Part {
  return {
    id,
    category,
    name,
    brand,
    model,
    aliases: options.aliases ?? [],
    specs,
    classification: partClassification,
    offers: [
      offer(
        `${id}-offer-1`,
        id,
        name,
        options.mall ?? "샘플몰",
        basePrice,
        options.benefitPrice,
        options.cardProviderId
      ),
    ],
    source: {
      type: "static",
      name: "MVP seed parts",
      updatedAt: UPDATED_AT,
    },
    confidence: "medium",
    updatedAt: UPDATED_AT,
  };
}

export const parts: Part[] = [
  part(
    "cpu-ryzen-5-7500f",
    "cpu",
    "AMD Ryzen 5 7500F",
    "AMD",
    "Ryzen 5 7500F",
    { kind: "cpu", socket: "AM5", generation: "Zen/Ryzen 7000", series: "Ryzen 7000", cores: 6, threads: 12, gamingTier: 6, productivityTier: 5, tdpW: 65 },
    classification("Ryzen 5", "mainstream", ["AM5 예산형 게이밍 기준 후보입니다."]),
    185000,
    { benefitPrice: 178000, cardProviderId: "samsung" }
  ),
  part(
    "cpu-ryzen-7-7800x3d",
    "cpu",
    "AMD Ryzen 7 7800X3D",
    "AMD",
    "Ryzen 7 7800X3D",
    { kind: "cpu", socket: "AM5", generation: "Zen/Ryzen 7000", series: "Ryzen 7000", cores: 8, threads: 16, gamingTier: 9, productivityTier: 7, tdpW: 120 },
    classification("Ryzen 7 X3D", "high", ["게임 성능 중심 추천 후보입니다."]),
    485000,
    { benefitPrice: 465000, cardProviderId: "hyundai" }
  ),
  part(
    "cpu-core-ultra-7-265k",
    "cpu",
    "Intel Core Ultra 7 265K",
    "Intel",
    "Core Ultra 7 265K",
    { kind: "cpu", socket: "LGA1851", generation: "Intel Core Ultra 200", series: "Intel Core Ultra 200", cores: 20, threads: 20, gamingTier: 8, productivityTier: 8, tdpW: 125 },
    classification("Core Ultra 7", "high", ["게임과 작업 균형 후보입니다."]),
    515000,
    { benefitPrice: 498000, cardProviderId: "shinhan" }
  ),

  part(
    "cooler-ag620",
    "cooler",
    "DeepCool AG620",
    "DeepCool",
    "AG620",
    { kind: "cooler", type: "air", supportedSockets: ["AM4", "AM5", "LGA1700", "LGA1851"], heightMm: 157 },
    classification(undefined, "mainstream", ["듀얼타워 공랭 예산형 후보입니다."], { coolingTier: "adequate" }),
    62000
  ),
  part(
    "cooler-pa120",
    "cooler",
    "Thermalright Peerless Assassin 120 SE",
    "Thermalright",
    "Peerless Assassin 120 SE",
    { kind: "cooler", type: "air", supportedSockets: ["AM4", "AM5", "LGA1700"], heightMm: 155 },
    classification(undefined, "mainstream", ["가격 대비 쿨링 성능을 우선한 후보입니다."], { coolingTier: "adequate" }),
    48000
  ),
  part(
    "cooler-arctic-lf3-360",
    "cooler",
    "ARCTIC Liquid Freezer III 360",
    "ARCTIC",
    "Liquid Freezer III 360",
    { kind: "cooler", type: "liquid", supportedSockets: ["AM4", "AM5", "LGA1700", "LGA1851"], radiatorSizeMm: 360 },
    classification(undefined, "high", ["고성능 CPU와 소음 여유를 위한 수랭 후보입니다."], { coolingTier: "strong" }),
    165000,
    { benefitPrice: 158000, cardProviderId: "samsung" }
  ),

  part(
    "mb-msi-b650m-mortar",
    "motherboard",
    "MSI MAG B650M MORTAR WIFI",
    "MSI",
    "MAG B650M MORTAR WIFI",
    {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "M-ATX",
      ramType: "DDR5",
      m2Slots: 2,
      supportedCpuSeries: ["Ryzen 7000", "Ryzen 8000", "Ryzen 9000"],
      biosSupportNotes: ["Ryzen 9000 사용 시 출고 BIOS 버전 확인 필요"],
    },
    classification("B650", "upper-mainstream", ["AM5 M-ATX 균형형 보드입니다."], {
      vrmTier: "strong",
      distributor: "국내 유통사",
    }),
    245000
  ),
  part(
    "mb-asus-tuf-b650-plus",
    "motherboard",
    "ASUS TUF Gaming B650-PLUS WIFI",
    "ASUS",
    "TUF Gaming B650-PLUS WIFI",
    {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B650",
      formFactor: "ATX",
      ramType: "DDR5",
      m2Slots: 3,
      supportedCpuSeries: ["Ryzen 7000", "Ryzen 8000", "Ryzen 9000"],
      biosSupportNotes: ["Ryzen 9000 사용 시 출고 BIOS 버전 확인 필요"],
    },
    classification("B650", "upper-mainstream", ["ATX 구성과 기능 확장성을 고려한 후보입니다."], {
      vrmTier: "strong",
      distributor: "국내 유통사",
    }),
    285000,
    { benefitPrice: 274000, cardProviderId: "hyundai" }
  ),
  part(
    "mb-msi-b850m-mortar",
    "motherboard",
    "MSI MAG B850M MORTAR WIFI",
    "MSI",
    "MAG B850M MORTAR WIFI",
    {
      kind: "motherboard",
      socket: "AM5",
      chipset: "B850",
      formFactor: "M-ATX",
      ramType: "DDR5",
      m2Slots: 3,
      supportedCpuSeries: ["Ryzen 7000", "Ryzen 8000", "Ryzen 9000"],
    },
    classification("B850", "upper-mainstream", ["신규 칩셋과 M.2 확장성을 고려한 후보입니다."], {
      vrmTier: "strong",
      distributor: "국내 유통사",
    }),
    315000,
    { benefitPrice: 299000, cardProviderId: "samsung" }
  ),

  part(
    "ram-ddr5-32-6000-cl30",
    "ram",
    "ESSENCORE KLEVV DDR5-6000 CL30 32GB",
    "ESSENCORE",
    "KLEVV DDR5-6000 CL30 32GB",
    { kind: "ram", type: "DDR5", totalGb: 32, moduleCount: 2, speedMhz: 6000, timing: "CL30", profile: "EXPO" },
    classification("DDR5-6000 CL30", "upper-mainstream", ["AM5 기준 균형 잡힌 32GB 구성입니다."]),
    142000,
    { benefitPrice: 136000, cardProviderId: "shinhan" }
  ),
  part(
    "ram-ddr5-32-5600",
    "ram",
    "Samsung DDR5-5600 32GB",
    "Samsung",
    "DDR5-5600 32GB",
    { kind: "ram", type: "DDR5", totalGb: 32, moduleCount: 2, speedMhz: 5600, profile: "none" },
    classification("DDR5-5600", "mainstream", ["튜닝보다 안정성과 가격을 우선한 후보입니다."]),
    118000
  ),
  part(
    "ram-ddr5-64-6000-cl32",
    "ram",
    "G.SKILL DDR5-6000 CL32 64GB",
    "G.SKILL",
    "DDR5-6000 CL32 64GB",
    { kind: "ram", type: "DDR5", totalGb: 64, moduleCount: 2, speedMhz: 6000, timing: "CL32", profile: "EXPO" },
    classification("DDR5-6000 64GB", "high", ["Docker, 작업, 로컬 AI 후보를 위한 64GB 구성입니다."]),
    285000,
    { benefitPrice: 272000, cardProviderId: "hyundai" }
  ),

  part(
    "gpu-rtx-4060-ti-16g",
    "gpu",
    "MSI GeForce RTX 4060 Ti VENTUS 2X 16GB",
    "MSI",
    "RTX 4060 Ti VENTUS 2X 16GB",
    { kind: "gpu", chipset: "RTX 4060 Ti", vramGb: 16, lengthMm: 199, recommendedPsuW: 650, powerConnectors: ["8-pin"], gamingTier: 6, rayTracingTier: 5 },
    classification("RTX 4060 Ti", "mainstream", ["VRAM 16GB가 필요한 예산형 NVIDIA 후보입니다."], {
      coolingTier: "adequate",
      marketPosition: "fair",
    }),
    545000,
    { benefitPrice: 519000, cardProviderId: "samsung" }
  ),
  part(
    "gpu-rtx-5070-ventus",
    "gpu",
    "MSI GeForce RTX 5070 VENTUS 3X OC 12GB",
    "MSI",
    "RTX 5070 VENTUS 3X OC 12GB",
    { kind: "gpu", chipset: "RTX 5070", vramGb: 12, lengthMm: 303, recommendedPsuW: 750, powerConnectors: ["12V2x6"], gamingTier: 8, rayTracingTier: 8 },
    classification("RTX 5070", "mainstream", ["QHD 고주사율 기준 추천형 NVIDIA 후보입니다."], {
      coolingTier: "adequate",
      marketPosition: "fair",
    }),
    975000,
    { benefitPrice: 909000, cardProviderId: "samsung", mall: "롯데하이마트" }
  ),
  part(
    "gpu-rx-9070-xt",
    "gpu",
    "SAPPHIRE Radeon RX 9070 XT PULSE 16GB",
    "SAPPHIRE",
    "RX 9070 XT PULSE 16GB",
    { kind: "gpu", chipset: "RX 9070 XT", vramGb: 16, lengthMm: 320, recommendedPsuW: 750, powerConnectors: ["8-pin", "8-pin"], gamingTier: 8, rayTracingTier: 6 },
    classification("RX 9070 XT", "upper-mainstream", ["VRAM 16GB와 라데온 가능 조건에서 비교할 후보입니다."], {
      coolingTier: "adequate",
      marketPosition: "fair",
    }),
    925000,
    { benefitPrice: 898000, cardProviderId: "hyundai" }
  ),

  part(
    "ssd-sk-p41-1tb",
    "ssd",
    "SK hynix Platinum P41 1TB",
    "SK hynix",
    "Platinum P41 1TB",
    { kind: "ssd", capacityGb: 1000, interface: "NVME", formFactor: "M.2" },
    classification("PCIe 4.0 NVMe", "high", ["OS와 주요 게임용 고성능 NVMe 후보입니다."]),
    119000
  ),
  part(
    "ssd-samsung-990-evo-2tb",
    "ssd",
    "Samsung 990 EVO Plus 2TB",
    "Samsung",
    "990 EVO Plus 2TB",
    { kind: "ssd", capacityGb: 2000, interface: "NVME", formFactor: "M.2" },
    classification("PCIe 4.0 NVMe", "upper-mainstream", ["게임 라이브러리 여유를 고려한 2TB 후보입니다."]),
    195000,
    { benefitPrice: 184000, cardProviderId: "shinhan" }
  ),
  part(
    "ssd-crucial-p3-plus-1tb",
    "ssd",
    "Crucial P3 Plus 1TB",
    "Crucial",
    "P3 Plus 1TB",
    { kind: "ssd", capacityGb: 1000, interface: "NVME", formFactor: "M.2" },
    classification("PCIe 4.0 NVMe", "mainstream", ["가격을 우선한 보조 저장장치 후보입니다."]),
    79000
  ),

  part(
    "psu-micronics-850-gold",
    "psu",
    "Micronics Classic II 850W Gold Full Modular ATX3.1",
    "Micronics",
    "Classic II 850W Gold ATX3.1",
    { kind: "psu", wattage: 850, efficiency: "80PLUS Gold", atxVersion: "ATX 3.1", gpuConnectors: ["12V2x6", "8-pin"], modular: "full" },
    classification("850W Gold", "upper-mainstream", ["중상급 GPU 기준 여유 있는 ATX 3.1 후보입니다."]),
    149000,
    { benefitPrice: 142000, cardProviderId: "samsung" }
  ),
  part(
    "psu-seasonic-focus-750",
    "psu",
    "Seasonic FOCUS GX-750 Gold",
    "Seasonic",
    "FOCUS GX-750",
    { kind: "psu", wattage: 750, efficiency: "80PLUS Gold", atxVersion: "ATX 3.0", gpuConnectors: ["12VHPWR", "8-pin"], modular: "full" },
    classification("750W Gold", "high", ["플랫폼 신뢰도를 우선한 750W 후보입니다."]),
    168000
  ),
  part(
    "psu-superflower-1000",
    "psu",
    "SuperFlower Leadex VII Gold 1000W ATX3.1",
    "SuperFlower",
    "Leadex VII Gold 1000W",
    { kind: "psu", wattage: 1000, efficiency: "80PLUS Gold", atxVersion: "ATX 3.1", gpuConnectors: ["12V2x6", "8-pin"], modular: "full" },
    classification("1000W Gold", "high", ["상급 GPU와 장기 여유를 고려한 후보입니다."]),
    229000,
    { benefitPrice: 214000, cardProviderId: "hyundai" }
  ),

  part(
    "case-3rsys-l600-quiet",
    "case",
    "3RSYS L600 Quiet Black",
    "3RSYS",
    "L600 Quiet Black",
    { kind: "case", supportedFormFactors: ["M-ATX", "ATX"], maxGpuLengthMm: 400, maxCoolerHeightMm: 170, topRadiatorMm: 360, frontRadiatorMm: 360, color: "black" },
    classification(undefined, "mainstream", ["저소음과 확장성을 고려한 미들타워 후보입니다."]),
    95000
  ),
  part(
    "case-dl-d21-mesh",
    "case",
    "DarkFlash DLX21 Mesh Black",
    "DarkFlash",
    "DLX21 Mesh Black",
    { kind: "case", supportedFormFactors: ["M-ATX", "ATX", "E-ATX"], maxGpuLengthMm: 400, maxCoolerHeightMm: 180, topRadiatorMm: 360, frontRadiatorMm: 360, color: "black" },
    classification(undefined, "mainstream", ["메쉬 전면과 넓은 호환성을 가진 후보입니다."]),
    98000,
    { benefitPrice: 93000, cardProviderId: "shinhan" }
  ),
  part(
    "case-lancool-207-white",
    "case",
    "LIAN LI LANCOOL 207 White",
    "LIAN LI",
    "LANCOOL 207 White",
    { kind: "case", supportedFormFactors: ["M-ATX", "ATX"], maxGpuLengthMm: 375, maxCoolerHeightMm: 180, topRadiatorMm: 360, frontRadiatorMm: 360, color: "white" },
    classification(undefined, "upper-mainstream", ["화이트 감성과 쿨링 구성을 고려한 후보입니다."]),
    139000,
    { benefitPrice: 132000, cardProviderId: "samsung" }
  ),
];
