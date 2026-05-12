import type { Build } from "@/types/build";

const NOW = "2026-05-12T00:00:00.000Z";

export const sampleBuilds: Build[] = [
  {
    id: "sample-build-8700k-gtx1080",
    profile: {
      id: "sample-profile-1",
      buildMode: "full-build",
      budget: {
        totalKrw: 2500000,
        flexible: true,
      },
      selectedCardProviderIds: ["samsung"],
      selectedMembershipIds: ["naver-pay"],
      createdAt: NOW,
      updatedAt: NOW,
    },
    currentSpec: {
      cpu: "Intel Core i7-8700K",
      gpu: "NVIDIA GeForce GTX 1080",
      ram: {
        totalGb: 16,
        type: "DDR4",
      },
      motherboard: "Z370 class motherboard",
      storage: [
        {
          name: "기존 SSD",
          sizeGb: 1000,
          mediaType: "SATA_SSD",
        },
      ],
      psu: {
        name: "기존 파워",
        wattage: 650,
        ageYears: 6,
      },
      monitors: [
        {
          resolution: "FHD",
          refreshRateTier: "144-180",
          count: 2,
        },
      ],
      vrDevice: "Meta Quest 3",
      reusablePartIds: ["ssd"],
      parseConfidence: "medium",
      warnings: [],
    },
    usage: {
      selectedGames: [
        { gameId: "league-of-legends", frequency: "rare", optionTarget: "high" },
        { gameId: "pubg", frequency: "often", optionTarget: "high" },
        { gameId: "black-desert", frequency: "often", optionTarget: "high" },
        { gameId: "crimson-desert", frequency: "main", optionTarget: "high" },
      ],
      customRequirements: [],
      multitasking: {
        browserTabs: "over-20",
        concurrentApps: ["youtube", "kakaotalk", "discord"],
        workApps: ["vscode", "codex"],
        usesObsRecording: false,
        usesObsStreaming: false,
        usesLocalAi: false,
      },
      monitors: [
        {
          resolution: "FHD",
          refreshRateTier: "144-180",
          count: 2,
        },
      ],
      usesVr: true,
      usesCaptureCard: false,
      preferences: {
        color: "black",
        cooling: "liquid",
        rgb: "avoid",
        caseSize: "mid",
        noise: "quiet",
        gpuVendor: "nvidia",
        reuse: {
          ssd: true,
          case: false,
          psu: false,
        },
      },
    },
    requirement: {
      cpuTier: 8,
      gpuTier: 8,
      ramGb: 32,
      vramGb: 12,
      psuWattage: 850,
      reasons: [
        "검은사막, 붉은사막 관심, VR 사용 조건을 기준으로 QHD급 여유를 둔 요구치입니다.",
        "개발 도구와 브라우저 동시 사용을 고려해 RAM 32GB를 권장합니다.",
      ],
      warnings: [
        {
          id: "sample-warning-estimated-game",
          severity: "warning",
          code: "GAME_REQUIREMENT_ESTIMATED",
          message: "붉은사막은 예상 데이터이므로 출시 후 요구치 재확인이 필요합니다.",
        },
      ],
    },
    selectedParts: {},
    pricingSummary: {
      baseTotal: 0,
      benefitTotal: 0,
      shippingTotal: 0,
      discountTotal: 0,
      byCardProvider: [],
    },
    warnings: [],
    createdAt: NOW,
    updatedAt: NOW,
  },
];
