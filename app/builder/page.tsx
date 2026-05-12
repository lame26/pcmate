import { PageShell } from "@/components/layout/page-shell";
import { BuilderFlow } from "@/components/builder/builder-flow";

export default function BuilderPage() {
  return (
    <PageShell
      eyebrow="8단계"
      title="단계별 부품 빌더"
      description="CPU부터 케이스까지 절약형, 추천형, 상급형 후보를 비교하고 선택합니다."
      previousHref="/pricing"
    >
      <BuilderFlow />
    </PageShell>
  );
}
