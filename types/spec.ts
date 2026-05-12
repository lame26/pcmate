import type { BuildWarning, Confidence } from "@/types/build";
import type { MonitorProfile } from "@/types/games";
import type { PartCategory } from "@/types/parts";

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

export type ParseSpecRequest = {
  format: "json" | "text" | "auto";
  raw: string;
};

export type ParseSpecResponse = {
  spec: Partial<CurrentPcSpec>;
  confidence: Confidence;
  warnings: string[];
};
