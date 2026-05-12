import type { DemandTier, GameProfile } from "@/types/games";

const UPDATED_AT = "2026-05-12T00:00:00.000Z";

const tierDefaults: Record<
  DemandTier,
  Pick<GameProfile, "ramRecommendedGb" | "vramRecommendedGb" | "cpuSensitivity" | "gpuSensitivity">
> = {
  veryLow: { ramRecommendedGb: 16, vramRecommendedGb: 6, cpuSensitivity: 2, gpuSensitivity: 1 },
  low: { ramRecommendedGb: 16, vramRecommendedGb: 6, cpuSensitivity: 2, gpuSensitivity: 2 },
  medium: { ramRecommendedGb: 16, vramRecommendedGb: 8, cpuSensitivity: 3, gpuSensitivity: 3 },
  high: { ramRecommendedGb: 32, vramRecommendedGb: 12, cpuSensitivity: 3, gpuSensitivity: 4 },
  veryHigh: { ramRecommendedGb: 32, vramRecommendedGb: 16, cpuSensitivity: 4, gpuSensitivity: 5 },
  extreme: { ramRecommendedGb: 64, vramRecommendedGb: 24, cpuSensitivity: 5, gpuSensitivity: 5 },
};

function game(
  id: string,
  name: string,
  demandTier: DemandTier,
  options: Partial<GameProfile> = {}
): GameProfile {
  const defaults = tierDefaults[demandTier];

  return {
    id,
    name,
    aliases: options.aliases ?? [],
    genre: options.genre ?? [],
    demandTier,
    demandType: options.demandType ?? "official",
    cpuSensitivity: options.cpuSensitivity ?? defaults.cpuSensitivity,
    gpuSensitivity: options.gpuSensitivity ?? defaults.gpuSensitivity,
    ramRecommendedGb: options.ramRecommendedGb ?? defaults.ramRecommendedGb,
    vramRecommendedGb: options.vramRecommendedGb ?? defaults.vramRecommendedGb,
    supportsRayTracing: options.supportsRayTracing ?? false,
    vrGame: options.vrGame ?? false,
    onlineCompetitive: options.onlineCompetitive ?? false,
    notes: options.notes ?? [],
    source: options.source ?? {
      type: options.demandType === "estimated" ? "estimated" : "static",
      name: "MVP seed data",
      updatedAt: UPDATED_AT,
    },
    confidence: options.confidence ?? (options.demandType === "estimated" ? "low" : "medium"),
  };
}

export const games: GameProfile[] = [
  game("league-of-legends", "리그 오브 레전드", "veryLow", {
    aliases: ["lol", "롤"],
    genre: ["MOBA"],
    onlineCompetitive: true,
    cpuSensitivity: 2,
  }),
  game("valorant", "발로란트", "low", {
    aliases: ["valo"],
    genre: ["FPS"],
    onlineCompetitive: true,
    cpuSensitivity: 4,
  }),
  game("overwatch-2", "오버워치 2", "medium", {
    aliases: ["옵치"],
    genre: ["FPS"],
    onlineCompetitive: true,
  }),
  game("pubg", "배틀그라운드", "high", {
    aliases: ["배그", "PUBG"],
    genre: ["Battle Royale"],
    onlineCompetitive: true,
    cpuSensitivity: 4,
  }),
  game("apex-legends", "에이펙스 레전드", "medium", {
    aliases: ["apex"],
    genre: ["Battle Royale"],
    onlineCompetitive: true,
  }),
  game("fortnite", "포트나이트", "high", {
    genre: ["Battle Royale"],
    onlineCompetitive: true,
    supportsRayTracing: true,
  }),
  game("lost-ark", "로스트아크", "medium", {
    genre: ["MMORPG"],
    cpuSensitivity: 3,
  }),
  game("black-desert", "검은사막", "high", {
    aliases: ["BDO"],
    genre: ["MMORPG"],
    gpuSensitivity: 4,
  }),
  game("maplestory", "메이플스토리", "low", {
    genre: ["MMORPG"],
    cpuSensitivity: 3,
  }),
  game("dnf", "던전앤파이터", "veryLow", {
    aliases: ["던파"],
    genre: ["Action RPG"],
  }),
  game("fc-online", "FC 온라인", "low", {
    genre: ["Sports"],
    onlineCompetitive: true,
  }),
  game("starcraft-remastered", "스타크래프트 리마스터", "veryLow", {
    aliases: ["스타"],
    genre: ["RTS"],
    cpuSensitivity: 2,
  }),
  game("diablo-4", "디아블로 4", "high", {
    genre: ["Action RPG"],
    supportsRayTracing: true,
  }),
  game("palworld", "팰월드", "high", {
    genre: ["Survival"],
    ramRecommendedGb: 32,
  }),
  game("monster-hunter-wilds", "몬스터헌터 와일즈", "veryHigh", {
    aliases: ["몬헌 와일즈"],
    genre: ["Action RPG"],
    demandType: "estimated",
    notes: ["MVP에서는 예상치로 분리 표시합니다."],
  }),
  game("elden-ring", "엘든 링", "medium", {
    genre: ["Action RPG"],
  }),
  game("cyberpunk-2077", "사이버펑크 2077", "veryHigh", {
    aliases: ["사펑"],
    genre: ["RPG"],
    supportsRayTracing: true,
    vramRecommendedGb: 16,
  }),
  game("starfield", "스타필드", "high", {
    genre: ["RPG"],
    ramRecommendedGb: 32,
  }),
  game("baldurs-gate-3", "발더스 게이트 3", "medium", {
    aliases: ["BG3"],
    genre: ["RPG"],
  }),
  game("hogwarts-legacy", "호그와트 레거시", "high", {
    genre: ["RPG"],
    supportsRayTracing: true,
  }),
  game("red-dead-redemption-2", "레드 데드 리뎀션 2", "high", {
    aliases: ["RDR2"],
    genre: ["Open World"],
  }),
  game("gta-v", "GTA V", "medium", {
    genre: ["Open World"],
  }),
  game("gta-vi-ready", "GTA VI 대비", "veryHigh", {
    genre: ["Open World"],
    demandType: "estimated",
    notes: ["미출시/예상 게임으로 공식 요구사양과 분리합니다."],
  }),
  game("minecraft-shader", "마인크래프트 쉐이더", "high", {
    genre: ["Sandbox"],
    notes: ["쉐이더와 모드 구성에 따라 요구치가 크게 변합니다."],
  }),
  game("cities-skylines-2", "시티즈 스카이라인 2", "veryHigh", {
    genre: ["Simulation"],
    ramRecommendedGb: 32,
    cpuSensitivity: 4,
  }),
  game("ms-flight-simulator", "MS 플라이트 시뮬레이터", "veryHigh", {
    genre: ["Simulation"],
    cpuSensitivity: 4,
    vramRecommendedGb: 16,
  }),
  game("helldivers-2", "헬다이버즈 2", "high", {
    genre: ["Shooter"],
  }),
  game("first-descendant", "퍼스트 디센던트", "high", {
    genre: ["Looter Shooter"],
    supportsRayTracing: true,
  }),
  game("the-bazaar", "바자르", "low", {
    genre: ["Strategy"],
    demandType: "estimated",
  }),
  game("crimson-desert", "붉은사막", "veryHigh", {
    genre: ["Open World"],
    demandType: "estimated",
    notes: ["출시 전까지 예상치로 표시합니다."],
  }),
  game("vrchat", "VRChat", "high", {
    genre: ["VR"],
    vrGame: true,
    ramRecommendedGb: 32,
    vramRecommendedGb: 12,
  }),
  game("beat-saber", "비트세이버", "medium", {
    genre: ["VR", "Rhythm"],
    vrGame: true,
  }),
  game("half-life-alyx", "하프라이프 Alyx", "high", {
    genre: ["VR", "FPS"],
    vrGame: true,
  }),
  game("meta-quest-pcvr", "메타퀘스트 PCVR 일반", "high", {
    genre: ["VR"],
    demandType: "estimated",
    vrGame: true,
    notes: ["링크/에어링크 품질과 게임별 요구치에 따라 달라집니다."],
  }),
];
