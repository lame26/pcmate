import type { PartLineTier } from "@/types/parts";

export type BrandLineRule = {
  id: string;
  category: "gpu" | "motherboard" | "psu";
  brand: string;
  line: string;
  tier: PartLineTier;
  notes: string[];
};

export const brandLines: BrandLineRule[] = [
  {
    id: "msi-gpu-ventus",
    category: "gpu",
    brand: "MSI",
    line: "VENTUS",
    tier: "mainstream",
    notes: ["보급~중급 라인으로 가격 경쟁력이 중요합니다."],
  },
  {
    id: "msi-gpu-gaming-trio",
    category: "gpu",
    brand: "MSI",
    line: "GAMING TRIO",
    tier: "upper-mainstream",
    notes: ["상위 감성 라인보다 쿨링과 가격 균형을 봅니다."],
  },
  {
    id: "asus-gpu-tuf",
    category: "gpu",
    brand: "ASUS",
    line: "TUF",
    tier: "high",
    notes: ["중상급~상급 라인으로 가격 프리미엄 확인이 필요합니다."],
  },
  {
    id: "gigabyte-gpu-windforce",
    category: "gpu",
    brand: "GIGABYTE",
    line: "WINDFORCE",
    tier: "mainstream",
    notes: ["동일 칩셋 내 상대가격을 우선 확인합니다."],
  },
  {
    id: "msi-board-mortar",
    category: "motherboard",
    brand: "MSI",
    line: "MORTAR",
    tier: "upper-mainstream",
    notes: ["M-ATX 보드의 균형형 후보로 사용합니다."],
  },
  {
    id: "asus-board-tuf",
    category: "motherboard",
    brand: "ASUS",
    line: "TUF",
    tier: "upper-mainstream",
    notes: ["전원부와 기능 대비 가격을 함께 봅니다."],
  },
  {
    id: "seasonic-psu-focus",
    category: "psu",
    brand: "Seasonic",
    line: "FOCUS",
    tier: "high",
    notes: ["보증과 플랫폼 신뢰도가 높은 후보로 분류합니다."],
  },
];
