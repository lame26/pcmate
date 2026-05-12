import type { Confidence } from "@/types/build";
import type { DataSource } from "@/types/pricing";

export type Resolution = "FHD" | "QHD" | "UWQHD" | "4K";
export type RefreshRateTier = "60-75" | "100-120" | "144-180" | "240-plus";

export type MonitorProfile = {
  resolution: Resolution;
  refreshRateTier: RefreshRateTier;
  count: number;
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

export type UsageProfile = {
  selectedGames: SelectedGame[];
  customRequirements: CustomRequirement[];
  multitasking: MultitaskingProfile;
  monitors: MonitorProfile[];
  usesVr: boolean;
  usesCaptureCard: boolean;
  preferences: UserPreferences;
};

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
