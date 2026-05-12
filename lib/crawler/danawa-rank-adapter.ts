import type { Confidence } from "@/types/build";
import type { PartCategory } from "@/types/parts";
import type { PriceOffer, PriceSnapshot } from "@/types/pricing";

export type DanawaRankedProduct = {
  rank: number;
  pcode: string;
  name: string;
  url: string;
  category: PartCategory;
  imageUrl?: string;
  basePrice?: number;
  benefitPrice?: number;
  mall?: string;
  benefitCondition?: string;
  benefitRawText?: string;
  mallCount?: number;
  registeredAt?: string;
  specText?: string;
  structuredSpecs?: Record<string, string | number | boolean | undefined>;
};

export type DanawaRankedSnapshotResult = {
  snapshot: PriceSnapshot;
  fromCache: boolean;
  cacheExpiresAt: string;
  products: DanawaRankedProduct[];
};

const categoryCateMap: Record<PartCategory, string> = {
  cpu: "112747",
  cooler: "11236855",
  motherboard: "112751",
  ram: "112752",
  gpu: "112753",
  ssd: "112760",
  psu: "112777",
  case: "112775",
};

const sourceName = "Danawa category ranking";
const userAgent = "Mozilla/5.0 (compatible; pcmate-mvp/0.1; +https://prod.danawa.com)";
const cacheTtlMs = 15 * 60 * 1000;
const cacheTtlSeconds = cacheTtlMs / 1000;
const categorySnapshotCache = new Map<
  string,
  {
    expiresAt: number;
    snapshot: PriceSnapshot;
    products: DanawaRankedProduct[];
  }
>();
const inFlightCategoryRequests = new Map<string, Promise<Omit<DanawaRankedSnapshotResult, "fromCache">>>();
const genericSearchTerms = new Set([
  "amd",
  "intel",
  "nvidia",
  "msi",
  "asus",
  "samsung",
  "geforce",
  "radeon",
  "ryzen",
  "core",
  "ultra",
  "gaming",
  "rtx",
  "ddr4",
  "ddr5",
  "wifi",
  "gold",
  "black",
  "white",
  "plus",
  "mesh",
  "with",
]);

export async function getDanawaRankedSnapshot(input: {
  pcode?: string;
  searchQuery?: string;
  category?: PartCategory;
  limit?: number;
}): Promise<PriceSnapshot> {
  const result = await getDanawaRankedSnapshotResult(input);
  return result.snapshot;
}

export async function getDanawaRankedSnapshotResult(input: {
  pcode?: string;
  searchQuery?: string;
  category?: PartCategory;
  limit?: number;
  forceRefresh?: boolean;
}): Promise<DanawaRankedSnapshotResult> {
  const now = new Date().toISOString();
  const limit = input.limit ?? 30;
  const categories = input.category ? [input.category] : (Object.keys(categoryCateMap) as PartCategory[]);
  const baseWarnings = [
    `다나와 주요부품 카테고리 인기 순위 ${limit}위 안의 상품만 자동 비교합니다.`,
    "이 서버는 카테고리별 스냅샷을 15분 동안 재사용해 반복 크롤링을 줄입니다.",
    "직접 크롤링한 리스트 가격입니다. 쇼핑몰별 배송비, 쿠폰, 카드 조건은 실제 구매 전 재확인이 필요합니다.",
  ];

  for (const category of categories) {
    const categorySnapshot = await getDanawaCategoryRankSnapshot({ category, limit, forceRefresh: input.forceRefresh });
    const matches = findRankedMatches(categorySnapshot.products, input);

    if (!input.pcode && !input.searchQuery) {
      return categorySnapshot;
    }

    if (!matches.length) {
      if (input.category) break;
      continue;
    }

    const offers = matches
      .filter((product) => product.basePrice && product.basePrice > 0)
      .map((product) => productToOffer(product, now));
    const confidence: Confidence = offers.length ? "high" : "low";

    const snapshot: PriceSnapshot = {
      id: createSnapshotId(input.pcode ?? input.searchQuery ?? `${category}-rank-${limit}`),
      pcode: input.pcode,
      searchQuery: input.searchQuery,
      category,
      offers,
      source: {
        type: "danawa-ranking",
        name: sourceName,
        url: createCategoryUrl(category),
        updatedAt: categorySnapshot.snapshot.source.updatedAt,
      },
      confidence,
      warnings: [
        ...baseWarnings,
        ...matches
          .filter((product) => !product.basePrice)
          .map((product) => `${product.rank}위 ${product.name}: 리스트 가격을 읽지 못해 자동 합산에서 제외했습니다.`),
      ],
      updatedAt: categorySnapshot.snapshot.updatedAt,
    };

    return {
      snapshot,
      fromCache: categorySnapshot.fromCache,
      cacheExpiresAt: categorySnapshot.cacheExpiresAt,
      products: categorySnapshot.products,
    };
  }

  const fallbackSnapshot: PriceSnapshot = {
    id: createSnapshotId(input.pcode ?? input.searchQuery ?? "rank-not-found"),
    pcode: input.pcode,
    searchQuery: input.searchQuery,
    category: input.category,
    offers: [],
    source: {
      type: "danawa-ranking",
      name: sourceName,
      url: input.category ? createCategoryUrl(input.category) : "https://prod.danawa.com/list/",
      updatedAt: now,
    },
    confidence: "low",
    warnings: [
      ...baseWarnings,
      input.pcode || input.searchQuery
        ? "다나와 주요부품 랭킹 20위 안에서 일치하는 상품을 찾지 못했습니다."
        : "다나와 주요부품 랭킹 상품을 읽지 못했습니다.",
    ],
    updatedAt: now,
  };

  return {
    snapshot: fallbackSnapshot,
    fromCache: false,
    cacheExpiresAt: new Date(Date.now() + cacheTtlMs).toISOString(),
    products: [],
  };
}

export async function getDanawaCategoryRankSnapshot(input: {
  category: PartCategory;
  limit?: number;
  forceRefresh?: boolean;
}): Promise<DanawaRankedSnapshotResult> {
  const limit = input.limit ?? 30;
  const cacheKey = `${input.category}:${limit}`;
  const cached = categorySnapshotCache.get(cacheKey);

  if (!input.forceRefresh && cached && cached.expiresAt > Date.now()) {
    return {
      snapshot: cached.snapshot,
      fromCache: true,
      cacheExpiresAt: new Date(cached.expiresAt).toISOString(),
      products: cached.products,
    };
  }

  const inFlight = inFlightCategoryRequests.get(cacheKey);
  if (!input.forceRefresh && inFlight) {
    const sharedResult = await inFlight;
    return {
      ...sharedResult,
      fromCache: false,
    };
  }

  const request = fetchFreshCategoryRankSnapshot(input.category, limit);
  inFlightCategoryRequests.set(cacheKey, request);

  try {
    const fresh = await request;
    categorySnapshotCache.set(cacheKey, {
      expiresAt: Date.parse(fresh.cacheExpiresAt),
      snapshot: fresh.snapshot,
      products: fresh.products,
    });

    return {
      ...fresh,
      fromCache: false,
    };
  } finally {
    inFlightCategoryRequests.delete(cacheKey);
  }
}

async function fetchFreshCategoryRankSnapshot(category: PartCategory, limit: number): Promise<Omit<DanawaRankedSnapshotResult, "fromCache">> {
  const now = new Date().toISOString();
  const expiresAt = Date.now() + cacheTtlMs;
  const products = await getDanawaRankedProducts(category, limit);
  const offers = products
    .filter((product) => product.basePrice && product.basePrice > 0)
    .map((product) => productToOffer(product, now));

  return {
    snapshot: {
      id: createSnapshotId(`${category}-rank-${limit}`),
      searchQuery: `${category} rank top ${limit}`,
      category,
      offers,
      source: {
        type: "danawa-ranking",
        name: sourceName,
        url: createCategoryUrl(category),
        updatedAt: now,
      },
      confidence: offers.length ? "high" : "low",
      warnings: [
        `다나와 주요부품 카테고리 인기 순위 ${limit}위 전체 스냅샷입니다.`,
        "이 서버는 카테고리별 스냅샷을 15분 동안 재사용해 반복 크롤링을 줄입니다.",
        "직접 크롤링한 리스트 가격입니다. 쇼핑몰별 배송비, 쿠폰, 카드 조건은 실제 구매 전 재확인이 필요합니다.",
      ],
      updatedAt: now,
    },
    cacheExpiresAt: new Date(expiresAt).toISOString(),
    products,
  };
}

export async function getDanawaRankedProducts(category: PartCategory, limit = 30): Promise<DanawaRankedProduct[]> {
  const response = await fetch(createCategoryUrl(category), {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    next: { revalidate: cacheTtlSeconds },
  });

  if (!response.ok) {
    throw new Error(`Danawa category request failed: ${response.status}`);
  }

  return parseDanawaRankedProducts(await response.text(), category, limit);
}

export function parseDanawaRankedProducts(html: string, category: PartCategory, limit = 30): DanawaRankedProduct[] {
  const mainListHtml = html.slice(html.indexOf("main_prodlist main_prodlist_list"));
  const chunks = mainListHtml
    .split(/(?=<li class="prod_item\b)/g)
    .filter((chunk) => chunk.includes("productItem"))
    .slice(0, limit * 2);
  const products: DanawaRankedProduct[] = [];
  const seenPcodes = new Set<string>();

  for (const chunk of chunks) {
    const pcode = matchValue(chunk, /id="productItem(\d+)"/) ?? matchValue(chunk, /pcode=(\d+)/);
    if (!pcode || seenPcodes.has(pcode)) continue;

    const nameHtml = matchValue(chunk, /name="productName"[\s\S]*?>([\s\S]*?)<\/a>/);
    const name = cleanText(nameHtml ?? "");
    if (!name) continue;

    seenPcodes.add(pcode);
    const rank = Number(matchValue(chunk, /<strong class="pop_rank"[\s\S]*?<\/span>(\d+)<\/strong>/)) || products.length + 1;
    const basePrice = parsePrice(matchValue(chunk, new RegExp(`id="min_price_${pcode}" value="([^"]+)"`)));
    const benefitText = cleanText(matchValue(chunk, /<dl class="rel_item rel_special"[\s\S]*?<a[\s\S]*?>([\s\S]*?)<\/a>/) ?? "");
    const benefitPrice = parsePrice(benefitText);
    const mall = matchValue(benefitText, /\[([^\]]+)\]/);
    const benefitCondition = parseBenefitCondition(benefitText);
    const mallCount = parseInteger(matchValue(chunk, /<p class="chk_sect">\s*([\d,]+)몰/));
    const registeredAt = cleanText(matchValue(chunk, /<dl class="meta_item mt_date">([\s\S]*?)<\/dl>/) ?? "");
    const imageUrl = decodeHtml(matchValue(chunk, /<img\s+src="([^"]+)"/) ?? "");
    const specText = cleanText(matchValue(chunk, /<div class="spec_list">([\s\S]*?)<\/div>/) ?? "");
    const structuredSpecs = parseStructuredSpecs(category, specText);

    products.push({
      rank,
      pcode,
      name,
      url: `https://prod.danawa.com/info/?pcode=${pcode}&cate=${categoryCateMap[category]}`,
      category,
      imageUrl,
      basePrice,
      benefitPrice,
      mall,
      benefitCondition,
      benefitRawText: benefitText || undefined,
      mallCount,
      registeredAt,
      specText,
      structuredSpecs,
    });

    if (products.length >= limit) break;
  }

  if (products.length >= limit) return products;

  return mergeJsonLdFallbackProducts(html, category, limit, products);
}

function mergeJsonLdFallbackProducts(
  html: string,
  category: PartCategory,
  limit: number,
  products: DanawaRankedProduct[]
) {
  const seenPcodes = new Set(products.map((product) => product.pcode));
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of jsonLdMatches) {
    const rawJson = match[1]?.trim();
    if (!rawJson) continue;

    try {
      const payload = JSON.parse(rawJson) as unknown;
      const objects = Array.isArray(payload) ? payload : [payload];

      objects
        .filter(isItemList)
        .flatMap((itemList) => itemList.itemListElement)
        .forEach((item) => {
          const pcode = matchValue(item.url ?? "", /pcode=(\d+)/);
          if (!pcode || seenPcodes.has(pcode) || products.length >= limit) return;

          seenPcodes.add(pcode);
          products.push({
            rank: Number(item.position) || products.length + 1,
            pcode,
            name: item.name,
            url: item.url,
            category,
          });
        });
    } catch {
      continue;
    }
  }

  return products.slice(0, limit);
}

function findRankedMatches(products: DanawaRankedProduct[], input: { pcode?: string; searchQuery?: string }) {
  if (input.pcode) {
    return products.filter((product) => product.pcode === input.pcode);
  }

  const tokens = normalize(input.searchQuery ?? "")
    .split(" ")
    .filter((token) => token.length >= 2 && !["geforce", "radeon", "gaming", "with"].includes(token));
  const distinctiveTokens = tokens.filter((token) => token.length >= 4 && !genericSearchTerms.has(token) && !/^\d+(gb|tb|w)?$/.test(token));

  if (!tokens.length) return products;

  return products
    .map((product) => ({
      product,
      score: tokens.filter((token) => productNameIncludesTerm(normalize(product.name), token)).length,
    }))
    .filter((item) => !distinctiveTokens.length || distinctiveTokens.some((token) => productNameIncludesTerm(normalize(item.product.name), token)))
    .filter((item) => item.score >= Math.min(3, tokens.length))
    .sort((left, right) => right.score - left.score || left.product.rank - right.product.rank)
    .map((item) => item.product);
}

function productToOffer(product: DanawaRankedProduct, updatedAt: string): PriceOffer {
  const warnings = [
    `다나와 ${categoryLabel(product.category)} 인기 순위 ${product.rank}위 기준입니다.`,
    "배송비가 리스트에서 확정되지 않아 실제 결제액과 다를 수 있습니다.",
    product.benefitPrice ? "혜택 최저가는 카드/쿠폰/쇼핑몰 조건부일 수 있습니다." : "",
  ].filter(Boolean);

  return {
    id: `danawa-rank-${product.pcode}`,
    productName: product.name,
    mall: product.mall ?? "다나와 리스트",
    url: product.url,
    pcode: product.pcode,
    basePrice: product.basePrice ?? 0,
    benefitPrice: product.benefitPrice,
    availability: product.basePrice ? "in-stock" : "unknown",
    priceType: product.benefitPrice ? "card" : "normal",
    source: {
      type: "danawa-ranking",
      name: sourceName,
      url: createCategoryUrl(product.category),
      updatedAt,
    },
    confidence: product.basePrice ? "high" : "low",
    warnings,
    rawText: product.specText,
    metadata: {
      danawaRank: product.rank,
      danawaMallCount: product.mallCount,
      danawaRegisteredAt: product.registeredAt,
      danawaImageUrl: product.imageUrl,
      danawaBenefitCondition: product.benefitCondition,
      danawaBenefitRawText: product.benefitRawText,
      danawaSpecText: product.specText,
      ...product.structuredSpecs,
      cacheTtlMinutes: 15,
    },
    updatedAt,
  };
}

function createCategoryUrl(category: PartCategory) {
  return `https://prod.danawa.com/list/?cate=${categoryCateMap[category]}`;
}

function matchValue(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1]?.trim();
}

function parsePrice(value?: string) {
  if (!value) return undefined;

  const priceToken = value.match(/\d{1,3}(?:,\d{3})+|\d{5,}/)?.[0];
  if (!priceToken) return undefined;

  const price = Number(priceToken.replace(/,/g, ""));
  return Number.isFinite(price) && price > 0 ? price : undefined;
}

function parseBenefitCondition(value: string) {
  return value
    .replace(/\d{1,3}(?:,\d{3})+|\d{5,}/, "")
    .replace(/원/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[-/|·\s]+/, "")
    .trim();
}

function parseStructuredSpecs(category: PartCategory, specText: string): Record<string, string | number | boolean | undefined> {
  if (category === "gpu") return parseGpuStructuredSpecs(specText);
  if (category === "case") return parseCaseStructuredSpecs(specText);
  if (category === "cooler") return parseCoolerStructuredSpecs(specText);
  if (category === "psu") return parsePsuStructuredSpecs(specText);
  if (category === "motherboard") return parseMotherboardStructuredSpecs(specText);
  if (category === "ram") return parseRamStructuredSpecs(specText);
  if (category === "ssd") return parseSsdStructuredSpecs(specText);
  if (category === "cpu") return parseCpuStructuredSpecs(specText);

  return {};
}

function parseGpuStructuredSpecs(specText: string) {
  return removeUndefinedValues({
    gpuChipset: firstSpecSegment(specText),
    gpuRecommendedPsuW:
      extractNumber(specText, /(?:권장|정격)?\s*파워\s*:?\s*(\d+(?:\.\d+)?)\s*W\s*이상/i) ??
      extractNumber(specText, /(\d+(?:\.\d+)?)\s*W\s*이상/i),
    gpuPowerConnector: extractText(specText, /(?:전원\s*포트|보조전원)\s*:\s*([^/]+)/),
    gpuLengthMm:
      extractNumber(specText, /가로\s*\(길이\)\s*:\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i) ??
      extractNumber(specText, /길이\s*:\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i),
    gpuThicknessMm: extractNumber(specText, /두께\s*:\s*(\d+(?:\.\d+)?)\s*(?:mm)?/i),
    gpuSlotWidth: extractNumber(specText, /(?:슬롯|slot)\s*:\s*(\d+(?:\.\d+)?)/i),
    gpuTdpW: extractNumber(specText, /사용전력\s*:\s*(\d+(?:\.\d+)?)\s*W/i),
    gpuFanCount: extractNumber(specText, /(\d+)팬/),
    gpuWarrantyText: extractText(specText, /(A\/S\s*[^/]+)/i),
  });
}

function parseCaseStructuredSpecs(specText: string) {
  return removeUndefinedValues({
    caseType: firstSpecSegment(specText),
    caseSupportedFormFactors: extractText(specText, /지원보드규격\s*:\s*([^/]+)/),
    caseMaxGpuLengthMm: extractNumber(specText, /VGA\s*길이\s*:\s*(\d+(?:\.\d+)?)\s*mm/i),
    caseMaxCoolerHeightMm: extractNumber(specText, /CPU쿨러\s*높이\s*:\s*(\d+(?:\.\d+)?)\s*mm/i),
    casePsuFormFactor: extractText(specText, /지원파워규격\s*:\s*([^/]+)/),
    caseMaxPsuLengthMm: extractNumber(specText, /파워\s*장착\s*길이\s*:\s*(\d+(?:\.\d+)?)\s*mm/i),
    caseGpuSlotCount:
      extractNumber(specText, /(?:PCI|확장)\s*슬롯\s*:\s*(\d+(?:\.\d+)?)\s*개/i) ??
      extractNumber(specText, /슬롯\s*:\s*(\d+(?:\.\d+)?)\s*개/i),
    caseFanCount: extractNumber(specText, /쿨링팬\s*:\s*총\s*(\d+)개/),
    caseFrontPanelType: extractText(specText, /전면\s*패널\s*타입\s*:\s*([^/]+)/),
    caseSidePanelType: extractText(specText, /측면\s*패널\s*타입\s*:\s*([^/]+)/),
  });
}

function parseCoolerStructuredSpecs(specText: string) {
  return removeUndefinedValues({
    coolerType: firstSpecSegment(specText),
    coolerHeightMm: extractNumber(specText, /높이\s*:\s*(\d+(?:\.\d+)?)\s*mm/i),
    coolerRadiatorMm:
      extractNumber(specText, /라디에이터\s*:\s*(\d+(?:\.\d+)?)\s*mm/i) ??
      extractNumber(specText, /(?:수랭|일체형)\s*.*?(\d{3})\s*mm/i),
    coolerSupportedSockets: extractText(specText, /지원\s*소켓\s*:\s*([^/]+)/),
    coolerTdpCapacityW: extractNumber(specText, /(?:TDP|열설계전력|쿨링성능)\s*:?\s*(\d+(?:\.\d+)?)\s*W/i),
  });
}

function parsePsuStructuredSpecs(specText: string) {
  return removeUndefinedValues({
    psuWattageW: extractNumber(specText, /정격출력\s*:\s*(\d+(?:\.\d+)?)\s*W/i) ?? extractNumber(specText, /(\d+(?:\.\d+)?)\s*W/),
    psuEfficiency: extractText(specText, /(80PLUS\s*[^/]+)/i),
    psuFormFactor: firstSpecSegment(specText),
    psuAtxVersion: extractText(specText, /(ATX\s*3\.1|ATX\s*3\.0)/i),
    psuConnectorText: extractConnectorText(specText),
    psuPcie8pinCount: extractConnectorCount(specText, /(?:PCIe|VGA)[^/]*?(?:8핀|6\+2)[^/]*?x\s*(\d+)/i),
    psuHas12vhpwr: /12VHPWR/i.test(specText) ? true : undefined,
    psuHas12v2x6: /12V[-\s]?2x6|12V2x6/i.test(specText) ? true : undefined,
    psuModularText: extractText(specText, /(풀모듈러|세미모듈러|케이블일체형)/),
  });
}

function parseMotherboardStructuredSpecs(specText: string) {
  const chipset = firstSpecSegment(specText);

  return removeUndefinedValues({
    motherboardChipset: chipset,
    motherboardSocket: extractText(specText, /(AMD\(소켓[^)]+\)|인텔\(소켓[^)]+\)|소켓\s*[^/]+)/),
    motherboardFormFactor: extractText(specText, /(M-ATX|Mini-ITX|E-ATX|ATX)/),
    motherboardRamType: extractText(specText, /(DDR5|DDR4)/),
    motherboardM2SlotText: extractText(specText, /M\.2\s*:\s*([^/]+)/i),
    motherboardSupportedCpuSeries: inferSupportedCpuSeries(chipset),
    motherboardBiosSupportNotes: inferBiosSupportNotes(chipset),
  });
}

function parseRamStructuredSpecs(specText: string) {
  return removeUndefinedValues({
    ramType: extractText(specText, /(DDR5|DDR4)/),
    ramCapacityGb: extractNumber(specText, /(\d+(?:\.\d+)?)\s*GB/i),
    ramSpeedMhz: extractNumber(specText, /(\d+(?:\.\d+)?)\s*MHz/i) ?? extractNumber(specText, /PC\d+-?(\d+)/i),
    ramTiming: extractText(specText, /(CL\d+(?:-\d+)*)/i),
  });
}

function parseSsdStructuredSpecs(specText: string) {
  return removeUndefinedValues({
    ssdInterface: extractText(specText, /(PCIe\s*[\d.]+|SATA3?|NVMe)/i),
    ssdFormFactor: extractText(specText, /(M\.2|2\.5형|3\.5형)/i),
    ssdCapacityText: extractText(specText, /(\d+(?:\.\d+)?\s*(?:TB|GB))/i),
  });
}

function parseCpuStructuredSpecs(specText: string) {
  const first = firstSpecSegment(specText) ?? "";

  return removeUndefinedValues({
    cpuSocket: extractText(specText, /(AMD\(소켓[^)]+\)|인텔\(소켓[^)]+\)|소켓\s*[^/]+)/),
    cpuSeries: inferCpuSeries(`${first} ${specText}`),
    cpuGeneration: inferCpuGeneration(`${first} ${specText}`),
    cpuCoreText: extractText(specText, /(\d+\s*코어[^/]*)/),
    cpuThreadText: extractText(specText, /(\d+\s*스레드[^/]*)/),
    cpuTdpW: extractNumber(specText, /TDP\s*:\s*(\d+(?:\.\d+)?)\s*W/i),
  });
}

function extractConnectorText(specText: string) {
  return [
    extractText(specText, /((?:PCIe|VGA)[^/]*(?:8핀|6\+2)[^/]*)/i),
    extractText(specText, /(12V[-\s]?2x6[^/]*)/i),
    extractText(specText, /(12VHPWR[^/]*)/i),
  ]
    .filter(Boolean)
    .join(" / ");
}

function extractConnectorCount(specText: string, pattern: RegExp) {
  return extractNumber(specText, pattern) ?? (/8핀|6\+2/i.test(specText) ? 1 : undefined);
}

function inferSupportedCpuSeries(chipset?: string) {
  if (!chipset) return undefined;
  if (/A620|B650|X670/i.test(chipset)) return "Ryzen 7000,Ryzen 8000,Ryzen 9000";
  if (/B850|X870/i.test(chipset)) return "Ryzen 7000,Ryzen 8000,Ryzen 9000";
  if (/B760|Z790|H770|H610/i.test(chipset)) return "Intel 12th,Intel 13th,Intel 14th";
  if (/B860|Z890|H810/i.test(chipset)) return "Intel Core Ultra 200";
  return undefined;
}

function inferBiosSupportNotes(chipset?: string) {
  if (!chipset) return undefined;
  if (/A620|B650|X670/i.test(chipset)) return "Ryzen 9000 사용 시 출고 BIOS 버전 확인 필요";
  if (/B760|Z790|H770|H610/i.test(chipset)) return "Intel 14th 사용 시 출고 BIOS 버전 확인 필요";
  return undefined;
}

function inferCpuSeries(value: string) {
  if (/Ryzen|라이젠/i.test(value)) {
    const model = value.match(/(?:Ryzen|라이젠)\s*[3579]?\s*[- ]?\s*(\d{4})/i)?.[1] ?? value.match(/\b(\d{4})X?3?D?\b/i)?.[1];
    if (!model) return undefined;
    const generation = model[0];
    if (generation === "9") return "Ryzen 9000";
    if (generation === "8") return "Ryzen 8000";
    if (generation === "7") return "Ryzen 7000";
    if (generation === "5") return "Ryzen 5000";
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

function firstSpecSegment(specText: string) {
  return specText.split("/")[0]?.trim() || undefined;
}

function extractText(value: string, pattern: RegExp) {
  return value.match(pattern)?.[1]?.trim();
}

function extractNumber(value: string, pattern: RegExp) {
  const matched = value.match(pattern)?.[1];
  if (!matched) return undefined;

  const parsed = Number(matched.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function removeUndefinedValues(values: Record<string, string | number | boolean | undefined>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined && value !== ""));
}

function parseInteger(value?: string) {
  if (!value) return undefined;

  const parsed = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function cleanText(value: string) {
  return decodeHtml(
    value
      .replace(/<em>\s*\/\s*<\/em>/g, " / ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();
}

function productNameIncludesTerm(productName: string, term: string) {
  if (productName.includes(term)) return true;

  const aliases: Record<string, string[]> = {
    ryzen: ["라이젠"],
    ventus: ["벤투스"],
    tuf: ["터프"],
    mortar: ["박격포"],
    pulse: ["펄스"],
    seasonic: ["시소닉"],
    micronics: ["마이크로닉스"],
    superflower: ["슈퍼플라워"],
    darkflash: ["다크플래쉬", "다크플래시"],
  };

  return aliases[term]?.some((alias) => productName.includes(alias)) ?? false;
}

function createSnapshotId(value: string) {
  return `danawa-rank-${value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").slice(0, 48)}-${Date.now().toString(36)}`;
}

function categoryLabel(category: PartCategory) {
  const labels: Record<PartCategory, string> = {
    cpu: "CPU",
    cooler: "쿨러",
    motherboard: "메인보드",
    ram: "RAM",
    gpu: "GPU",
    ssd: "SSD",
    psu: "파워",
    case: "케이스",
  };

  return labels[category];
}

function isItemList(value: unknown): value is { itemListElement: { name: string; url: string; position?: string }[] } {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { "@type"?: unknown; itemListElement?: unknown };
  return candidate["@type"] === "ItemList" && Array.isArray(candidate.itemListElement);
}
