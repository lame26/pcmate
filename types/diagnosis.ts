import type { BuildWarning } from "@/types/build";
import type { Confidence } from "@/types/build";
import type { CompatibilityResult } from "@/lib/compatibility/types";
import type { OfferMatchDiagnostics } from "@/lib/pricing/offer-match";
import type { Part, PartCategory } from "@/types/parts";
import type { PriceOffer } from "@/types/pricing";

export type RequirementProfile = {
  cpuTier: number;
  gpuTier: number;
  ramGb: 16 | 32 | 64;
  vramGb: 6 | 8 | 12 | 16 | 24;
  psuWattage: number;
  reasons: string[];
  warnings: BuildWarning[];
};

export type RecommendationScores = {
  performanceFitScore: number;
  priceScore: number;
  priceConfidenceScore: number;
  compatibilityScore: number;
  preferenceScore: number;
  classificationScore: number;
  specConfidenceScore: number;
};

export type RecommendationSourceKind = "static" | "danawa-ranking" | "external";

export type RecommendationCandidateMeta = {
  sourceKind: RecommendationSourceKind;
  sourceLabel: string;
  danawaRank?: number;
  pcode?: string;
  specConfidence: Confidence;
  priceConfidence: Confidence;
  specCompleteness: number;
  missingSpecFields: string[];
};

export type RecommendationCandidate = {
  id: string;
  category: PartCategory;
  part: Part;
  role: "budget" | "recommended" | "premium";
  bestOffer?: PriceOffer;
  offerMatch?: OfferMatchDiagnostics;
  effectivePrice?: number;
  scores: RecommendationScores;
  totalScore: number;
  meta: RecommendationCandidateMeta;
  display: {
    name: string;
    priceSourceName?: string;
    sourceLabel: string;
  };
  eligibility: {
    eligible: boolean;
    compatibility: CompatibilityResult;
  };
  reasons: string[];
  warnings: BuildWarning[];
};
