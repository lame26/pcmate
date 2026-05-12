import type { Confidence } from "@/types/build";
import type { PartCategory } from "@/types/parts";
import type { PriceOffer, PriceSnapshot } from "@/types/pricing";

type DanawaCsvRow = {
  id: string;
  name: string;
  latestLabel: string;
  latestValue: string;
};

const categoryFileMap: Record<PartCategory, string> = {
  cpu: "CPU",
  cooler: "Cooler",
  motherboard: "MBoard",
  ram: "RAM",
  gpu: "VGA",
  ssd: "SSD",
  psu: "Power",
  case: "Case",
};

const sourceBaseUrl = "https://raw.githubusercontent.com/sammy310/Danawa-Crawler/master/crawl_data";
const sourceRepoUrl = "https://github.com/sammy310/Danawa-Crawler";

export async function getDanawaGithubCsvSnapshot(input: {
  pcode?: string;
  searchQuery?: string;
  category?: PartCategory;
}): Promise<PriceSnapshot> {
  const now = new Date().toISOString();
  const categories = input.category ? [input.category] : (Object.keys(categoryFileMap) as PartCategory[]);
  const warnings = [
    "sammy310/Danawa-Crawler 공개 CSV 기반 자동 가격입니다. 실시간 다나와 상세 혜택가와 다를 수 있습니다.",
    "쇼핑몰별 상세 조건, 배송비, 카드 혜택가는 다음 단계에서 별도 확인이 필요합니다.",
  ];

  for (const category of categories) {
    const rows = await fetchCategoryRows(category);
    const matches = findMatches(rows, input);

    if (matches.length) {
      const offers = matches.flatMap((row) => rowToOffers(row, category, now)).slice(0, 5);
      const confidence: Confidence = offers.length ? "medium" : "low";

      return {
        id: createSnapshotId(input.pcode ?? input.searchQuery ?? category),
        pcode: input.pcode,
        searchQuery: input.searchQuery,
        category,
        offers,
        source: {
          type: "danawa-csv-price",
          name: "sammy310/Danawa-Crawler CSV",
          url: sourceRepoUrl,
          updatedAt: now,
        },
        confidence,
        warnings,
        updatedAt: now,
      };
    }
  }

  return {
    id: createSnapshotId(input.pcode ?? input.searchQuery ?? "not-found"),
    pcode: input.pcode,
    searchQuery: input.searchQuery,
    category: input.category,
    offers: [],
    source: {
      type: "danawa-csv-price",
      name: "sammy310/Danawa-Crawler CSV",
      url: sourceRepoUrl,
      updatedAt: now,
    },
    confidence: "low",
    warnings: [...warnings, "공개 CSV에서 일치하는 상품을 찾지 못했습니다."],
    updatedAt: now,
  };
}

async function fetchCategoryRows(category: PartCategory): Promise<DanawaCsvRow[]> {
  const fileName = categoryFileMap[category];
  const response = await fetch(`${sourceBaseUrl}/${fileName}.csv`, {
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!response.ok) return [];

  const csv = await response.text();
  const records = parseCsv(csv);
  const header = records[0] ?? [];
  const latestIndex = header.length - 1;
  const latestLabel = header[latestIndex] ?? "";

  return records
    .slice(1)
    .map((record) => ({
      id: record[0] ?? "",
      name: record[1] ?? "",
      latestLabel,
      latestValue: record[latestIndex] ?? "",
    }))
    .filter((row) => row.id && row.name && row.latestValue && row.latestValue !== "0");
}

function findMatches(rows: DanawaCsvRow[], input: { pcode?: string; searchQuery?: string }) {
  if (input.pcode) {
    return rows.filter((row) => row.id === input.pcode);
  }

  const tokens = normalize(input.searchQuery ?? "")
    .split(" ")
    .filter((token) => token.length >= 2);

  if (!tokens.length) return [];

  return rows
    .map((row) => ({
      row,
      score: tokens.filter((token) => normalize(row.name).includes(token)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.row.name.length - right.row.name.length)
    .map((item) => item.row);
}

function rowToOffers(row: DanawaCsvRow, category: PartCategory, updatedAt: string): PriceOffer[] {
  return row.latestValue
    .split("|")
    .map((value, index) => parseLatestPrice(value, index))
    .filter((offer): offer is NonNullable<typeof offer> => Boolean(offer))
    .map((parsed, index) => ({
      id: `danawa-csv-${row.id}-${index}`,
      productName: row.name,
      mall: parsed.label || "다나와 최저가",
      url: `https://prod.danawa.com/info/?pcode=${row.id}`,
      pcode: row.id,
      basePrice: parsed.price,
      availability: "unknown",
      priceType: parsed.label.includes("중고") ? "used" : parsed.label.includes("병행") ? "unknown" : "normal",
      source: {
        type: "danawa-csv-price",
        name: `sammy310/Danawa-Crawler ${category}`,
        url: sourceRepoUrl,
        updatedAt,
      },
      confidence: "medium",
      warnings: [
        `공개 CSV 최신 컬럼(${row.latestLabel}) 기준입니다.`,
        parsed.label.includes("중고") ? "중고 상품 가격일 수 있습니다." : "",
        parsed.label.includes("병행") || parsed.label.includes("해외") ? "병행수입 또는 해외구매 가격일 수 있습니다." : "",
      ].filter(Boolean),
      updatedAt,
    }));
}

function parseLatestPrice(value: string, index: number) {
  const segments = value.split("_");
  const rawPrice = segments[segments.length - 1]?.replace(/,/g, "").trim();
  const price = Number(rawPrice);

  if (!Number.isFinite(price) || price <= 0) return undefined;

  return {
    label: segments.length > 1 ? segments.slice(0, -1).join(" ") : index === 0 ? "다나와 최저가" : `가격 ${index + 1}`,
    price,
  };
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === "\"" && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();
}

function createSnapshotId(value: string) {
  return `danawa-csv-${value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").slice(0, 48)}-${Date.now().toString(36)}`;
}
