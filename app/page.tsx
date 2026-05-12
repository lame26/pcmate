import Link from "next/link";
import { ArrowRight, ClipboardPaste, MonitorCog, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { appRoutes } from "@/lib/routes";

const quickActions = [
  {
    title: "새 견적 시작",
    description: "카드, 현재 사양, 게임과 작업 조건을 순서대로 입력합니다.",
    href: "/cards",
    icon: ArrowRight,
    primary: true,
  },
  {
    title: "기존 견적 이어가기",
    description: "localStorage에 저장된 입력값을 기준으로 이어갑니다.",
    href: "/summary",
    icon: RotateCcw,
  },
  {
    title: "현재 PC 사양 가져오기",
    description: "PowerShell 결과를 붙여넣고 사양을 정규화합니다.",
    href: "/spec",
    icon: MonitorCog,
  },
  {
    title: "다나와 가격 붙여넣기",
    description: "가격 텍스트를 파싱해 후보 가격 데이터로 저장합니다.",
    href: "/pricing",
    icon: ClipboardPaste,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4 border-b pb-8">
          <p className="text-sm font-medium text-muted-foreground">PC 견적 빌드업 MVP</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                내 조건과 가격 데이터를 기준으로 PC 견적을 단계별로 구성합니다.
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                현재 PC, 게임, 작업 환경, 모니터 조건과 보유 카드를 입력하면 사양 판독부터
                부품 후보 선택, 최종 견적 출력까지 이어지는 앱입니다.
              </p>
            </div>
            <Button asChild size="lg" className="w-full sm:w-fit">
              <Link href="/cards">
                내 조건으로 견적 만들기
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group rounded-lg border bg-card p-5 text-card-foreground transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-4">
                  <span className="rounded-md border bg-background p-2 text-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="space-y-2">
                    <span className="block font-medium">{action.title}</span>
                    <span className="block text-sm leading-6 text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <section className="rounded-lg border bg-muted/30 p-5">
          <h2 className="text-sm font-medium">MVP 단계</h2>
          <ol className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-3">
            {appRoutes.slice(1).map((route, index) => (
              <li key={route.href} className="flex gap-3">
                <span className="font-mono text-xs text-foreground">{String(index + 1).padStart(2, "0")}</span>
                <Link href={route.href} className="hover:text-foreground">
                  {route.label}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </section>
    </main>
  );
}
