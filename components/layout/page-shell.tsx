import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { appRoutes } from "@/lib/routes";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  previousHref?: string;
  nextHref?: string;
  nextLabel?: string;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
  previousHref,
  nextHref,
  nextLabel = "다음 단계로 이동",
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
        <nav aria-label="MVP 단계" className="flex flex-wrap gap-2 text-sm">
          {appRoutes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className="rounded-md border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {route.label}
            </Link>
          ))}
        </nav>

        <section className="rounded-lg border bg-card p-6 text-card-foreground">
          <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
          <div className="mt-4 max-w-3xl space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="text-base leading-7 text-muted-foreground">{description}</p>
          </div>
          {children ? (
            <div className="mt-8">{children}</div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed bg-muted/30 p-5 text-sm leading-6 text-muted-foreground">
              이 화면은 스캐폴딩 단계의 placeholder입니다. UI 담당자 결정과 기능 구현 단계에서
              실제 입력, 상태, 검증, 빈 데이터, 오류 상태를 채웁니다.
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {previousHref ? (
            <Button asChild variant="outline" className="w-full sm:w-fit">
              <Link href={previousHref}>
                <ArrowLeft />
                이전 단계
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {nextHref ? (
            <Button asChild className="w-full sm:w-fit">
              <Link href={nextHref}>
                {nextLabel}
                <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
