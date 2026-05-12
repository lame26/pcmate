import { PageShell } from "@/components/layout/page-shell";
import { UsageForm } from "@/components/forms/usage-form";

export default function UsagePage() {
  return (
    <PageShell
      eyebrow="4단계"
      title="작업과 멀티태스킹 조건"
      description="동시에 켜는 앱, 개발/작업 도구, 방송과 로컬 AI 사용 여부를 입력합니다."
      previousHref="/games"
      nextHref="/preferences"
      nextLabel="예산과 선호도 입력으로 이동"
    >
      <UsageForm />
    </PageShell>
  );
}
