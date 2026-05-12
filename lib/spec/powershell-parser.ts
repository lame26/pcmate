import type { BuildWarning, Confidence } from "@/types/build";
import type { CurrentPcSpec, ParseSpecRequest, ParseSpecResponse } from "@/types/spec";

type JsonRecord = Record<string, unknown>;

const BYTES_PER_GB = 1024 ** 3;

const EXTERNAL_GPU_MARKERS = [
  "nvidia",
  "geforce",
  "rtx",
  "gtx",
  "radeon rx",
  "radeon pro",
  "arc a",
  "intel arc",
];

const INTEGRATED_GPU_MARKERS = [
  "intel(r) uhd",
  "intel uhd",
  "intel hd",
  "iris xe",
  "radeon graphics",
  "vega graphics",
  "microsoft basic",
  "remote display",
];

export function parsePowerShellSpec(request: ParseSpecRequest): ParseSpecResponse {
  const raw = request.raw.trim();

  if (!raw) {
    return createResponse({}, "low", ["붙여넣은 PowerShell 결과가 비어 있습니다."]);
  }

  if (request.format === "json") {
    return parseJson(raw);
  }

  if (request.format === "text") {
    return parseText(raw);
  }

  const jsonResult = parseJson(raw, { silentJsonError: true });

  if (!jsonResult.warnings.some((warning) => warning.includes("JSON 형식으로 해석하지 못해"))) {
    return jsonResult;
  }

  const textResult = parseText(raw);
  const warnings = jsonResult.warnings.filter((warning) => !warning.includes("JSON"));

  return {
    ...textResult,
    warnings: [...warnings, ...textResult.warnings],
  };
}

function parseJson(raw: string, options?: { silentJsonError?: boolean }): ParseSpecResponse {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return createResponse(
      {},
      "low",
      options?.silentJsonError ? ["JSON 형식으로 해석하지 못해 텍스트 파싱을 시도합니다."] : ["JSON 형식이 올바르지 않습니다."]
    );
  }

  const root = asRecord(parsed);

  if (!root) {
    return createResponse({}, "low", ["JSON 최상위 값은 객체여야 합니다."]);
  }

  const cpu = pickName(findSection(root, ["cpu", "processor", "win32_processor"]));
  const gpu = pickBestGpu(toRecords(findSection(root, ["gpu", "video", "videocontroller", "win32_videocontroller"])));
  const memoryRecords = toRecords(findSection(root, ["memory", "ram", "physicalmemory", "win32_physicalmemory"]));
  const board = pickMotherboard(findSection(root, ["baseboard", "motherboard", "mainboard", "win32_baseboard"]));
  const storage = pickStorage(toRecords(findSection(root, ["disk", "storage", "physicaldisk", "diskdrive", "win32_diskdrive"])));

  const ram = pickRam(memoryRecords);
  const spec: Partial<CurrentPcSpec> = compactSpec({
    cpu,
    gpu,
    ram,
    motherboard: board,
    storage,
  });

  const warnings = createMissingWarnings(spec);
  const confidence = confidenceFor(spec, warnings.length, "json");

  return createResponse(spec, confidence, warnings);
}

function parseText(raw: string): ParseSpecResponse {
  const normalized = raw.replace(/\r\n/g, "\n");
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const cpu = matchFirst(normalized, [
    /(?:CPU|Processor|Win32_Processor|프로세서)[^\n:]*[:=]\s*(.+)/i,
    /Name\s*[:=]\s*(.+(?:Intel|AMD|Ryzen|Core).*)/i,
  ]);

  const gpuCandidates = lines
    .map((line) => matchLineValue(line, /(?:GPU|VideoController|Video Controller|그래픽|VGA|Adapter)[^\n:]*[:=]\s*(.+)/i))
    .filter(isPresent);
  const gpuFromNameLines = lines
    .map((line) => matchLineValue(line, /Name\s*[:=]\s*(.+(?:NVIDIA|GeForce|RTX|GTX|Radeon|Intel Arc|Intel\(R\) Arc|Intel UHD|Iris).*)/i))
    .filter(isPresent);
  const gpu = chooseGpu([...gpuCandidates, ...gpuFromNameLines]);

  const ramCapacities = lines
    .map((line) =>
      matchLineValue(line, /^(?:Capacity|TotalPhysicalMemory|RAM|Memory|메모리)\b[^\n:]*[:=]\s*([0-9,.]+\s*(?:bytes?|b|kb|mb|gb|tb)?)/i)
    )
    .filter(isPresent)
    .map(parseCapacityGb)
    .filter(isPresent);
  const ramTotalGb = sumReasonableRamValues(ramCapacities);
  const ramSpeed = matchFirst(normalized, [/(?:Speed|ConfiguredClockSpeed|클럭)[^\n:]*[:=]\s*(\d{3,5})/i]);
  const ramType = inferRamType(normalized);

  const manufacturer = matchFirst(normalized, [/(?:BaseBoard.*Manufacturer|Board.*Manufacturer|Manufacturer|제조사)\s*[:=]\s*(.+)/i]);
  const product = matchFirst(normalized, [/(?:BaseBoard.*Product|Board.*Product|Product|모델)\s*[:=]\s*(.+)/i]);
  const motherboard = [manufacturer, product].filter(Boolean).join(" ").trim() || undefined;

  const diskNames = lines
    .map((line) => matchLineValue(line, /(?:FriendlyName|Disk|Drive|Storage|디스크|저장장치)[^\n:]*[:=]\s*(.+)/i))
    .filter(isPresent);
  const diskSizes = lines
    .map((line) => matchLineValue(line, /(?:Size)[^\n:]*[:=]\s*([0-9,.]+\s*(?:bytes?|b|kb|mb|gb|tb)?)/i))
    .filter(isPresent)
    .map(parseCapacityGb)
    .filter(isPresent);
  const mediaTypes = lines
    .map((line) => matchLineValue(line, /(?:MediaType|BusType|Type)[^\n:]*[:=]\s*(.+)/i))
    .filter(isPresent);
  const storage = diskNames.slice(0, 4).map((name, index) => ({
    name,
    sizeGb: diskSizes[index],
    mediaType: inferMediaType([name, mediaTypes[index]].filter(Boolean).join(" ")),
  }));

  const spec: Partial<CurrentPcSpec> = compactSpec({
    cpu,
    gpu,
    ram:
      ramTotalGb || ramSpeed || ramType !== "unknown"
        ? {
            totalGb: ramTotalGb,
            type: ramType,
            speedMhz: ramSpeed ? Number(ramSpeed) : undefined,
          }
        : undefined,
    motherboard,
    storage: storage.length ? storage : undefined,
  });

  const warnings = createMissingWarnings(spec);
  const confidence = confidenceFor(spec, warnings.length, "text");

  return createResponse(spec, confidence, warnings);
}

function createResponse(spec: Partial<CurrentPcSpec>, confidence: Confidence, warnings: string[]): ParseSpecResponse {
  return {
    spec: {
      ...spec,
      parseConfidence: confidence,
      warnings: warnings.map(toBuildWarning),
    },
    confidence,
    warnings,
  };
}

function toBuildWarning(message: string, index: number): BuildWarning {
  return {
    id: `spec-parse-${index + 1}`,
    severity: "warning",
    code: "SPEC_PARSE_WARNING",
    message,
  };
}

function createMissingWarnings(spec: Partial<CurrentPcSpec>) {
  const warnings: string[] = [];

  if (!spec.cpu) warnings.push("CPU 정보를 찾지 못했습니다. 수동 확인이 필요합니다.");
  if (!spec.gpu) warnings.push("GPU 정보를 찾지 못했습니다. 내장/외장 그래픽을 수동 확인해 주세요.");
  if (!spec.ram?.totalGb) warnings.push("RAM 용량을 찾지 못했습니다.");
  if (!spec.motherboard) warnings.push("메인보드 정보를 찾지 못했습니다.");
  if (!spec.storage?.length) warnings.push("저장장치 정보를 찾지 못했습니다.");

  return warnings;
}

function confidenceFor(spec: Partial<CurrentPcSpec>, warningCount: number, format: "json" | "text"): Confidence {
  const fieldCount = [spec.cpu, spec.gpu, spec.ram?.totalGb, spec.motherboard, spec.storage?.length].filter(Boolean).length;

  if (format === "json" && fieldCount >= 4 && warningCount <= 1) return "high";
  if (fieldCount >= 3) return "medium";

  return "low";
}

function compactSpec(spec: Partial<CurrentPcSpec>): Partial<CurrentPcSpec> {
  return Object.fromEntries(
    Object.entries(spec).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object" && value !== null) return Object.values(value).some((item) => item !== undefined);
      return value !== undefined && value !== "";
    })
  ) as Partial<CurrentPcSpec>;
}

function findSection(root: JsonRecord, aliases: string[]): unknown {
  const normalizedAliases = aliases.map(normalizeKey);
  const direct = Object.entries(root).find(([key]) => normalizedAliases.includes(normalizeKey(key)));

  if (direct) return direct[1];

  const fuzzy = Object.entries(root).find(([key]) => normalizedAliases.some((alias) => normalizeKey(key).includes(alias)));

  if (fuzzy) return fuzzy[1];

  return undefined;
}

function pickName(value: unknown): string | undefined {
  const record = toRecords(value)[0] ?? asRecord(value);
  if (!record) return typeof value === "string" ? cleanText(value) : undefined;

  return cleanText(
    pickString(record, ["Name", "Caption", "Model", "ProcessorName", "DeviceName"]) ??
      (typeof value === "string" ? value : undefined)
  );
}

function pickBestGpu(records: JsonRecord[]) {
  const names = records
    .map((record) => pickString(record, ["Name", "Caption", "VideoProcessor", "AdapterCompatibility"]))
    .filter(isPresent);

  return chooseGpu(names);
}

function chooseGpu(names: string[]) {
  if (!names.length) return undefined;

  const usable = names.filter((name) => !includesAny(name, ["microsoft basic", "remote display"]));
  const candidates = usable.length ? usable : names;
  const external = candidates.find((name) => includesAny(name, EXTERNAL_GPU_MARKERS));

  return cleanText(external ?? candidates.find((name) => !includesAny(name, INTEGRATED_GPU_MARKERS)) ?? candidates[0]);
}

function pickMotherboard(value: unknown): string | undefined {
  const record = toRecords(value)[0] ?? asRecord(value);
  if (!record) return typeof value === "string" ? cleanText(value) : undefined;

  return cleanText([pickString(record, ["Manufacturer", "Vendor"]), pickString(record, ["Product", "Model", "Name"])]
    .filter(Boolean)
    .join(" "));
}

function pickRam(records: JsonRecord[]): CurrentPcSpec["ram"] | undefined {
  if (!records.length) return undefined;

  const capacities = records
    .map((record) => pickStringOrNumber(record, ["Capacity", "Size", "ConfiguredCapacity"]))
    .map(parseCapacityGb)
    .filter(isPresent);
  const totalGb = sumReasonableRamValues(capacities);
  const speedMhz = firstNumber(records, ["Speed", "ConfiguredClockSpeed"]);
  const type = inferRamType(
    records
      .flatMap((record) => [
        pickStringOrNumber(record, ["SMBIOSMemoryType", "MemoryType", "Type"]),
        pickString(record, ["PartNumber", "Description"]),
      ])
      .filter(isPresent)
      .map(String)
      .join(" ")
  );

  if (!totalGb && !speedMhz && type === "unknown") return undefined;

  return {
    totalGb,
    type,
    speedMhz,
  };
}

function pickStorage(records: JsonRecord[]): NonNullable<CurrentPcSpec["storage"]> | undefined {
  const storage = records
    .map((record) => {
      const name = cleanText(pickString(record, ["FriendlyName", "Name", "Model", "Caption", "DeviceId"]));
      const sizeGb = parseCapacityGb(pickStringOrNumber(record, ["Size", "Capacity", "AllocatedSize"]));
      const mediaType = inferMediaType(
        [name, pickString(record, ["MediaType", "BusType", "SpindleSpeed", "Description"])].filter(Boolean).join(" ")
      );

      return { name, sizeGb, mediaType };
    })
    .filter((disk) => disk.name || disk.sizeGb);

  return storage.length ? storage : undefined;
}

function toRecords(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.map(asRecord).filter(isPresent);
  const record = asRecord(value);
  return record ? [record] : [];
}

function asRecord(value: unknown): JsonRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as JsonRecord) : undefined;
}

function pickString(record: JsonRecord, keys: string[]) {
  const value = pickValue(record, keys);
  return typeof value === "string" ? cleanText(value) : undefined;
}

function pickStringOrNumber(record: JsonRecord, keys: string[]) {
  const value = pickValue(record, keys);
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

function pickValue(record: JsonRecord, keys: string[]) {
  const normalizedKeys = keys.map(normalizeKey);
  const entry = Object.entries(record).find(([key]) => normalizedKeys.includes(normalizeKey(key)));
  return entry?.[1];
}

function firstNumber(records: JsonRecord[], keys: string[]) {
  for (const record of records) {
    const value = pickStringOrNumber(record, keys);
    const parsed = typeof value === "number" ? value : Number(value);

    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return undefined;
}

function parseCapacityGb(value: string | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return normalizeCapacityNumber(value);

  const normalized = value.replace(/,/g, "").trim().toLowerCase();
  const amount = Number(normalized.match(/[0-9.]+/)?.[0]);

  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  if (normalized.includes("tb")) return Math.round(amount * 1024);
  if (normalized.includes("gb")) return Math.round(amount);
  if (normalized.includes("mb")) return Math.round(amount / 1024);
  if (normalized.includes("kb")) return Math.round(amount / 1024 / 1024);
  if (normalized.includes("byte") || normalized.endsWith("b")) return normalizeCapacityNumber(amount);

  return normalizeCapacityNumber(amount);
}

function normalizeCapacityNumber(value: number) {
  if (value > 1024 ** 3) return Math.round(value / BYTES_PER_GB);
  if (value > 1024 ** 2) return Math.round(value / 1024 / 1024);
  if (value > 1024) return Math.round(value / 1024);
  return Math.round(value);
}

function sumReasonableRamValues(values: number[]) {
  const ramValues = values.filter((value) => value > 0 && value <= 256);
  if (!ramValues.length) return undefined;

  return ramValues.reduce((total, value) => total + value, 0);
}

function inferRamType(value: string): "DDR4" | "DDR5" | "unknown" {
  const normalized = value.toLowerCase();
  if (normalized.includes("ddr5") || /\b34\b/.test(normalized)) return "DDR5";
  if (normalized.includes("ddr4") || /\b26\b/.test(normalized)) return "DDR4";
  return "unknown";
}

function inferMediaType(value: string): "HDD" | "SATA_SSD" | "NVME" | "unknown" {
  const normalized = value.toLowerCase();
  if (normalized.includes("nvme")) return "NVME";
  if (normalized.includes("ssd") || normalized.includes("solid")) return "SATA_SSD";
  if (normalized.includes("hdd") || normalized.includes("hard disk")) return "HDD";
  return "unknown";
}

function matchFirst(value: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    const result = cleanText(match?.[1]);

    if (result) return result;
  }

  return undefined;
}

function matchLineValue(value: string, pattern: RegExp) {
  return cleanText(value.match(pattern)?.[1]);
}

function cleanText(value: string | undefined) {
  return value?.replace(/\s+/g, " ").replace(/["']/g, "").trim() || undefined;
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function includesAny(value: string, markers: string[]) {
  const normalized = value.toLowerCase();
  return markers.some((marker) => normalized.includes(marker));
}

function isPresent<T>(value: T | undefined | null | ""): value is T {
  return value !== undefined && value !== null && value !== "";
}
