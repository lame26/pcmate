import { PageShell } from "@/components/layout/page-shell";
import { SpecForm } from "@/components/forms/spec-form";

export default function SpecPage() {
  return (
    <PageShell
      eyebrow="2단계"
      title="현재 PC 사양 입력"
      description="수동 입력과 PowerShell JSON/텍스트 붙여넣기 파싱을 준비하는 화면입니다."
      previousHref="/cards"
      nextHref="/games"
      nextLabel="게임 선택으로 이동"
    >
      <SpecForm />
    </PageShell>
  );
}
