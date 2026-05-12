import { PageShell } from "@/components/layout/page-shell";
import { SummaryView } from "@/components/summary/summary-view";

export default function SummaryPage() {
  return (
    <PageShell
      eyebrow="9단계"
      title="최종 견적"
      description="일반가, 혜택가, 배송비, 절감액, 카드별 요약과 주의사항을 출력합니다."
      previousHref="/builder"
      nextHref="/"
      nextLabel="홈으로 이동"
    >
      <SummaryView />
    </PageShell>
  );
}
