export type CardProviderType = "card" | "membership" | "pay";

export type CardProvider = {
  id: string;
  name: string;
  type: CardProviderType;
};

export type BenefitRule = {
  id: string;
  providerId: string;
  mall?: string;
  type: "instant" | "statement" | "coupon" | "membership" | "unknown";
  description: string;
  enabledInMvp: boolean;
};
