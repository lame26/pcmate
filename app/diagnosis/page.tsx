import { PageShell } from "@/components/layout/page-shell";
import { DiagnosisSummary } from "@/components/diagnosis/diagnosis-summary";

export default function DiagnosisPage() {
  return (
    <PageShell
      eyebrow="6단계"
      title="사양 판독 결과"
      description="입력 조건을 바탕으로 CPU, GPU, RAM, PSU 필요도와 경고를 보여줍니다."
      previousHref="/preferences"
      nextHref="/pricing"
      nextLabel="가격 데이터 보강으로 이동"
    >
      <DiagnosisSummary />
    </PageShell>
  );
}
