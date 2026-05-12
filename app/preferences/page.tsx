import { PageShell } from "@/components/layout/page-shell";
import { PreferencesForm } from "@/components/forms/preferences-form";

export default function PreferencesPage() {
  return (
    <PageShell
      eyebrow="5단계"
      title="예산과 물리적 선호도"
      description="예산은 선택 입력이며 색상, 쿨링, RGB, 케이스 크기, 재사용 부품 조건을 저장합니다."
      previousHref="/usage"
      nextHref="/diagnosis"
      nextLabel="사양 판독 보기"
    >
      <PreferencesForm />
    </PageShell>
  );
}
