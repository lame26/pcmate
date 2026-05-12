import { PageShell } from "@/components/layout/page-shell";
import { GamesForm } from "@/components/forms/games-form";

export default function GamesPage() {
  return (
    <PageShell
      eyebrow="3단계"
      title="게임과 목표 옵션 선택"
      description="게임별 빈도와 목표 옵션을 입력하고, 미출시/추정 데이터는 별도 표시합니다."
      previousHref="/spec"
      nextHref="/usage"
      nextLabel="작업 환경 선택으로 이동"
    >
      <GamesForm />
    </PageShell>
  );
}
