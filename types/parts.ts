import type { Confidence } from "@/types/build";
import type { DataSource, PriceOffer } from "@/types/pricing";

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

export type PartSpecs =
  | CpuSpecs
  | CoolerSpecs
  | MotherboardSpecs
  | RamSpecs
  | GpuSpecs
  | SsdSpecs
  | PsuSpecs
  | CaseSpecs;

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
