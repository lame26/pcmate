import type { Confidence } from "@/types/build";
import type { PartCategory } from "@/types/parts";

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
  metadata?: Record<string, string | number | boolean | undefined>;
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
