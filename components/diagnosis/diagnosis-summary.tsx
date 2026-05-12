"use client";

import { AlertTriangle, Cpu, MemoryStick, Monitor, Zap } from "lucide-react";

import { calculateRequirementProfile } from "@/lib/diagnosis/requirements";
import { useBuildStore } from "@/stores/build-store";

const metricCopy = {
  cpuTier: {
    label: "CPU 요구 티어",
    description: "게임 프레임 안정성과 작업 앱 동시 실행을 반영합니다.",
    icon: Cpu,
  },
  gpuTier: {
    label: "GPU 요구 티어",
    description: "해상도, 주사율, VR, 목표 옵션의 영향을 크게 받습니다.",
    icon: Monitor,
  },
  ramGb: {
    label: "RAM 권장",
    description: "게임 요구치와 브라우저/작업 앱 동시 실행 기준입니다.",
    icon: MemoryStick,
  },
  psuWattage: {
    label: "파워 권장",
    description: "예상 소비전력에 여유율을 붙인 MVP 기준입니다.",
    icon: Zap,
  },
};

export function DiagnosisSummary() {
  const currentSpec = useBuildStore((state) => state.currentSpec);
  const usage = useBuildStore((state) => state.usage);
  const requirement = calculateRequirementProfile({ currentSpec, usage });

  const metrics = [
    { key: "cpuTier" as const, value: `${requirement.cpuTier} / 10` },
    { key: "gpuTier" as const, value: `${requirement.gpuTier} / 10` },
    { key: "ramGb" as const, value: `${requirement.ramGb}GB` },
    { key: "psuWattage" as const, value: `${requirement.psuWattage}W` },
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 md:grid-cols-4">
        {metrics.map((metric) => {
          const copy = metricCopy[metric.key];
          const Icon = copy.icon;

          return (
            <div key={metric.key} className="rounded-md border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">{copy.label}</span>
                <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{metric.value}</p>
              <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">{copy.description}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-md border bg-background p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">판독 근거</h2>
            <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">
              VRAM {requirement.vramGb}GB 이상 권장
            </span>
          </div>
          <ul className="mt-4 grid gap-3">
            {requirement.reasons.map((reason) => (
              <li key={reason} className="flex gap-3 text-sm leading-6">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" aria-hidden="true" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border bg-background p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-base font-semibold">주의사항</h2>
          </div>
          {requirement.warnings.length ? (
            <ul className="mt-4 grid gap-3">
              {requirement.warnings.map((warning) => (
                <li key={warning.id} className="rounded-md border border-dashed p-3 text-sm leading-6">
                  {warning.message}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              현재 입력 기준에서 별도 경고는 없습니다. 가격 데이터와 실제 부품 호환성은 다음 단계에서 다시 확인합니다.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
