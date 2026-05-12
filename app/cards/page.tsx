import { PageShell } from "@/components/layout/page-shell";
import { CardSelectionForm } from "@/components/forms/card-selection-form";

export default function CardsPage() {
  return (
    <PageShell
      eyebrow="1단계"
      title="보유 카드 선택"
      description="MVP에서는 카드사명 기준으로 혜택가를 단순 매칭합니다."
      nextHref="/spec"
      nextLabel="현재 사양 입력으로 이동"
    >
      <CardSelectionForm />
    </PageShell>
  );
}
