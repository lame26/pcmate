import type { CurrentPcSpec } from "@/types/spec";
import type { PartCategory } from "@/types/parts";
import type { PriceSnapshot } from "@/types/pricing";
import type { RecommendationCandidate, RequirementProfile } from "@/types/diagnosis";
import type { UsageProfile } from "@/types/games";

export type BuildMode = "full-build" | "upgrade";

export type Confidence = "low" | "medium" | "high";

export type WarningSeverity = "info" | "warning" | "critical";

export type BuildWarning = {
  id: string;
  severity: WarningSeverity;
  code: string;
  message: string;
  targetPartId?: string;
};

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

export type StoredBuildState = {
  schemaVersion: 1;
  build: Build;
  priceSnapshots: PriceSnapshot[];
  lastSavedAt: string;
};
