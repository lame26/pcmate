import { PageShell } from "@/components/layout/page-shell";
import { PricingForm } from "@/components/pricing/pricing-form";

export default function PricingPage() {
  return (
    <PageShell
      eyebrow="7단계"
      title="자동 가격 수집과 보완"
      description="추천 후보의 다나와 가격을 자동으로 불러오고, 누락되거나 카드 조건이 필요한 가격만 붙여넣기와 수동 입력으로 보완합니다."
      previousHref="/diagnosis"
      nextHref="/builder"
      nextLabel="단계별 빌더로 이동"
    >
      <PricingForm />
    </PageShell>
  );
}
