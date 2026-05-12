import { CircleAlert } from "lucide-react";

import { createOfferPriceDisplay, formatKrw } from "@/lib/pricing/price-display";
import { cn } from "@/lib/utils";
import type { PriceOffer } from "@/types/pricing";

type PriceBreakdownProps = {
  offer?: PriceOffer;
  selectedCardProviderIds: string[];
  compact?: boolean;
  className?: string;
};

export function PriceBreakdown({ offer, selectedCardProviderIds, compact = false, className }: PriceBreakdownProps) {
  if (!offer) {
    return (
      <div className={cn("rounded-md border border-dashed bg-muted/20 p-3 text-sm leading-6 text-muted-foreground", className)}>
        가격 출처를 확인하지 못했습니다. 수동 입력 또는 다나와 가격 데이터를 추가하면 일반가와 혜택가를 분리해 표시합니다.
      </div>
    );
  }

  const price = createOfferPriceDisplay(offer, selectedCardProviderIds);

  return (
    <div className={cn("grid gap-2 rounded-md border bg-muted/20 p-3", className)}>
      <div className={cn("grid gap-2", compact ? "" : "sm:grid-cols-3")}>
        <PriceCell label="선택 가격 일반가" value={formatKrw(price.normalPrice)} helper="현재 매칭 상품의 배송비 제외 가격" />
        <PriceCell
          label={price.benefitLabel}
          value={price.benefitPrice !== undefined ? formatKrw(price.benefitPrice) : "없음"}
          helper={price.benefitNote ?? "현재 offer에는 별도 혜택가가 없습니다."}
          highlight={price.benefitStatus === "matched-card"}
          muted={price.benefitStatus !== "matched-card"}
        />
        <PriceCell
          label="배송비"
          value={price.shippingKnown ? formatKrw(price.shippingFee ?? 0) : "확인 필요"}
          helper={price.shippingKnown ? "합계에 반영됨" : "자동 가격에서 확정되지 않음"}
          muted={!price.shippingKnown}
        />
      </div>

      <div className="grid gap-1 rounded-md bg-background px-3 py-2 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground">합계 반영가</span>
          <span className="font-semibold">{formatKrw(price.selectedTotal)}</span>
        </div>
        {price.benefitTotal !== undefined && price.benefitStatus !== "matched-card" ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{price.benefitLabel} 합계</span>
            <span>{formatKrw(price.benefitTotal)}</span>
          </div>
        ) : null}
      </div>

      {price.conditionText || offer.warnings.length ? (
        <div className="grid gap-1 text-xs leading-5 text-muted-foreground">
          {price.conditionText ? <p>혜택 조건: {price.conditionText}</p> : null}
          {offer.warnings.map((warning, index) => (
            <p key={`${warning}-${index}`} className="flex gap-1.5">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>{warning}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PriceCell({
  label,
  value,
  helper,
  highlight = false,
  muted = false,
}: {
  label: string;
  value: string;
  helper: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={cn("rounded-md border bg-background p-2", highlight ? "border-emerald-300 bg-emerald-50 text-emerald-950" : "", muted ? "text-muted-foreground" : "")}>
      <p className="text-xs">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
      <p className="mt-1 text-xs leading-4">{helper}</p>
    </div>
  );
}
