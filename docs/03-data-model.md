# 데이터 모델 설계

## 공통 타입

```ts
export type Confidence = "low" | "medium" | "high";
export type SourceType =
  | "manual"
  | "static"
  | "danawa-paste"
  | "danawa-ranking"
  | "danawa-csv-price"
  | "estimated";

export type DataSource = {
  type: SourceType;
  name?: string;
  url?: string;
  updatedAt: string;
};

export type WarningSeverity = "info" | "warning" | "critical";

export type BuildWarning = {
  id: string;
  severity: WarningSeverity;
  code: string;
  message: string;
  targetPartId?: string;
};
```

## 사용자 프로필

```ts
export type BuildMode = "full-build" | "upgrade";

export type UserProfile = {
  id: string;
  buildMode: BuildMode;
  budget?: {
    totalKrw: number;
    flexible: boolean;
  };
  selectedCardProviderIds: string[];
  selectedMembershipIds: string[];
  createdAt: string;
  updatedAt: string;
};
```

## 현재 PC 사양

```ts
export type CurrentPcSpec = {
  cpu?: string;
  gpu?: string;
  ram?: {
    totalGb?: number;
    type?: "DDR4" | "DDR5" | "unknown";
    speedMhz?: number;
  };
  motherboard?: string;
  storage?: {
    name?: string;
    sizeGb?: number;
    mediaType?: "HDD" | "SATA_SSD" | "NVME" | "unknown";
  }[];
  psu?: {
    name?: string;
    wattage?: number;
    ageYears?: number;
  };
  monitors?: MonitorProfile[];
  vrDevice?: string;
  reusablePartIds: PartCategory[];
  parseConfidence?: Confidence;
  warnings: BuildWarning[];
};
```

## 사용 조건

```ts
export type Resolution = "FHD" | "QHD" | "UWQHD" | "4K";
export type RefreshRateTier = "60-75" | "100-120" | "144-180" | "240-plus";

export type MonitorProfile = {
  resolution: Resolution;
  refreshRateTier: RefreshRateTier;
  count: number;
};

export type UsageProfile = {
  selectedGames: SelectedGame[];
  customRequirements: CustomRequirement[];
  multitasking: MultitaskingProfile;
  monitors: MonitorProfile[];
  usesVr: boolean;
  usesCaptureCard: boolean;
  preferences: UserPreferences;
};

export type SelectedGame = {
  gameId: string;
  frequency: "rare" | "normal" | "often" | "main";
  optionTarget: "low" | "medium" | "high" | "ultra";
};

export type MultitaskingProfile = {
  browserTabs: "under-10" | "over-20" | "over-50";
  concurrentApps: string[];
  workApps: string[];
  usesObsRecording: boolean;
  usesObsStreaming: boolean;
  usesLocalAi: boolean;
};

export type UserPreferences = {
  color: "black" | "white" | "any";
  cooling: "air" | "liquid" | "any";
  rgb: "prefer" | "avoid" | "any";
  caseSize: "mini" | "mid" | "avoid-big" | "any";
  noise: "quiet" | "any";
  gpuVendor: "nvidia" | "radeon-ok" | "any";
  reuse: {
    ssd: boolean;
    case: boolean;
    psu: boolean;
  };
};
```

## 게임 데이터

```ts
export type DemandTier = "veryLow" | "low" | "medium" | "high" | "veryHigh" | "extreme";
export type DemandType = "official" | "estimated" | "manual";

export type GameProfile = {
  id: string;
  name: string;
  aliases: string[];
  genre: string[];
  demandTier: DemandTier;
  demandType: DemandType;
  cpuSensitivity: 1 | 2 | 3 | 4 | 5;
  gpuSensitivity: 1 | 2 | 3 | 4 | 5;
  ramRecommendedGb: 16 | 32 | 64;
  vramRecommendedGb: 6 | 8 | 12 | 16 | 24;
  supportsRayTracing: boolean;
  vrGame: boolean;
  onlineCompetitive: boolean;
  notes: string[];
  source: DataSource;
  confidence: Confidence;
};

export type CustomRequirement = {
  id: string;
  rawText: string;
  parsedCpu?: string;
  parsedGpu?: string;
  parsedRamGb?: number;
  estimatedDemandTier: DemandTier;
  confidence: Confidence;
  warnings: string[];
};
```

## 부품 데이터

```ts
export type PartCategory =
  | "cpu"
  | "cooler"
  | "motherboard"
  | "ram"
  | "gpu"
  | "ssd"
  | "psu"
  | "case";

export type PartLineTier = "entry" | "mainstream" | "upper-mainstream" | "high" | "flagship";
export type MarketPosition = "cheap" | "fair" | "expensive" | "unknown";

export type Part = {
  id: string;
  category: PartCategory;
  name: string;
  brand: string;
  model: string;
  aliases: string[];
  specs: PartSpecs;
  classification: PartClassification;
  offers: PriceOffer[];
  source: DataSource;
  confidence: Confidence;
  updatedAt: string;
};

export type PartClassification = {
  chipTier?: string;
  brandLineTier: PartLineTier;
  marketPosition: MarketPosition;
  vrmTier?: "basic" | "adequate" | "strong" | "unknown";
  coolingTier?: "basic" | "adequate" | "strong" | "unknown";
  distributor?: string;
  distributorScore?: number;
  confidence: Confidence;
  reasons: string[];
};
```

`PartSpecs`는 카테고리별로 분기한다.

```ts
export type PartSpecs = CpuSpecs | CoolerSpecs | MotherboardSpecs | RamSpecs | GpuSpecs | SsdSpecs | PsuSpecs | CaseSpecs;

export type CpuSpecs = {
  kind: "cpu";
  socket?: string;
  generation?: string;
  series?: string;
  cores?: number;
  threads?: number;
  gamingTier?: number;
  productivityTier?: number;
  tdpW?: number;
};

export type GpuSpecs = {
  kind: "gpu";
  chipset: string;
  vramGb?: number;
  lengthMm?: number;
  thicknessMm?: number;
  slotWidth?: number;
  recommendedPsuW?: number;
  powerConnectors?: string[];
  gamingTier?: number;
  rayTracingTier?: number;
};

export type MotherboardSpecs = {
  kind: "motherboard";
  socket?: string;
  chipset?: string;
  formFactor?: "Mini-ITX" | "M-ATX" | "ATX" | "E-ATX";
  ramType?: "DDR4" | "DDR5";
  m2Slots?: number;
  supportedCpuSeries?: string[];
  biosSupportNotes?: string[];
  minBiosVersion?: string;
};

export type RamSpecs = {
  kind: "ram";
  type?: "DDR4" | "DDR5";
  totalGb?: number;
  moduleCount?: number;
  speedMhz?: number;
  timing?: string;
  profile?: "XMP" | "EXPO" | "both" | "none";
  heightMm?: number;
};

export type CoolerSpecs = {
  kind: "cooler";
  type: "air" | "liquid";
  supportedSockets?: string[];
  heightMm?: number;
  radiatorSizeMm?: 120 | 240 | 280 | 360 | 420;
  coolingCapacityTier?: "basic" | "adequate" | "strong" | "unknown";
  tdpCapacityW?: number;
};

export type PsuSpecs = {
  kind: "psu";
  wattage?: number;
  efficiency?: string;
  atxVersion?: "ATX 3.0" | "ATX 3.1" | "unknown";
  gpuConnectors?: string[];
  pcie8pinCount?: number;
  has12vhpwr?: boolean;
  has12v2x6?: boolean;
  native12v2x6?: boolean;
  qualityTier?: "entry" | "mainstream" | "high" | "unknown";
  modular?: "none" | "semi" | "full";
};

export type CaseSpecs = {
  kind: "case";
  supportedFormFactors?: string[];
  maxGpuLengthMm?: number;
  gpuSlotCount?: number;
  maxCoolerHeightMm?: number;
  topRadiatorMm?: number;
  frontRadiatorMm?: number;
  color: "black" | "white" | "other";
};

export type SsdSpecs = {
  kind: "ssd";
  capacityGb?: number;
  interface?: "SATA" | "NVME";
  formFactor?: "2.5" | "M.2";
};
```

## 가격 데이터

```ts
export type CardProvider = {
  id: string;
  name: string;
  type: "card" | "membership" | "pay";
};

export type BenefitRule = {
  id: string;
  providerId: string;
  mall?: string;
  type: "instant" | "statement" | "coupon" | "membership" | "unknown";
  description: string;
  enabledInMvp: boolean;
};

export type PriceOffer = {
  id: string;
  partId?: string;
  productName: string;
  mall: string;
  url?: string;
  pcode?: string;
  basePrice: number;
  benefitPrice?: number;
  cardProviderId?: string;
  shippingFee?: number;
  availability: "in-stock" | "sold-out" | "unknown";
  priceType: "normal" | "card" | "coupon" | "cash" | "used" | "unknown";
  source: DataSource;
  confidence: Confidence;
  warnings: string[];
  rawText?: string;
  updatedAt: string;
};

export type PriceSnapshot = {
  id: string;
  pcode?: string;
  searchQuery?: string;
  category?: PartCategory;
  offers: PriceOffer[];
  source: DataSource;
  confidence: Confidence;
  warnings: string[];
  updatedAt: string;
};
```

## 진단과 추천

```ts
export type RequirementProfile = {
  cpuTier: number;
  gpuTier: number;
  ramGb: 16 | 32 | 64;
  vramGb: 6 | 8 | 12 | 16 | 24;
  psuWattage: number;
  reasons: string[];
  warnings: BuildWarning[];
};

export type RecommendationCandidate = {
  id: string;
  category: PartCategory;
  part: Part;
  role: "budget" | "recommended" | "premium";
  bestOffer?: PriceOffer;
  effectivePrice?: number;
  scores: RecommendationScores;
  totalScore: number;
  reasons: string[];
  warnings: BuildWarning[];
};

export type RecommendationScores = {
  performanceFitScore: number;
  priceScore: number;
  compatibilityScore: number;
  preferenceScore: number;
  classificationScore: number;
};
```

## 견적

```ts
export type Build = {
  id: string;
  profile: UserProfile;
  currentSpec: CurrentPcSpec;
  usage: UsageProfile;
  requirement: RequirementProfile;
  selectedParts: Partial<Record<PartCategory, RecommendationCandidate>>;
  pricingSummary: PricingSummary;
  warnings: BuildWarning[];
  createdAt: string;
  updatedAt: string;
};

export type PricingSummary = {
  baseTotal: number;
  benefitTotal: number;
  shippingTotal: number;
  discountTotal: number;
  byCardProvider: {
    providerId: string;
    total: number;
    discount: number;
  }[];
};
```

## localStorage 구조

키:

```text
pcmate.build.v1
```

값:

```ts
export type StoredBuildState = {
  schemaVersion: 1;
  build: Build;
  priceSnapshots: PriceSnapshot[];
  lastSavedAt: string;
};
```

정책:
- 모든 저장은 schemaVersion 포함
- 파싱 원문은 사용자가 입력한 가격/사양 분석을 재검토할 수 있도록 보관
- 민감한 개인정보는 저장하지 않음
