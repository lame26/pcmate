import type { Confidence } from "@/types/build";
import type { Part, PartCategory, PartClassification, PartSpecs } from "@/types/parts";
import type { PriceOffer, PriceSnapshot } from "@/types/pricing";

export function normalizeDanawaSnapshotsToParts(snapshots: PriceSnapshot[], category?: PartCategory): Part[] {
  const parts = snapshots
    .filter((snapshot) => snapshot.source.type === "danawa-ranking")
    .filter((snapshot) => !category || snapshot.category === category)
    .flatMap((snapshot) => snapshot.offers.map((offer) => normalizeDanawaOfferToPart(offer, snapshot.category)))
    .filter((part): part is Part => Boolean(part));

  return Array.from(new Map(parts.map((part) => [part.id, part])).values());
}

export function normalizeDanawaOfferToPart(offer: PriceOffer, category?: PartCategory): Part | undefined {
  if (!category || !offer.pcode) return undefined;

  const specs = createSpecs(category, offer);
  if (!specs) return undefined;

  const id = `danawa-${category}-${offer.pcode}`;
  const classification = createClassification(category, offer);
  const normalizedOffer: PriceOffer = {
    ...offer,
    id: `${offer.id}-normalized`,
    partId: id,
  };

  return {
    id,
    category,
    name: offer.productName,
    brand: extractBrand(offer.productName),
    model: offer.productName,
    aliases: [offer.pcode],
    specs,
    classification,
    offers: [normalizedOffer],
    source: {
      ...offer.source,
      name: `${offer.source.name ?? "Danawa"} normalized part`,
    },
    confidence: offer.confidence,
    updatedAt: offer.updatedAt,
  };
}

function createSpecs(category: PartCategory, offer: PriceOffer): PartSpecs | undefined {
  if (category === "gpu") return createGpuSpecs(offer);
  if (category === "case") return createCaseSpecs(offer);
  if (category === "psu") return createPsuSpecs(offer);
  if (category === "motherboard") return createMotherboardSpecs(offer);
  if (category === "ram") return createRamSpecs(offer);
  if (category === "ssd") return createSsdSpecs(offer);
  if (category === "cooler") return createCoolerSpecs(offer);
  if (category === "cpu") return createCpuSpecs(offer);

  return undefined;
}

function createGpuSpecs(offer: PriceOffer): PartSpecs {
  const text = `${offer.productName} ${specText(offer)}`;
  const chipset = readString(offer, "gpuChipset") ?? extractGpuChipset(text) ?? offer.productName;

  return {
    kind: "gpu",
    chipset,
    vramGb: extractVramGb(text),
    lengthMm: readNumber(offer, "gpuLengthMm"),
    thicknessMm: readNumber(offer, "gpuThicknessMm"),
    slotWidth: readNumber(offer, "gpuSlotWidth"),
    recommendedPsuW: readNumber(offer, "gpuRecommendedPsuW"),
    powerConnectors: parseGpuConnectors(readString(offer, "gpuPowerConnector")),
    gamingTier: estimateGpuTier(chipset),
    rayTracingTier: estimateGpuTier(chipset),
  };
}

function createCaseSpecs(offer: PriceOffer): PartSpecs {
  return {
    kind: "case",
    supportedFormFactors: parseFormFactors(readString(offer, "caseSupportedFormFactors")),
    maxGpuLengthMm: readNumber(offer, "caseMaxGpuLengthMm"),
    gpuSlotCount: readNumber(offer, "caseGpuSlotCount"),
    maxCoolerHeightMm: readNumber(offer, "caseMaxCoolerHeightMm"),
    color: inferColor(offer.productName),
  };
}

function createPsuSpecs(offer: PriceOffer): PartSpecs {
  const text = specText(offer);

  return {
    kind: "psu",
    wattage: readNumber(offer, "psuWattageW") ?? extractNumber(text, /(\d{3,4})\s*W/i),
    efficiency: readString(offer, "psuEfficiency"),
    atxVersion: parseAtxVersion(readString(offer, "psuAtxVersion") ?? text),
    gpuConnectors: parseGpuConnectors(readString(offer, "psuConnectorText") ?? text),
    pcie8pinCount: readNumber(offer, "psuPcie8pinCount"),
    has12vhpwr: readBoolean(offer, "psuHas12vhpwr"),
    has12v2x6: readBoolean(offer, "psuHas12v2x6"),
    native12v2x6: readBoolean(offer, "psuHas12v2x6"),
    qualityTier: inferPsuQualityTier(offer),
    modular: parseModular(readString(offer, "psuModularText") ?? text),
  };
}

function createMotherboardSpecs(offer: PriceOffer): PartSpecs {
  return {
    kind: "motherboard",
    socket: normalizeSocket(readString(offer, "motherboardSocket")),
    chipset: readString(offer, "motherboardChipset"),
    formFactor: parseFormFactors(readString(offer, "motherboardFormFactor"))?.[0],
    ramType: parseRamType(readString(offer, "motherboardRamType") ?? specText(offer)),
    m2Slots: extractNumber(readString(offer, "motherboardM2SlotText") ?? "", /(\d+)/),
    supportedCpuSeries: parseCsv(readString(offer, "motherboardSupportedCpuSeries")) ?? inferSupportedCpuSeries(readString(offer, "motherboardChipset")),
    biosSupportNotes: parseCsv(readString(offer, "motherboardBiosSupportNotes")),
  };
}

function createRamSpecs(offer: PriceOffer): PartSpecs {
  const text = specText(offer);

  return {
    kind: "ram",
    type: parseRamType(readString(offer, "ramType") ?? text),
    totalGb: readNumber(offer, "ramCapacityGb") ?? extractNumber(text, /(\d+)\s*GB/i),
    moduleCount: extractNumber(text, /x\s*(\d+)/i),
    speedMhz: readNumber(offer, "ramSpeedMhz"),
    timing: readString(offer, "ramTiming"),
  };
}

function createSsdSpecs(offer: PriceOffer): PartSpecs {
  const text = specText(offer);

  return {
    kind: "ssd",
    capacityGb: parseCapacityGb(readString(offer, "ssdCapacityText") ?? text),
    interface: parseSsdInterface(readString(offer, "ssdInterface") ?? text),
    formFactor: parseSsdFormFactor(readString(offer, "ssdFormFactor") ?? text),
  };
}

function createCoolerSpecs(offer: PriceOffer): PartSpecs {
  const text = specText(offer);
  const radiatorSize = readNumber(offer, "coolerRadiatorMm");
  const coolerType = readString(offer, "coolerType");

  return {
    kind: "cooler",
    type: radiatorSize || /수랭|liquid|aio/i.test(coolerType ?? text) ? "liquid" : "air",
    supportedSockets: parseCoolerSockets(readString(offer, "coolerSupportedSockets") ?? text),
    heightMm: readNumber(offer, "coolerHeightMm"),
    radiatorSizeMm: isRadiatorSize(radiatorSize) ? radiatorSize : undefined,
    tdpCapacityW: readNumber(offer, "coolerTdpCapacityW"),
    coolingCapacityTier: inferCoolingCapacityTier(offer, radiatorSize),
  };
}

function createCpuSpecs(offer: PriceOffer): PartSpecs {
  const text = specText(offer);
  const cores = parseCpuCores(offer, text);

  return {
    kind: "cpu",
    socket: normalizeSocket(readString(offer, "cpuSocket")) ?? inferCpuSocketFromName(offer.productName),
    generation: readString(offer, "cpuGeneration") ?? inferCpuGeneration(offer.productName),
    series: readString(offer, "cpuSeries") ?? inferCpuSeries(offer.productName),
    cores,
    threads: parseCpuThreads(offer, text, cores),
    tdpW: readNumber(offer, "cpuTdpW"),
    gamingTier: estimateCpuTier(offer.productName),
    productivityTier: estimateCpuTier(offer.productName),
  };
}

function parseCpuCores(offer: PriceOffer, text: string) {
  return (
    readNumber(offer, "cpuCores") ??
    extractNumber(readString(offer, "cpuCoreText") ?? "", /(\d+)\s*(?:코어|core|cores|C\b)/i) ??
    extractNumber(text, /(\d+)\s*(?:코어|core|cores|C\b)/i)
  );
}

function parseCpuThreads(offer: PriceOffer, text: string, cores?: number) {
  const threads =
    readNumber(offer, "cpuThreads") ??
    extractNumber(readString(offer, "cpuThreadText") ?? "", /(\d+)\s*(?:스레드|쓰레드|thread|threads|T\b)/i) ??
    extractNumber(text, /(\d+)\s*(?:스레드|쓰레드|thread|threads|T\b)/i);

  if (threads !== undefined && cores !== undefined && threads < cores) return undefined;
  return threads;
}

function createClassification(category: PartCategory, offer: PriceOffer): PartClassification {
  const confidence: Confidence = offer.confidence === "high" ? "medium" : offer.confidence;

  return {
    chipTier: category === "gpu" ? readString(offer, "gpuChipset") : undefined,
    brandLineTier: inferLineTier(category, offer),
    marketPosition: "unknown",
    confidence,
    reasons: [
      `다나와 ${readNumber(offer, "danawaRank") ?? "상위"}위 상품을 정규화한 후보입니다.`,
      "리스트 스펙에서 확인되지 않은 필드는 임의 기본값으로 채우지 않았습니다.",
    ],
  };
}

function readString(offer: PriceOffer, key: string) {
  const value = offer.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(offer: PriceOffer, key: string) {
  const value = offer.metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readBoolean(offer: PriceOffer, key: string) {
  const value = offer.metadata?.[key];
  return typeof value === "boolean" ? value : undefined;
}

function specText(offer: PriceOffer) {
  return readString(offer, "danawaSpecText") ?? offer.rawText ?? "";
}

function extractBrand(name: string) {
  return name.split(" ")[0] || "Danawa";
}

function inferColor(name: string): "black" | "white" | "other" {
  const normalized = name.toLowerCase();
  if (normalized.includes("white") || name.includes("화이트")) return "white";
  if (normalized.includes("black") || name.includes("블랙")) return "black";
  return "other";
}

function parseGpuConnectors(value?: string) {
  if (!value) return undefined;

  const connectors: string[] = [];
  if (/12V-?2x6|12V2x6/i.test(value)) connectors.push("12V2x6");
  if (/12VHPWR/i.test(value)) connectors.push("12VHPWR");
  if (/(^|[^0-9])8\s*핀|8-pin|6\+2/i.test(value)) connectors.push("8-pin");
  if (/(^|[^0-9])6\s*핀|6-pin/i.test(value) && !/6\+2/i.test(value)) connectors.push("6-pin");

  return connectors.length ? Array.from(new Set(connectors)) : undefined;
}

function parseFormFactors(value?: string) {
  if (!value) return undefined;

  const result: Array<"Mini-ITX" | "M-ATX" | "ATX" | "E-ATX"> = [];
  if (/E-ATX/i.test(value)) result.push("E-ATX");
  if (/(^|[\s,/])ATX(?=$|[\s,/()])/i.test(value)) result.push("ATX");
  if (/M-ATX/i.test(value)) result.push("M-ATX");
  if (/M-ITX|Mini-ITX|ITX/i.test(value)) result.push("Mini-ITX");

  return result.length ? Array.from(new Set(result)) : undefined;
}

function parseRamType(value?: string) {
  if (!value) return undefined;
  if (/DDR5/i.test(value)) return "DDR5";
  if (/DDR4/i.test(value)) return "DDR4";
  return undefined;
}

function parseAtxVersion(value: string): "ATX 3.0" | "ATX 3.1" | undefined {
  if (/ATX\s*3\.1/i.test(value)) return "ATX 3.1";
  if (/ATX\s*3\.0/i.test(value)) return "ATX 3.0";
  return undefined;
}

function parseCsv(value?: string) {
  if (!value) return undefined;

  const items = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : undefined;
}

function parseModular(value: string): "none" | "semi" | "full" | undefined {
  if (/풀모듈러|full/i.test(value)) return "full";
  if (/세미모듈러|semi/i.test(value)) return "semi";
  if (/일반|non.?modular|non.?mod/i.test(value)) return "none";
  return undefined;
}

function parseSsdInterface(value?: string) {
  if (!value) return undefined;
  if (/NVMe|PCIe/i.test(value)) return "NVME";
  if (/SATA/i.test(value)) return "SATA";
  return undefined;
}

function parseSsdFormFactor(value?: string) {
  if (!value) return undefined;
  if (/M\.2/i.test(value)) return "M.2";
  if (/2\.5/i.test(value)) return "2.5";
  return undefined;
}

function parseCapacityGb(value: string) {
  const tb = value.match(/(\d+(?:\.\d+)?)\s*TB/i)?.[1];
  if (tb) return Number(tb) * 1000;
  return extractNumber(value, /(\d+(?:\.\d+)?)\s*GB/i);
}

function parseCoolerSockets(value?: string) {
  if (!value) return undefined;

  const sockets = ["AM4", "AM5", "LGA1700", "LGA1851", "LGA1200"].filter((socket) => value.includes(socket));
  return sockets.length ? sockets : undefined;
}

function normalizeSocket(value?: string) {
  if (!value) return undefined;
  if (/AM5/i.test(value)) return "AM5";
  if (/AM4/i.test(value)) return "AM4";
  if (/1851/i.test(value)) return "LGA1851";
  if (/1700/i.test(value)) return "LGA1700";
  if (/1200/i.test(value)) return "LGA1200";
  return value;
}

function inferCpuSocketFromName(name: string) {
  if (/라이젠[579]-6세대|9\d{3}X?3?D?/i.test(name)) return "AM5";
  if (/라이젠[579]-5세대|7\d{3}X?3?D?/i.test(name)) return "AM5";
  if (/코어\s*울트라/i.test(name)) return "LGA1851";
  return undefined;
}

function inferCpuSeries(value: string) {
  if (/Ryzen|라이젠/i.test(value)) {
    const model = value.match(/(?:Ryzen|라이젠)\s*[3579]?\s*[- ]?\s*(\d{4})/i)?.[1] ?? value.match(/\b(\d{4})X?3?D?\b/i)?.[1];
    if (!model) return undefined;
    if (model.startsWith("9")) return "Ryzen 9000";
    if (model.startsWith("8")) return "Ryzen 8000";
    if (model.startsWith("7")) return "Ryzen 7000";
    if (model.startsWith("5")) return "Ryzen 5000";
  }
  if (/Core\s*Ultra|코어\s*울트라/i.test(value)) return "Intel Core Ultra 200";
  if (/14세대|14th|i[3579]-14/i.test(value)) return "Intel 14th";
  if (/13세대|13th|i[3579]-13/i.test(value)) return "Intel 13th";
  if (/12세대|12th|i[3579]-12/i.test(value)) return "Intel 12th";
  return undefined;
}

function inferCpuGeneration(value: string) {
  const series = inferCpuSeries(value);
  if (!series) return undefined;
  if (series.startsWith("Ryzen")) return series.replace("Ryzen ", "Zen/Ryzen ");
  return series;
}

function inferSupportedCpuSeries(chipset?: string) {
  if (!chipset) return undefined;
  if (/A620|B650|X670|B850|X870/i.test(chipset)) return ["Ryzen 7000", "Ryzen 8000", "Ryzen 9000"];
  if (/B760|Z790|H770|H610/i.test(chipset)) return ["Intel 12th", "Intel 13th", "Intel 14th"];
  if (/B860|Z890|H810/i.test(chipset)) return ["Intel Core Ultra 200"];
  return undefined;
}

function inferCoolingCapacityTier(offer: PriceOffer, radiatorSize?: number): "basic" | "adequate" | "strong" | "unknown" {
  const text = `${offer.productName} ${specText(offer)}`.toLowerCase();
  const tdpCapacityW = readNumber(offer, "coolerTdpCapacityW");

  if ((tdpCapacityW && tdpCapacityW >= 250) || (radiatorSize && radiatorSize >= 280) || /dual|듀얼|ag620|pa120|ak620|nh-d15/i.test(text)) {
    return "strong";
  }
  if ((tdpCapacityW && tdpCapacityW >= 160) || radiatorSize || /tower|타워|120/i.test(text)) return "adequate";
  if (tdpCapacityW || /lp|low profile|슬림/i.test(text)) return "basic";
  return "unknown";
}

function inferPsuQualityTier(offer: PriceOffer): "entry" | "mainstream" | "high" | "unknown" {
  const text = `${offer.productName} ${specText(offer)}`.toLowerCase();

  if (/titanium|platinum|leadex|focus|prime|dark power|straight power/i.test(text)) return "high";
  if (/gold|atx\s*3\.[01]|12v-?2x6|12vhpwr|풀모듈러|full/i.test(text)) return "mainstream";
  if (/bronze|standard|정격/i.test(text)) return "entry";
  return "unknown";
}

function extractGpuChipset(value: string) {
  return value.match(/(RTX\s*\d{4}(?:\s*Ti)?|RX\s*\d{4}(?:\s*XT)?)/i)?.[1]?.replace(/\s+/g, " ");
}

function extractVramGb(value: string) {
  const matches = [...value.matchAll(/(\d+)\s*GB/gi)].map((match) => Number(match[1]));
  return matches.filter((amount) => amount >= 4 && amount <= 48).at(-1);
}

function estimateGpuTier(chipset: string) {
  if (/5090|4090/i.test(chipset)) return 10;
  if (/5080|4080|5070\s*Ti|9070\s*XT/i.test(chipset)) return 9;
  if (/5070|4070\s*Ti|7900/i.test(chipset)) return 8;
  if (/5060\s*Ti|4070|7800/i.test(chipset)) return 7;
  if (/5060|4060\s*Ti|7600/i.test(chipset)) return 6;
  if (/4060|3060/i.test(chipset)) return 5;
  return undefined;
}

function estimateCpuTier(name: string) {
  if (/9800X3D|7800X3D|9850X3D/i.test(name)) return 9;
  if (/9700X|7700|Ultra7|울트라7/i.test(name)) return 8;
  if (/9600X|7500F|7600|Ultra5|울트라5/i.test(name)) return 6;
  return undefined;
}

function inferLineTier(category: PartCategory, offer: PriceOffer): PartClassification["brandLineTier"] {
  const text = `${offer.productName} ${specText(offer)}`.toLowerCase();
  if (/strix|suprim|aorus|rog|taichi|leadex vii/i.test(text)) return "high";
  if (/gaming|tuf|mortar|pulse|focus|gold|quiet/i.test(text)) return "upper-mainstream";
  if (category === "gpu" && /ventus|dual/i.test(text)) return "mainstream";
  return "mainstream";
}

function isRadiatorSize(value?: number): value is 120 | 240 | 280 | 360 | 420 {
  return value === 120 || value === 240 || value === 280 || value === 360 || value === 420;
}

function extractNumber(value: string, pattern: RegExp) {
  const matched = value.match(pattern)?.[1];
  if (!matched) return undefined;

  const parsed = Number(matched.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}
