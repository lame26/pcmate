import { CheckCircle2, ChevronDown, CircleAlert, ShieldCheck, XCircle } from "lucide-react";

import {
  compatibilitySeverityLabel,
  compatibilitySourceLabel,
  compatibilityStatusLabel,
  createCompatibilityCheckRows,
  type CompatibilityCheckRow,
  type CompatibilityDisplayStatus,
} from "@/lib/compatibility/display";
import type { CompatibilityResult, SelectedParts } from "@/lib/compatibility/types";
import { cn } from "@/lib/utils";

type CompatibilityDetailsProps = {
  result: CompatibilityResult;
  selectedParts: SelectedParts;
  title?: string;
  defaultOpen?: boolean;
  compact?: boolean;
};

export function CompatibilityDetails({
  result,
  selectedParts,
  title = "호환성 상세",
  defaultOpen = false,
  compact = false,
}: CompatibilityDetailsProps) {
  const rows = createCompatibilityCheckRows(result, selectedParts);
  const visibleRows = compact ? rows.filter((row) => row.status !== "compatible") : rows;

  return (
    <section className={cn("rounded-md border bg-background text-foreground", compact ? "p-3" : "p-4")}>
      <details open={defaultOpen} className="group/details">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusIcon status={result.status} />
              <h3 className={cn("font-semibold", compact ? "text-sm" : "text-base")}>{title}</h3>
              <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", statusClassName(result.status))}>
                {compatibilityStatusLabel(result.status)}
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {getResultMessage(result)}
            </p>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <SummaryBadge tone="blocked" label={`차단 ${result.summary.critical}건`} />
              <SummaryBadge tone="needs-check" label={`구매 전 확인 ${result.summary.needsCheck}건`} />
              {compact ? <SummaryBadge tone="muted" label="통과 항목은 접힌 상세에서 생략" /> : null}
            </div>
          </div>
          <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-open/details:rotate-180" aria-hidden="true" />
        </summary>

        <div className="mt-4 grid gap-3">
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <PolicyBadge label="추천" allowed={result.canRecommend} blockedText="추천 제외" />
            <PolicyBadge label="구매" allowed={result.canPurchase} blockedText="구매 전 확인" />
            <PolicyBadge label="복사/저장" allowed={result.canExport} blockedText="내보내기 제한" />
          </div>

          {visibleRows.length ? (
            <div className="grid gap-2">
              {visibleRows.map((row) => (
                <CompatibilityRowView key={row.id} row={row} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed bg-muted/20 p-3 text-sm leading-6 text-muted-foreground">
              {rows.length
                ? "차단 또는 구매 전 확인이 필요한 항목은 없습니다. 통과 항목은 후보 카드 compact 상세에서 생략했습니다."
                : "아직 표시할 조합이 없습니다. 부품을 선택하면 행 단위로 확인합니다."}
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

function SummaryBadge({ tone, label }: { tone: "blocked" | "needs-check" | "muted"; label: string }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 font-medium",
        tone === "blocked" ? "bg-red-100 text-red-950" : "",
        tone === "needs-check" ? "bg-amber-100 text-amber-950" : "",
        tone === "muted" ? "bg-muted text-muted-foreground" : ""
      )}
    >
      {label}
    </span>
  );
}

function CompatibilityRowView({ row }: { row: CompatibilityCheckRow }) {
  return (
    <article className={cn("grid gap-3 rounded-md border p-3", rowClassName(row.status))}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusIcon status={row.status} />
            <h4 className="text-sm font-semibold">{row.label}</h4>
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", statusClassName(row.status))}>
              {compatibilityStatusLabel(row.status)}
            </span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">{row.description}</p>
        </div>
        {row.partNames.length ? (
          <p className="max-w-xl text-xs leading-5 text-muted-foreground sm:text-right">{row.partNames.join(" + ")}</p>
        ) : null}
      </div>

      <p className="text-sm leading-6">{row.message}</p>

      {row.issues.length ? (
        <div className="grid gap-2">
          {row.issues.map((issue) => (
            <div key={`${row.id}-${issue.code}`} className="grid gap-2 rounded-md border bg-background/70 p-3">
              <div className="flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-md border px-2 py-0.5">{issue.code}</span>
                <span className="rounded-md border px-2 py-0.5">{compatibilitySeverityLabel(issue.severity)}</span>
                <span className="rounded-md border px-2 py-0.5">{compatibilityStatusLabel(issue.status)}</span>
              </div>
              <p className="text-sm leading-6">{issue.message}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                확인할 항목: {issue.userAction}
              </p>
              {issue.evidence.length ? (
                <dl className="grid gap-1 text-xs leading-5 text-muted-foreground">
                  {issue.evidence.map((item, index) => (
                    <div key={`${issue.code}-${item.field}-${index}`} className="grid gap-1 rounded-md bg-muted/30 px-2 py-1 sm:grid-cols-[130px_1fr]">
                      <dt>{compatibilitySourceLabel(item.source)} · {item.field}</dt>
                      <dd>
                        {formatEvidenceValue(item.value)} · 신뢰도 {confidenceLabel(item.confidence)}
                        {item.note ? ` · ${item.note}` : ""}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function PolicyBadge({ label, allowed, blockedText }: { label: string; allowed: boolean; blockedText: string }) {
  return (
    <div className={cn("rounded-md border px-2 py-1.5", allowed ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950")}>
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-2 font-medium">{allowed ? "가능" : blockedText}</span>
    </div>
  );
}

function StatusIcon({ status }: { status: CompatibilityDisplayStatus }) {
  if (status === "blocked") return <XCircle className="size-4 text-red-600" aria-hidden="true" />;
  if (status === "needs-check") return <CircleAlert className="size-4 text-amber-600" aria-hidden="true" />;
  if (status === "compatible") return <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />;
  return <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />;
}

function getResultMessage(result: CompatibilityResult) {
  if (result.status === "blocked") {
    return `차단 ${result.summary.critical}건이 있어 추천 또는 구매 흐름에서 제한됩니다. 구매 전 막힌 조합을 먼저 해결해야 합니다.`;
  }

  if (result.status === "needs-check") {
    return `구매 전 확인 ${result.summary.needsCheck}건이 남아 있습니다. 펼치면 이유와 확인할 항목을 볼 수 있습니다.`;
  }

  return "현재 입력된 스펙 데이터 기준으로 알려진 blocker는 없습니다. 실제 구매 전 판매 페이지의 최신 스펙은 다시 확인하세요.";
}

function statusClassName(status: CompatibilityDisplayStatus) {
  if (status === "blocked") return "bg-red-100 text-red-950";
  if (status === "needs-check") return "bg-amber-100 text-amber-950";
  if (status === "compatible") return "bg-emerald-100 text-emerald-950";
  return "bg-muted text-muted-foreground";
}

function rowClassName(status: CompatibilityDisplayStatus) {
  if (status === "blocked") return "border-red-200 bg-red-50/60";
  if (status === "needs-check") return "border-amber-200 bg-amber-50/60";
  if (status === "compatible") return "border-emerald-200 bg-emerald-50/50";
  return "border-dashed bg-muted/20";
}

function formatEvidenceValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "없음";
  if (value === undefined || value === null || value === "") return "확인 불가";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  return String(value);
}

function confidenceLabel(confidence: "low" | "medium" | "high") {
  if (confidence === "high") return "높음";
  if (confidence === "medium") return "보통";
  return "낮음";
}
