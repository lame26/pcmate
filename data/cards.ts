import type { CardProvider } from "@/types/cards";

export const cardProviders: CardProvider[] = [
  { id: "samsung", name: "삼성카드", type: "card" },
  { id: "hyundai", name: "현대카드", type: "card" },
  { id: "shinhan", name: "신한카드", type: "card" },
  { id: "hana", name: "하나카드", type: "card" },
  { id: "kb", name: "KB국민카드", type: "card" },
  { id: "lotte", name: "롯데카드", type: "card" },
  { id: "woori", name: "우리카드", type: "card" },
  { id: "nh", name: "NH농협카드", type: "card" },
  { id: "smile-card", name: "스마일카드", type: "card" },
  { id: "coupang-wow", name: "쿠팡와우", type: "membership" },
  { id: "naver-pay", name: "네이버페이 멤버십", type: "membership" },
  { id: "paybook", name: "페이북", type: "pay" },
];
