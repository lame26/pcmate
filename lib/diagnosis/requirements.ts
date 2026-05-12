import { games } from "@/data/games";
import type { BuildWarning } from "@/types/build";
import type { RequirementProfile } from "@/types/diagnosis";
import type { CurrentPcSpec } from "@/types/spec";
import type { DemandTier, SelectedGame, UsageProfile } from "@/types/games";

type DiagnosisInput = {
  currentSpec: CurrentPcSpec;
  usage: UsageProfile;
};

const demandTierScore: Record<DemandTier, number> = {
  veryLow: 2,
  low: 3,
  medium: 5,
  high: 7,
  veryHigh: 8.5,
  extreme: 10,
};

const frequencyBoost: Record<SelectedGame["frequency"], number> = {
  rare: -0.4,
  normal: 0,
  often: 0.4,
  main: 0.8,
};

const optionBoost: Record<SelectedGame["optionTarget"], number> = {
  low: -1,
  medium: 0,
  high: 0.5,
  ultra: 1,
};

export function calculateRequirementProfile({ currentSpec, usage }: DiagnosisInput): RequirementProfile {
  const reasons: string[] = [];
  const warnings: BuildWarning[] = [];
  const selectedGames = usage.selectedGames
    .map((selected) => {
      const game = games.find((item) => item.id === selected.gameId);
      return game ? { game, selected } : undefined;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  let cpuTier = 4;
  let gpuTier = 4;
  let ramGb = 16;
  let vramGb = 6;

  if (selectedGames.length) {
    const heaviest = selectedGames
      .map(({ game, selected }) => {
        const base = demandTierScore[game.demandTier];
        const playBoost = frequencyBoost[selected.frequency];
        const qualityBoost = optionBoost[selected.optionTarget];

        return {
          game,
          selected,
          cpuTier: base + playBoost + qualityBoost * 0.35 + (game.cpuSensitivity - 3) * 0.35,
          gpuTier: base + playBoost + qualityBoost + (game.gpuSensitivity - 3) * 0.25,
        };
      })
      .sort((left, right) => Math.max(right.cpuTier, right.gpuTier) - Math.max(left.cpuTier, left.gpuTier))[0];

    cpuTier = Math.max(cpuTier, heaviest.cpuTier);
    gpuTier = Math.max(gpuTier, heaviest.gpuTier);
    ramGb = Math.max(ramGb, ...selectedGames.map(({ game }) => game.ramRecommendedGb));
    vramGb = Math.max(vramGb, ...selectedGames.map(({ game }) => game.vramRecommendedGb));
    reasons.push(
      `${heaviest.game.name} 기준 요구도가 가장 높아 CPU/GPU 티어 산정의 기준으로 사용했습니다.`
    );

    selectedGames
      .filter(({ game }) => game.demandType === "estimated")
      .forEach(({ game }) => {
        warnings.push(
          createWarning(
            "GAME_REQUIREMENT_ESTIMATED",
            `${game.name} 요구 사양은 예상치라 실제 출시/패치 후 달라질 수 있습니다.`
          )
        );
      });
  } else {
    reasons.push("선택한 게임이 없어 일반 FHD/QHD 사용 기준의 기본 티어에서 시작했습니다.");
  }

  const primaryMonitor = usage.monitors[0] ?? currentSpec.monitors?.[0];
  if (primaryMonitor) {
    const resolutionBoost = { FHD: 0, QHD: 1, UWQHD: 1.5, "4K": 2 }[primaryMonitor.resolution];
    const refreshBoost = { "60-75": 0, "100-120": 0.5, "144-180": 1, "240-plus": 1.5 }[
      primaryMonitor.refreshRateTier
    ];

    gpuTier += resolutionBoost + refreshBoost * 0.8;
    if (primaryMonitor.refreshRateTier === "240-plus") cpuTier += 1;
    else cpuTier += refreshBoost * 0.35;

    if (resolutionBoost || refreshBoost) {
      reasons.push(
        `${primaryMonitor.resolution} ${labelRefresh(primaryMonitor.refreshRateTier)} 모니터 조건을 GPU 요구치에 반영했습니다.`
      );
    }
  }

  if (usage.usesVr || selectedGames.some(({ game }) => game.vrGame)) {
    gpuTier += 1;
    vramGb = Math.max(vramGb, 12);
    reasons.push("VR 사용 조건 때문에 GPU 티어와 VRAM 권장치를 한 단계 보수적으로 잡았습니다.");
    warnings.push(createWarning("VR_STABILITY_MARGIN", "VR은 평균 FPS보다 프레임 안정성이 중요해 여유 사양을 권장합니다."));
  }

  const multitasking = usage.multitasking;
  if (multitasking.browserTabs === "over-20") {
    ramGb = Math.max(ramGb, 32);
    reasons.push("브라우저 탭 20개 이상 조건으로 RAM 32GB 이상을 권장합니다.");
  }
  if (multitasking.browserTabs === "over-50") {
    ramGb = Math.max(ramGb, 64);
    reasons.push("브라우저 탭 50개 이상 조건으로 RAM 64GB급을 권장합니다.");
  }

  if (hasAny(multitasking.workApps, ["docker", "wsl", "premiere", "blender"])) {
    cpuTier += 0.8;
    ramGb = Math.max(ramGb, 32);
    reasons.push("개발/제작 앱 동시 사용 조건으로 CPU와 RAM 요구치를 올렸습니다.");
  }

  if (hasAny(multitasking.workApps, ["local-ai"]) || multitasking.usesLocalAi) {
    gpuTier += 1;
    ramGb = Math.max(ramGb, 64);
    vramGb = Math.max(vramGb, 16);
    reasons.push("로컬 AI 작업 조건으로 64GB RAM과 16GB 이상 VRAM을 권장합니다.");
  }

  if (
    multitasking.concurrentApps.includes("obs-streaming") ||
    multitasking.concurrentApps.includes("obs-recording") ||
    multitasking.usesObsStreaming ||
    multitasking.usesObsRecording ||
    usage.usesCaptureCard
  ) {
    cpuTier += 0.5;
    reasons.push("녹화/방송 또는 캡처보드 조건으로 CPU 여유를 추가했습니다.");
  }

  if (currentSpec.ram?.totalGb && currentSpec.ram.totalGb < ramGb) {
    warnings.push(createWarning("CURRENT_RAM_BELOW_REQUIREMENT", `현재 RAM ${currentSpec.ram.totalGb}GB는 권장 ${ramGb}GB보다 낮습니다.`));
  }

  const allowsTopGpuTier =
    selectedGames.some(({ game }) => game.demandTier === "veryHigh" || game.demandTier === "extreme") ||
    primaryMonitor?.resolution === "4K" ||
    primaryMonitor?.refreshRateTier === "240-plus" ||
    usage.usesVr ||
    selectedGames.some(({ game }) => game.vrGame) ||
    hasAny(multitasking.workApps, ["local-ai"]) ||
    multitasking.usesLocalAi;
  const normalizedCpuTier = clampTier(cpuTier);
  const normalizedGpuTier = clampTier(gpuTier, allowsTopGpuTier ? 10 : 9);
  const normalizedVramGb = normalizeVram(vramGb);
  const normalizedRamGb = normalizeRam(ramGb);
  const psuWattage = estimatePsuWattage(normalizedCpuTier, normalizedGpuTier);

  reasons.push(`예상 시스템 소비전력을 기준으로 ${psuWattage}W급 파워를 우선 후보로 잡습니다.`);

  return {
    cpuTier: normalizedCpuTier,
    gpuTier: normalizedGpuTier,
    ramGb: normalizedRamGb,
    vramGb: normalizedVramGb,
    psuWattage,
    reasons: unique(reasons),
    warnings: uniqueWarnings(warnings),
  };
}

function estimatePsuWattage(cpuTier: number, gpuTier: number) {
  const estimatedWattage = 120 + cpuTier * 18 + gpuTier * 38;
  const withMargin = estimatedWattage * 1.3;

  if (withMargin <= 500) return 550;
  if (withMargin <= 620) return 650;
  if (withMargin <= 740) return 750;
  if (withMargin <= 850) return 850;
  return 1000;
}

function normalizeRam(value: number): RequirementProfile["ramGb"] {
  if (value > 32) return 64;
  if (value > 16) return 32;
  return 16;
}

function normalizeVram(value: number): RequirementProfile["vramGb"] {
  if (value > 16) return 24;
  if (value > 12) return 16;
  if (value > 8) return 12;
  if (value > 6) return 8;
  return 6;
}

function clampTier(value: number, max = 10) {
  return Math.max(1, Math.min(max, Math.round(value)));
}

function hasAny(values: string[], targets: string[]) {
  return targets.some((target) => values.includes(target));
}

function createWarning(code: string, message: string): BuildWarning {
  return {
    id: `diagnosis-${code.toLowerCase()}`,
    severity: "warning",
    code,
    message,
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function uniqueWarnings(warnings: BuildWarning[]) {
  return Array.from(new Map(warnings.map((warning) => [warning.code + warning.message, warning])).values());
}

function labelRefresh(refreshRateTier: string) {
  if (refreshRateTier === "60-75") return "60~75Hz";
  if (refreshRateTier === "100-120") return "100~120Hz";
  if (refreshRateTier === "144-180") return "144~180Hz";
  return "240Hz 이상";
}
