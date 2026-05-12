import type { Confidence } from "@/types/build";
import type { Part } from "@/types/parts";
import type { PriceOffer } from "@/types/pricing";

export type OfferMatchStatus = "match" | "mismatch" | "uncertain";

export type OfferMatchDiagnostics = {
  status: OfferMatchStatus;
  reasons: string[];
  mismatchedFields: string[];
  confidence: Confidence;
};

export function isStrictSameProductOffer(part: Part, offer: PriceOffer) {
  return getOfferMatchDiagnostics(part, offer).status === "match";
}

export function getOfferMatchDiagnostics(part: Part, offer: PriceOffer): OfferMatchDiagnostics {
  const mismatchedFields = getMismatchedFields(part, offer);

  if (mismatchedFields.length) {
    return {
      status: "mismatch",
      reasons: ["Part와 Offer의 핵심 스펙이 다릅니다."],
      mismatchedFields,
      confidence: "high",
    };
  }

  if (hasExactPcodeMatch(part, offer)) return match("pcode가 Part alias와 일치합니다.", "high");
  if (normalize(offer.productName) === normalize(part.name)) return match("상품명이 정확히 일치합니다.", "high");
  if (hasAliasProductIdentity(part, offer)) return match("브랜드/라인업 alias와 핵심 스펙이 일치합니다.", "medium");

  if (part.source.type === "danawa-ranking" && offer.partId === part.id && offer.source.type === "danawa-ranking") {
    return match("다나와 랭킹 Part의 원본 offer입니다.", "high");
  }

  if (offer.partId === part.id && normalize(offer.productName) === normalize(part.name)) {
    return match("partId와 상품명이 일치합니다.", "high");
  }

  return {
    status: "uncertain",
    reasons: ["pcode 또는 정확한 상품명 일치가 없어 가격 보강에 사용하지 않습니다."],
    mismatchedFields: [],
    confidence: "low",
  };
}

function match(reason: string, confidence: Confidence): OfferMatchDiagnostics {
  return {
    status: "match",
    reasons: [reason],
    mismatchedFields: [],
    confidence,
  };
}

function getMismatchedFields(part: Part, offer: PriceOffer) {
  const specs = part.specs;
  const fields: string[] = [];

  if (specs.kind === "motherboard") {
    compare("socket", specs.socket, readSocket(offer), fields);
    compare("chipset", normalizeChipset(specs.chipset), normalizeChipset(readString(offer, "motherboardChipset") ?? extractMotherboardChipset(offer.productName)), fields);
    compare("ramType", specs.ramType, readRamType(offer), fields);
    compare("formFactor", specs.formFactor, readFormFactor(offer), fields);
  } else if (specs.kind === "ram") {
    compare("ramType", specs.type, readRamType(offer), fields);
    compare("totalGb", specs.totalGb, readNumber(offer, "ramCapacityGb") ?? extractCapacityGb(offer.productName), fields);
    compare("moduleCount", specs.moduleCount, readNumber(offer, "ramModuleCount") ?? extractRamModuleCount(offer.productName), fields);
    compare("speedMhz", specs.speedMhz, readNumber(offer, "ramSpeedMhz") ?? extractRamSpeedMhz(offer.productName), fields);
  } else if (specs.kind === "ssd") {
    compare("capacityGb", specs.capacityGb, readNumber(offer, "ssdCapacityGb") ?? parseCapacityGb(readString(offer, "ssdCapacityText")) ?? parseCapacityGb(offer.productName), fields);
    compare("interface", specs.interface, readSsdInterface(offer), fields);
    compare("formFactor", specs.formFactor, readSsdFormFactor(offer), fields);
    if (hasDifferentBrandModel(part, offer)) fields.push("model");
  } else if (specs.kind === "psu") {
    compare("wattage", specs.wattage, readNumber(offer, "psuWattageW") ?? extractNumber(offer.productName, /(\d{3,4})\s*W/i), fields);
    compare("atxVersion", specs.atxVersion, readPsuAtxVersion(offer), fields);
    if (hasDifferentBrandModel(part, offer)) fields.push("model");
  } else if (specs.kind === "gpu") {
    compare("chipset", normalizeGpuChipset(specs.chipset), normalizeGpuChipset(readString(offer, "gpuChipset") ?? extractGpuChipset(offer.productName)), fields);
    compare("vramGb", specs.vramGb, extractVramGb(`${offer.productName} ${readString(offer, "danawaSpecText") ?? ""}`), fields);
  } else if (specs.kind === "cpu") {
    compare("socket", specs.socket, readSocket(offer), fields);
    compare("series", specs.series, readString(offer, "cpuSeries") ?? inferCpuSeries(offer.productName), fields);
    if (hasDifferentCpuModel(part, offer)) fields.push("model");
  } else if (specs.kind === "case") {
    if (hasDifferentBrandModel(part, offer)) fields.push("model");
  } else if (specs.kind === "cooler") {
    compare("coolerType", specs.type, readCoolerType(offer), fields);
    compare("radiatorSizeMm", specs.radiatorSizeMm, readNumber(offer, "coolerRadiatorMm") ?? extractRadiatorSizeMm(offer.productName), fields);
    compare("heightMm", specs.heightMm, readNumber(offer, "coolerHeightMm"), fields);
    if (/팬|fan|써멀|thermal|브라켓|bracket/i.test(offer.productName) && !/쿨러|cooler|aio|수랭|공랭/i.test(offer.productName)) fields.push("category");
  }

  return Array.from(new Set(fields));
}

function compare(field: string, partValue: string | number | undefined, offerValue: string | number | undefined, fields: string[]) {
  if (partValue === undefined || offerValue === undefined) return;
  if (String(partValue).toLowerCase() !== String(offerValue).toLowerCase()) fields.push(field);
}

function hasExactPcodeMatch(part: Part, offer: PriceOffer) {
  return Boolean(offer.pcode && part.aliases.includes(offer.pcode));
}

function hasAliasProductIdentity(part: Part, offer: PriceOffer) {
  const partText = canonicalText(`${part.brand} ${part.name} ${part.model} ${part.aliases.join(" ")}`);
  const offerText = canonicalText(`${offer.productName} ${readString(offer, "danawaSpecText") ?? ""}`);
  const partTokens = significantTokens(partText);
  const offerTokens = significantTokens(offerText);
  const commonTokens = partTokens.filter((token) => offerTokens.includes(token));

  if (!hasCategoryRequiredOfferSpecs(part, offer)) return false;
  if (!hasBrandSignal(part, offer, partText, offerText)) return false;
  if (part.specs.kind === "ram") return commonTokens.some(isRamIdentityToken);

  return commonTokens.some(isStrongModelToken);
}

function hasCategoryRequiredOfferSpecs(part: Part, offer: PriceOffer) {
  const specs = part.specs;

  if (specs.kind === "motherboard") {
    return Boolean(
      (!specs.socket || readSocket(offer)) &&
        (!specs.chipset || normalizeChipset(readString(offer, "motherboardChipset") ?? extractMotherboardChipset(offer.productName))) &&
        (!specs.ramType || readRamType(offer)),
    );
  }

  if (specs.kind === "ram") {
    return Boolean(
      (!specs.type || readRamType(offer)) &&
        (!specs.totalGb || (readNumber(offer, "ramCapacityGb") ?? extractCapacityGb(offer.productName))) &&
        (!specs.speedMhz || (readNumber(offer, "ramSpeedMhz") ?? extractRamSpeedMhz(offer.productName))) &&
        (!specs.moduleCount || (readNumber(offer, "ramModuleCount") ?? extractRamModuleCount(offer.productName))),
    );
  }

  if (specs.kind === "ssd") {
    return Boolean(
      (!specs.capacityGb || (readNumber(offer, "ssdCapacityGb") ?? parseCapacityGb(readString(offer, "ssdCapacityText")) ?? parseCapacityGb(offer.productName))) &&
        (!specs.interface || readSsdInterface(offer)) &&
        (!specs.formFactor || readSsdFormFactor(offer)),
    );
  }

  if (specs.kind === "psu") {
    return Boolean(
      (!specs.wattage || (readNumber(offer, "psuWattageW") ?? extractNumber(offer.productName, /(\d{3,4})\s*W/i))) &&
        (!specs.atxVersion || readPsuAtxVersion(offer)) &&
        hasRequiredPsuConnector(specs.gpuConnectors, offer),
    );
  }

  if (specs.kind === "gpu") {
    return Boolean(
      normalizeGpuChipset(readString(offer, "gpuChipset") ?? extractGpuChipset(offer.productName)) &&
        (!specs.vramGb || extractVramGb(`${offer.productName} ${readString(offer, "danawaSpecText") ?? ""}`)),
    );
  }

  if (specs.kind === "cpu") {
    return Boolean(hasCpuModelToken(part.name, offer.productName));
  }

  if (specs.kind === "cooler") {
    return Boolean(readCoolerType(offer) && (!specs.radiatorSizeMm || readNumber(offer, "coolerRadiatorMm") || extractRadiatorSizeMm(offer.productName)) && (!specs.heightMm || readNumber(offer, "coolerHeightMm")));
  }

  return true;
}

function hasBrandSignal(part: Part, offer: PriceOffer, partText: string, offerText: string) {
  const partBrands = brandTokens(`${part.brand} ${part.name}`);
  const offerBrands = brandTokens(offer.productName);
  if (!partBrands.length) return true;
  return partBrands.some((brand) => offerBrands.includes(brand) || offerText.includes(brand)) || partBrands.some((brand) => partText.includes(brand) && offerText.includes(brand));
}

function hasDifferentBrandModel(part: Part, offer: PriceOffer) {
  const partTokens = significantTokens(part.name);
  const offerTokens = significantTokens(offer.productName);
  if (!partTokens.length || !offerTokens.length) return false;
  const commonTokens = partTokens.filter((token) => offerTokens.includes(token));
  if (commonTokens.some(isStrongModelToken)) return false;
  return commonTokens.length < Math.min(2, partTokens.length);
}

function hasDifferentCpuModel(part: Part, offer: PriceOffer) {
  const partModel = part.name.match(/(\d{4,5}X?3?D?|Ultra\s*\d\s*\d{3}K?)/i)?.[1];
  const offerModel = offer.productName.match(/(\d{4,5}X?3?D?|Ultra\s*\d\s*\d{3}K?)/i)?.[1];
  return Boolean(partModel && offerModel && normalize(partModel) !== normalize(offerModel));
}

function hasCpuModelToken(partName: string, offerName: string) {
  const partModel = partName.match(/(\d{4,5}X?3?D?|Ultra\s*\d\s*\d{3}K?)/i)?.[1];
  const offerModel = offerName.match(/(\d{4,5}X?3?D?|Ultra\s*\d\s*\d{3}K?)/i)?.[1];
  return Boolean(partModel && offerModel && normalize(partModel) === normalize(offerModel));
}

function significantTokens(value: string) {
  const generic = new Set(["amd", "intel", "geforce", "radeon", "rtx", "ddr4", "ddr5", "wifi", "plus", "black", "white", "gaming", "gold"]);
  return canonicalText(value)
    .split(" ")
    .filter((token) => token.length >= 3 && !generic.has(token) && !/^\d+(gb|tb|w)?$/.test(token));
}

function brandTokens(value: string) {
  const brands = new Set([
    "msi",
    "asus",
    "gigabyte",
    "asrock",
    "samsung",
    "skhynix",
    "micronics",
    "superflower",
    "seasonic",
    "thermalright",
    "deepcool",
    "arctic",
    "essencore",
    "klevv",
    "crucial",
    "wd",
    "seagate",
    "sapphire",
    "powercolor",
    "zotac",
    "gainward",
    "palit",
    "3rsys",
  ]);
  return canonicalText(value)
    .split(" ")
    .filter((token) => brands.has(token));
}

function isStrongModelToken(token: string) {
  return (
    [
      "mortar",
      "tomahawk",
      "tuf",
      "strix",
      "aorus",
      "ventus",
      "trio",
      "suprim",
      "pulse",
      "nitro",
      "focus",
      "leadex",
      "p41",
      "sn850",
      "sn850x",
      "evo",
      "pro",
      "classic",
      "liquid",
      "freezer",
    ].includes(token) || /^[a-z]+\d+[a-z]*$/i.test(token)
  );
}

function isRamIdentityToken(token: string) {
  return ["essencore", "klevv", "cras", "bolt", "rgb"].includes(token) || isStrongModelToken(token);
}

function readString(offer: PriceOffer, key: string) {
  const value = offer.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(offer: PriceOffer, key: string) {
  const value = offer.metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readSocket(offer: PriceOffer) {
  return normalizeSocket(readString(offer, "motherboardSocket") ?? readString(offer, "cpuSocket") ?? offer.productName);
}

function normalizeSocket(value?: string) {
  if (!value) return undefined;
  if (/AM5/i.test(value)) return "AM5";
  if (/AM4/i.test(value)) return "AM4";
  if (/1851/i.test(value)) return "LGA1851";
  if (/1700/i.test(value)) return "LGA1700";
  if (/1200/i.test(value)) return "LGA1200";
  return undefined;
}

function readRamType(offer: PriceOffer) {
  const value = readString(offer, "motherboardRamType") ?? readString(offer, "ramType") ?? readString(offer, "danawaSpecText") ?? offer.productName;
  if (/DDR5/i.test(value)) return "DDR5";
  if (/DDR4/i.test(value)) return "DDR4";
  return undefined;
}

function readFormFactor(offer: PriceOffer) {
  const value = readString(offer, "motherboardFormFactor") ?? offer.productName;
  if (/Mini-ITX|M-ITX|\bITX\b/i.test(value)) return "Mini-ITX";
  if (/M-ATX|mATX|Micro-ATX|마이크로\s*ATX/i.test(value)) return "M-ATX";
  if (/E-ATX/i.test(value)) return "E-ATX";
  if (/(^|[\s,/])ATX(?=$|[\s,/()])/i.test(value)) return "ATX";
  return undefined;
}

function readPsuAtxVersion(offer: PriceOffer) {
  const value = readString(offer, "psuAtxVersion") ?? readString(offer, "danawaSpecText") ?? offer.productName;
  if (/ATX\s*3\.1/i.test(value)) return "ATX 3.1";
  if (/ATX\s*3\.0/i.test(value)) return "ATX 3.0";
  if (/ATX\s*2(?:\.|x)/i.test(value)) return "ATX 2.x";
  return undefined;
}

function hasRequiredPsuConnector(connectors: string[] | undefined, offer: PriceOffer) {
  if (!connectors?.length) return true;
  const text = canonicalText(`${offer.productName} ${readString(offer, "danawaSpecText") ?? ""} ${readString(offer, "psuConnectors") ?? ""}`);
  const needs12v2x6 = connectors.some((connector) => /12v-?2x6|12vhpwr|16\s*pin|16\s*핀/i.test(connector));
  const needs8pin = connectors.some((connector) => /8[\s-]*pin|6\s*\+\s*2|pcie/i.test(connector));
  if (needs12v2x6 && !/(12v2x6|12vhpwr)/.test(text)) return false;
  if (needs8pin && !/pcie8pin/.test(text)) return false;
  return true;
}

function readSsdInterface(offer: PriceOffer) {
  const value = readString(offer, "ssdInterface") ?? readString(offer, "danawaSpecText") ?? offer.productName;
  if (/NVMe|PCIe/i.test(value)) return "NVME";
  if (/SATA/i.test(value)) return "SATA";
  return undefined;
}

function readSsdFormFactor(offer: PriceOffer) {
  const value = readString(offer, "ssdFormFactor") ?? readString(offer, "danawaSpecText") ?? offer.productName;
  if (/M\.2/i.test(value)) return "M.2";
  if (/2\.5/i.test(value)) return "2.5";
  return undefined;
}

function readCoolerType(offer: PriceOffer) {
  const value = readString(offer, "coolerType") ?? readString(offer, "danawaSpecText") ?? offer.productName;
  if (/수랭|liquid|aio/i.test(value)) return "liquid";
  if (/공랭|air|tower|타워/i.test(value)) return "air";
  return undefined;
}

function extractRadiatorSizeMm(value: string) {
  const size = extractNumber(value, /(120|240|280|360|420)\s*(?:mm)?/i);
  return size && [120, 240, 280, 360, 420].includes(size) ? size : undefined;
}

function extractMotherboardChipset(value: string) {
  return value.match(/\b(A620|B650|B850|X670|X870|B760|B860|Z790|Z890|H610|H810)\b/i)?.[1];
}

function normalizeChipset(value?: string) {
  return value?.match(/\b(A620|B650|B850|X670|X870|B760|B860|Z790|Z890|H610|H810)\b/i)?.[1]?.toUpperCase();
}

function extractGpuChipset(value: string) {
  return value.match(/(RTX\s*\d{4}(?:\s*Ti)?|RX\s*\d{4}(?:\s*XT)?)/i)?.[1];
}

function normalizeGpuChipset(value?: string) {
  return value?.replace(/\s+/g, " ").toUpperCase();
}

function extractVramGb(value: string) {
  const matches = [...value.matchAll(/(\d+)\s*GB/gi)].map((match) => Number(match[1]));
  return matches.filter((amount) => amount >= 4 && amount <= 48).at(-1);
}

function extractCapacityGb(value: string) {
  return parseCapacityGb(value);
}

function parseCapacityGb(value?: string) {
  if (!value) return undefined;
  const kit = value.match(/(?:(\d+)\s*G(?:B)?\s*x\s*(\d+)|(\d+)\s*x\s*(\d+)\s*G(?:B)?)/i);
  if (kit) return Number(kit[1] ?? kit[4]) * Number(kit[2] ?? kit[3]);
  const tb = value.match(/(\d+(?:\.\d+)?)\s*TB/i)?.[1];
  if (tb) return Number(tb) * 1000;
  return extractNumber(value, /(\d+(?:\.\d+)?)\s*GB/i);
}

function extractRamSpeedMhz(value: string) {
  const pc5 = value.match(/PC5[-\s]?(\d{5})/i)?.[1];
  if (pc5) return Math.round(Number(pc5) / 8);
  const pc4 = value.match(/PC4[-\s]?(\d{5})/i)?.[1];
  if (pc4) return Math.round(Number(pc4) / 8);
  return extractNumber(value, /(?:DDR[45][-\s]?)?(\d{4,5})\s*(?:MHz|MT\/s)?/i);
}

function extractRamModuleCount(value: string) {
  const by = value.match(/(?:\d+\s*G(?:B)?\s*x\s*(\d+)|(\d+)\s*x\s*\d+\s*G(?:B)?)/i);
  if (by) return Number(by[1] ?? by[2]);
  const bracket = value.match(/\(\s*\d+\s*G(?:B)?\s*x\s*(\d+)\s*\)/i)?.[1];
  return bracket ? Number(bracket) : undefined;
}

function inferCpuSeries(value: string) {
  if (/Ryzen|라이젠/i.test(value)) {
    const model = value.match(/(\d{4})/i)?.[1];
    if (model?.startsWith("9")) return "Ryzen 9000";
    if (model?.startsWith("8")) return "Ryzen 8000";
    if (model?.startsWith("7")) return "Ryzen 7000";
    if (model?.startsWith("5")) return "Ryzen 5000";
  }
  if (/Core\s*Ultra|코어\s*울트라/i.test(value)) return "Intel Core Ultra 200";
  if (/14세대|14th|i[3579]-14/i.test(value)) return "Intel 14th";
  if (/13세대|13th|i[3579]-13/i.test(value)) return "Intel 13th";
  if (/12세대|12th|i[3579]-12/i.test(value)) return "Intel 12th";
  return undefined;
}

function extractNumber(value: string, pattern: RegExp) {
  const matched = value.match(pattern)?.[1];
  if (!matched) return undefined;
  const parsed = Number(matched.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalize(value: string) {
  return canonicalText(value);
}

function canonicalText(value: string) {
  let normalized = value.toLowerCase();
  const replacements: Array<[RegExp, string]> = [
    [/엠에스아이/g, " msi "],
    [/에이수스/g, " asus "],
    [/기가바이트/g, " gigabyte "],
    [/애즈락/g, " asrock "],
    [/삼성/g, " samsung "],
    [/sk\s*하이닉스|하이닉스|sk\s*hynix/g, " skhynix "],
    [/마이크로닉스/g, " micronics "],
    [/슈퍼\s*플라워|슈퍼플라워/g, " superflower "],
    [/시소닉/g, " seasonic "],
    [/써멀\s*라이트|써멀라이트/g, " thermalright "],
    [/딥쿨/g, " deepcool "],
    [/아틱/g, " arctic "],
    [/에센코어/g, " essencore "],
    [/클레브/g, " klevv "],
    [/크루셜/g, " crucial "],
    [/웨스턴\s*디지털|웨스턴디지털|western\s*digital/g, " wd "],
    [/씨게이트/g, " seagate "],
    [/사파이어/g, " sapphire "],
    [/파워\s*컬러|파워컬러/g, " powercolor "],
    [/조텍/g, " zotac "],
    [/게인워드/g, " gainward "],
    [/팰릿/g, " palit "],
    [/박격포/g, " mortar "],
    [/토마호크/g, " tomahawk "],
    [/터프/g, " tuf "],
    [/rog\s*strix|스트릭스/g, " strix "],
    [/어로스/g, " aorus "],
    [/벤투스/g, " ventus "],
    [/gaming\s*trio|게이밍\s*트리오/g, " trio "],
    [/슈프림/g, " suprim "],
    [/펄스/g, " pulse "],
    [/니트로/g, " nitro "],
    [/포커스/g, " focus "],
    [/리덱스/g, " leadex "],
    [/platinum\s*p41/g, " p41 "],
    [/990\s*프로/g, " 990 pro "],
    [/990\s*에보/g, " 990 evo "],
    [/12v[\s-]*2x6|16\s*핀|16\s*pin/g, " 12v2x6 "],
    [/12vhpwr/g, " 12vhpwr "],
    [/pcie\s*8\s*핀|8[\s-]*pin/g, " pcie8pin "],
    [/pcie\s*6\s*\+\s*2\s*핀|6\s*\+\s*2/g, " pcie8pin "],
    [/micro[\s-]*atx|m[\s-]*atx|matx|마이크로\s*atx/g, " m-atx "],
    [/mini[\s-]*itx|\bitx\b/g, " mini-itx "],
    [/e[\s-]*atx/g, " e-atx "],
    [/pc5[\s-]?48000/g, " ddr5 6000 "],
    [/6000\s*(?:mhz|mt\/s)/g, " 6000 "],
    [/(\d+)\s*g(?:b)?\s*x\s*(\d+)/g, "$1gbx$2"],
    [/(\d+)\s*x\s*(\d+)\s*g(?:b)?/g, "$2gbx$1"],
  ];

  for (const [pattern, replacement] of replacements) normalized = normalized.replace(pattern, replacement);

  return normalized.replace(/[^a-z0-9가-힣.+-]+/g, " ").replace(/\s+/g, " ").trim();
}
