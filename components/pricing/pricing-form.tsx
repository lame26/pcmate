"use client";

import { useState } from "react";
import { ClipboardList, LinkIcon, Plus, Trash2 } from "lucide-react";

import { cardProviders } from "@/data/cards";
import { createManualPriceSnapshot, parseDanawaPaste } from "@/lib/pricing/danawa-parser";
import { useBuildStore } from "@/stores/build-store";
import type { PartCategory } from "@/types/parts";
import type { PriceSnapshot } from "@/types/pricing";
import { Button } from "@/components/ui/button";
import { Field, inputClassName, selectClassName } from "@/components/forms/field";

type DanawaPriceResponse = {
  snapshot: PriceSnapshot;
  fromCache: boolean;
  cacheExpiresAt?: string;
  warnings: string[];
};

const textareaClassName =
  "min-h-36 resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

const categories: { value: PartCategory; label: string }[] = [
  { value: "cpu", label: "CPU" },
  { value: "cooler", label: "쿨러" },
  { value: "motherboard", label: "메인보드" },
  { value: "ram", label: "RAM" },
  { value: "gpu", label: "GPU" },
  { value: "ssd", label: "SSD" },
  { value: "psu", label: "파워" },
  { value: "case", label: "케이스" },
];

export function PricingForm() {
  const priceSnapshots = useBuildStore((state) => state.priceSnapshots);
  const upsertPriceSnapshot = useBuildStore((state) => state.upsertPriceSnapshot);
  const removePriceSnapshot = useBuildStore((state) => state.removePriceSnapshot);

  const [category, setCategory] = useState<PartCategory>("gpu");
  const [pasteText, setPasteText] = useState("");
  const [pcodeInput, setPcodeInput] = useState("");
  const [isCheckingPcode, setIsCheckingPcode] = useState(false);
  const [isLoadingCategoryRank, setIsLoadingCategoryRank] = useState(false);
  const [manualInput, setManualInput] = useState({
    productName: "",
    basePrice: "",
    benefitPrice: "",
    mall: "",
    cardProviderId: "",
    shippingFee: "",
    url: "",
  });

  function handleParsePaste() {
    const snapshot = parseDanawaPaste(pasteText, category);
    upsertPriceSnapshot(snapshot);
  }

  function handleAddManual() {
    const snapshot = createManualPriceSnapshot({
      productName: manualInput.productName,
      basePrice: Number(manualInput.basePrice.replace(/,/g, "")) || 0,
      benefitPrice: Number(manualInput.benefitPrice.replace(/,/g, "")) || undefined,
      mall: manualInput.mall,
      cardProviderId: manualInput.cardProviderId || undefined,
      shippingFee: manualInput.shippingFee ? Number(manualInput.shippingFee.replace(/,/g, "")) : undefined,
      url: manualInput.url || undefined,
      category,
    });

    upsertPriceSnapshot(snapshot);
  }

  async function handlePcodeCheck() {
    setIsCheckingPcode(true);

    try {
      const response = await fetch("/api/prices/danawa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pcode: looksLikePcodeInput(pcodeInput) ? pcodeInput : undefined,
          searchQuery: looksLikePcodeInput(pcodeInput) ? undefined : pcodeInput,
          category,
        }),
      });
      const result = (await response.json()) as DanawaPriceResponse;
      upsertPriceSnapshot(result.snapshot);
    } finally {
      setIsCheckingPcode(false);
    }
  }

  async function handleLoadCategoryRank() {
    setIsLoadingCategoryRank(true);

    try {
      const response = await fetch("/api/prices/danawa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, limit: 30 }),
      });
      const result = (await response.json()) as DanawaPriceResponse;
      upsertPriceSnapshot(result.snapshot);
    } finally {
      setIsLoadingCategoryRank(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <Field label="부품 카테고리">
          <select className={selectClassName} value={category} onChange={(event) => setCategory(event.target.value as PartCategory)}>
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="rounded-md border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
          자동 수집은 다나와 주요부품 카테고리의 인기 순위 30위 스냅샷을 15분 동안 재사용합니다.
          누락 상품, 배송비, 상세 카드 혜택가는 붙여넣기/수동 입력으로 보완합니다.
          <div className="mt-3">
            <Button type="button" variant="secondary" onClick={handleLoadCategoryRank} disabled={isLoadingCategoryRank}>
              <ClipboardList data-icon="inline-start" />
              {isLoadingCategoryRank ? "30위 스냅샷 불러오는 중" : "이 카테고리 30위 스냅샷 불러오기"}
            </Button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 rounded-md border bg-background p-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold">다나와 텍스트 붙여넣기</h2>
        </div>
        <Field label="상품/가격 텍스트">
          <textarea
            className={textareaClassName}
            value={pasteText}
            placeholder="상품명, 일반가, 카드 혜택가, 쇼핑몰, 배송비가 보이는 다나와 영역을 복사해 붙여넣으세요."
            onChange={(event) => setPasteText(event.target.value)}
          />
        </Field>
        <div className="flex justify-end">
          <Button type="button" onClick={handleParsePaste} disabled={!pasteText.trim()}>
            <Plus data-icon="inline-start" />
            붙여넣기 파싱
          </Button>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border bg-background p-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold">랭킹 30위 내 URL 또는 pcode 입력</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <Field label="다나와 URL, pcode, 상품명">
            <input
              className={inputClassName}
              value={pcodeInput}
              placeholder="예: RTX 5060 또는 https://prod.danawa.com/info/?pcode=12345678"
              onChange={(event) => setPcodeInput(event.target.value)}
            />
          </Field>
          <Button type="button" onClick={handlePcodeCheck} disabled={isCheckingPcode || !pcodeInput.trim()} className="h-10">
            {isCheckingPcode ? "확인 중" : "스냅샷 만들기"}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border bg-background p-4">
        <h2 className="text-base font-semibold">수동 가격 입력</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="상품명">
            <input
              className={inputClassName}
              value={manualInput.productName}
              onChange={(event) => setManualInput({ ...manualInput, productName: event.target.value })}
            />
          </Field>
          <Field label="쇼핑몰">
            <input
              className={inputClassName}
              value={manualInput.mall}
              onChange={(event) => setManualInput({ ...manualInput, mall: event.target.value })}
            />
          </Field>
          <Field label="일반 가격">
            <input
              className={inputClassName}
              inputMode="numeric"
              value={manualInput.basePrice}
              onChange={(event) => setManualInput({ ...manualInput, basePrice: event.target.value })}
            />
          </Field>
          <Field label="혜택 가격">
            <input
              className={inputClassName}
              inputMode="numeric"
              value={manualInput.benefitPrice}
              onChange={(event) => setManualInput({ ...manualInput, benefitPrice: event.target.value })}
            />
          </Field>
          <Field label="카드사">
            <select
              className={selectClassName}
              value={manualInput.cardProviderId}
              onChange={(event) => setManualInput({ ...manualInput, cardProviderId: event.target.value })}
            >
              <option value="">카드 조건 없음</option>
              {cardProviders
                .filter((provider) => provider.type === "card")
                .map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="배송비">
            <input
              className={inputClassName}
              inputMode="numeric"
              value={manualInput.shippingFee}
              placeholder="무료배송이면 0"
              onChange={(event) => setManualInput({ ...manualInput, shippingFee: event.target.value })}
            />
          </Field>
          <Field label="URL">
            <input
              className={inputClassName}
              value={manualInput.url}
              onChange={(event) => setManualInput({ ...manualInput, url: event.target.value })}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={handleAddManual} disabled={!manualInput.productName.trim() || !manualInput.basePrice.trim()}>
            <Plus data-icon="inline-start" />
            수동 가격 추가
          </Button>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-base font-semibold">저장된 가격 스냅샷</h2>
        {priceSnapshots.length ? (
          <div className="grid gap-3">
            {priceSnapshots.map((snapshot) => (
              <div key={snapshot.id} className="rounded-md border bg-background p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{snapshot.searchQuery ?? snapshot.pcode ?? "가격 스냅샷"}</span>
                      <span className="rounded-md border px-2 py-0.5 text-xs uppercase text-muted-foreground">
                        {snapshot.confidence}
                      </span>
                      {snapshot.category ? (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {snapshot.category}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {snapshot.offers.length}개 offer · {new Date(snapshot.updatedAt).toLocaleString("ko-KR")}
                    </p>
                    {snapshot.offers[0] ? (
                      <p className="text-sm">
                        {snapshot.offers[0].mall} · 일반가 {formatKrw(snapshot.offers[0].basePrice)}
                        {snapshot.offers[0].benefitPrice ? ` · 혜택가 ${formatKrw(snapshot.offers[0].benefitPrice)}` : ""}
                      </p>
                    ) : null}
                    {snapshot.warnings.length ? (
                      <ul className="grid gap-1 text-sm text-muted-foreground">
                        {snapshot.warnings.map((warning) => (
                          <li key={warning}>- {warning}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => removePriceSnapshot(snapshot.id)} aria-label="가격 스냅샷 삭제">
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed bg-muted/20 p-5 text-sm leading-6 text-muted-foreground">
            아직 저장된 가격 스냅샷이 없습니다. 붙여넣기 또는 수동 입력으로 후보 가격을 먼저 추가하세요.
          </div>
        )}
      </section>
    </div>
  );
}

function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function looksLikePcodeInput(value: string) {
  return /\bpcode\s*[:=]?\s*\d{5,}\b/i.test(value) || /prod\.danawa\.com/i.test(value) || /^\d{5,}$/.test(value.trim());
}
