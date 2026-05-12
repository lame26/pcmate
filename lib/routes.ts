export type AppRoute = {
  href: string;
  label: string;
};

export const appRoutes: AppRoute[] = [
  { href: "/", label: "홈" },
  { href: "/cards", label: "카드" },
  { href: "/spec", label: "현재 사양" },
  { href: "/games", label: "게임" },
  { href: "/usage", label: "작업" },
  { href: "/preferences", label: "선호도" },
  { href: "/diagnosis", label: "판독" },
  { href: "/pricing", label: "가격" },
  { href: "/builder", label: "빌더" },
  { href: "/summary", label: "최종 견적" },
];
