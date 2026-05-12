import type { PartCategory } from "@/types/parts";
import type { PriceOffer } from "@/types/pricing";

export function isPriceSaneForRecommendation(offer: PriceOffer, category?: PartCategory, pool: PriceOffer[] = []) {
  if (!category) return true;

  const price = offer.benefitPrice ?? offer.basePrice;
  if (!Number.isFinite(price) || price <= 0) return false;

  const comparablePrices = pool
    .filter((item) => item.id !== offer.id)
    .filter((item) => getComparablePriceGroup(item, category) === getComparablePriceGroup(offer, category))
    .map((item) => item.benefitPrice ?? item.basePrice)
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right);
  const median = comparablePrices.length >= 3 ? comparablePrices[Math.floor(comparablePrices.length / 2)] : undefined;

  if (median && price > median * 2.2 && price - median > 70000) return false;

  if (category === "ram") {
    const capacity = extractCapacityGb(offer);
    if (capacity && capacity <= 32 && price >= 500000) return false;
    if (capacity && price / capacity > 16000 && price >= 300000) return false;
  }

  if (category === "ssd") {
    const capacity = extractCapacityGb(offer);
    if (capacity && capacity <= 500 && price >= 200000) return false;
    if (capacity && price / capacity > 450 && price >= 180000) return false;
  }

  if (category === "psu") {
    const wattage = readNumber(offer, "psuWattageW") ?? extractNumber(offer.productName, /(\d{3,4})\s*W/i);
    if (wattage && price / wattage > 420 && price >= 350000) return false;
  }

  return true;
}

function getComparablePriceGroup(offer: PriceOffer, category: PartCategory) {
  if (category === "ram" || category === "ssd") return `${category}:${extractCapacityGb(offer) ?? "unknown"}`;
  if (category === "psu") return `${category}:${readNumber(offer, "psuWattageW") ?? extractNumber(offer.productName, /(\d{3,4})\s*W/i) ?? "unknown"}`;
  if (category === "gpu") return `${category}:${readString(offer, "gpuChipset") ?? extractGpuChipset(offer.productName) ?? "unknown"}`;
  return category;
}

function extractCapacityGb(offer: PriceOffer) {
  const metadataCapacity =
    readNumber(offer, "ramCapacityGb") ??
    parseCapacityGb(readString(offer, "ssdCapacityText")) ??
    parseCapacityGb(readString(offer, "danawaSpecText"));

  return metadataCapacity ?? parseCapacityGb(offer.productName) ?? parseCapacityGb(offer.rawText);
}

function readString(offer: PriceOffer, key: string) {
  const value = offer.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(offer: PriceOffer, key: string) {
  const value = offer.metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseCapacityGb(value?: string) {
  if (!value) return undefined;

  const tb = value.match(/(\d+(?:\.\d+)?)\s*TB/i)?.[1];
  if (tb) return Number(tb) * 1000;

  return extractNumber(value, /(\d+(?:\.\d+)?)\s*GB/i);
}

function extractGpuChipset(value: string) {
  return value.match(/(RTX\s*\d{4}(?:\s*Ti)?|RX\s*\d{4}(?:\s*XT)?)/i)?.[1]?.replace(/\s+/g, " ");
}

function extractNumber(value: string, pattern: RegExp) {
  const matched = value.match(pattern)?.[1];
  if (!matched) return undefined;

  const parsed = Number(matched.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}
